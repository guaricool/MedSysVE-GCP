/**
 * Optimistic locking tests — Audit S9 (2026-07-07).
 *
 * Verifies that two concurrent updates to the same Encounter are detected
 * via the `version` field and that the loser receives a TRPCError CONFLICT
 * (caller is supposed to refetch + reapply). The protocol is in
 * `lib/db/optimistic-update.ts`.
 *
 * Strategy: stub `db.encounter.updateMany` + `findFirst` to simulate a
 * realistic concurrent-edit scenario. We do NOT spin up a real Postgres —
 * these tests verify the protocol, not the database. The `rotate-field-keys`
 * integration tests are separate (audit S11).
 */
import { describe, it, expect, beforeEach } from "vitest"
import {
  optimisticUpdate,
  OptimisticUpdateError,
} from "@/lib/db/optimistic-update"
import { TRPCError } from "@trpc/server"

interface EncounterRow {
  id: string
  workspaceId: string
  version: number
  motivoCifrado?: string | null
  motivoHmac?: string | null
  historiaClinicaCifrada?: string | null
  planCifrado?: string | null
  examenFisico?: unknown
  vitales?: unknown
  status: string
}

/**
 * Minimal in-memory Encounter simulator. Tracks the current row state and
 * only succeeds `updateMany` when `where` matches the current version.
 * This mirrors Prisma's semantics precisely enough for protocol tests.
 */
class FakeEncounterStore {
  private row: EncounterRow | null = null
  public updateCalls: Array<{ where: Record<string, unknown>; data: Record<string, unknown> }> = []

  seed(initial: EncounterRow) {
    this.row = { ...initial }
  }

  // Mirrors `db.encounter.updateMany`.
  updateMany = async (args: {
    where: Record<string, unknown>
    data: Record<string, unknown>
  }): Promise<{ count: number }> => {
    this.updateCalls.push(args)
    if (!this.row) return { count: 0 }
    const w = args.where
    if (w.id !== this.row.id) return { count: 0 }
    if (typeof w.version === "number" && w.version !== this.row.version) return { count: 0 }
    if (typeof w.workspaceId === "string" && w.workspaceId !== this.row.workspaceId) {
      return { count: 0 }
    }
    // Apply data minus the version increment (we model that ourselves).
    const { version: _v, ...rest } = args.data
    this.row = { ...this.row, ...rest, version: this.row.version + 1 } as EncounterRow
    return { count: 1 }
  }

  // Mirrors `db.encounter.findFirst` with the project shape we use.
  findFirst = async (args: {
    where: Record<string, unknown>
    select?: Record<string, unknown>
  }): Promise<Record<string, unknown> | null> => {
    if (!this.row) return null
    if (args.where.id !== this.row.id) return null
    if (typeof args.where.workspaceId === "string" && args.where.workspaceId !== this.row.workspaceId) {
      return null
    }
    return { ...this.row }
  }

  get current(): EncounterRow | null {
    return this.row
  }
}

let store: FakeEncounterStore

// Build a fake DB client mirroring the structural shape the helper accepts.
function buildFakeDb() {
  return {
    encounter: {
      updateMany: store.updateMany,
      findFirst: store.findFirst,
    },
  }
}

beforeEach(() => {
  store = new FakeEncounterStore()
  store.seed({
    id: "enc_1",
    workspaceId: "ws_1",
    version: 0,
    motivoCifrado: "initial ciphertext",
    motivoHmac: "hmac_initial",
    historiaClinicaCifrada: null,
    planCifrado: null,
    examenFisico: null,
    vitales: null,
    status: "DRAFT",
  })
})

// ===========================================================================
// Happy path
// ===========================================================================

describe("optimisticUpdate — happy path", () => {
  it("succeeds when expected version matches current", async () => {
    const db = buildFakeDb()
    const result = await optimisticUpdate(db, "encounter", "enc_1", {
      expectedVersion: 0,
      data: { motivoCifrado: "new ciphertext", version: { increment: 1 } } as never,
      workspaceId: "ws_1",
    })
    expect(result).toBeTruthy()
    expect((result as { version: number }).version).toBe(1)
    expect((result as { motivoCifrado: string }).motivoCifrado).toBe("new ciphertext")
    // The internal `version: { increment: 1 }` should NOT have been applied
    // as a literal — only the encounter row's version should be 1, not 2.
    expect(store.updateCalls).toHaveLength(1)
  })

  it("increments version from 0 to 1 after a single save", async () => {
    const db = buildFakeDb()
    await optimisticUpdate(db, "encounter", "enc_1", {
      expectedVersion: 0,
      data: { motivoCifrado: "x", version: { increment: 1 } } as never,
      workspaceId: "ws_1",
    })
    expect(store.current?.version).toBe(1)
  })

  it("increments version from 5 to 6 when called twice (sequential)", async () => {
    const db = buildFakeDb()
    await optimisticUpdate(db, "encounter", "enc_1", {
      expectedVersion: 0,
      data: { motivoCifrado: "v1", version: { increment: 1 } } as never,
      workspaceId: "ws_1",
    })
    const r2 = await optimisticUpdate(db, "encounter", "enc_1", {
      expectedVersion: 1,
      data: { motivoCifrado: "v2", version: { increment: 1 } } as never,
      workspaceId: "ws_1",
    })
    expect((r2 as { version: number }).version).toBe(2)
    expect(store.current?.version).toBe(2)
  })
})

// ===========================================================================
// Conflict path — the key behavior for audit S9
// ===========================================================================

describe("optimisticUpdate — conflict", () => {
  it("throws OptimisticUpdateError when expected version is stale", async () => {
    const db = buildFakeDb()
    // Simulate doctor-A's save advancing to version 1.
    await optimisticUpdate(db, "encounter", "enc_1", {
      expectedVersion: 0,
      data: { motivoCifrado: "doctorA", version: { increment: 1 } } as never,
      workspaceId: "ws_1",
    })
    // Now doctor-B's debounced save arrives with the stale version 0.
    let thrown: unknown = null
    try {
      await optimisticUpdate(db, "encounter", "enc_1", {
        expectedVersion: 0,
        data: { motivoCifrado: "doctorB", version: { increment: 1 } } as never,
        workspaceId: "ws_1",
      })
    } catch (e) {
      thrown = e
    }
    expect(thrown).toBeInstanceOf(OptimisticUpdateError)
    const err = thrown as InstanceType<typeof OptimisticUpdateError>
    expect(err.cause).toEqual({
      resourceId: "enc_1",
      expectedVersion: 0,
      currentVersion: 1,
    })
    // The data should NOT have been overwritten.
    expect(store.current?.motivoCifrado).toBe("doctorA")
    expect(store.current?.version).toBe(1)
  })

  it("throws NOT_FOUND when the encounter doesn't exist", async () => {
    const db = buildFakeDb()
    let thrown: unknown = null
    try {
      await optimisticUpdate(db, "encounter", "enc_missing", {
        expectedVersion: 0,
        data: { motivoCifrado: "x", version: { increment: 1 } } as never,
        workspaceId: "ws_1",
      })
    } catch (e) {
      thrown = e
    }
    expect(thrown).toBeInstanceOf(TRPCError)
    expect((thrown as { code: string }).code).toBe("NOT_FOUND")
  })

  it("respects workspaceId as a secondary check (FORBIDDEN on cross-tenant)", async () => {
    const db = buildFakeDb()
    let thrown: unknown = null
    try {
      await optimisticUpdate(db, "encounter", "enc_1", {
        expectedVersion: 0,
        data: { motivoCifrado: "x", version: { increment: 1 } } as never,
        // Wrong workspace — should fail with FORBIDDEN. We do NOT leak 404
        // because the row does exist (just elsewhere). This is by design:
        // we want to deny the probe, not silently 200.
        workspaceId: "ws_other",
      })
    } catch (e) {
      thrown = e
    }
    expect(thrown).toBeInstanceOf(TRPCError)
    expect((thrown as { code: string }).code).toBe("FORBIDDEN")
    // Row untouched.
    expect(store.current?.version).toBe(0)
  })

  it("supports concurrent-edit simulation: doctor-A wins, doctor-B sees CONFLICT", async () => {
    const db = buildFakeDb()
    // Both doctors load the encounter (version 0).
    const doctorAExpectedVersion = 0
    const doctorBExpectedVersion = 0

    // Doctor-A saves first.
    const resultA = await optimisticUpdate(db, "encounter", "enc_1", {
      expectedVersion: doctorAExpectedVersion,
      data: { motivoCifrado: "doctorA_edit", version: { increment: 1 } } as never,
      workspaceId: "ws_1",
    })
    expect(resultA).toBeTruthy()

    // Doctor-B then tries to save. Same expected version (0), but the row is
    // already at version 1.
    let conflict: unknown = null
    try {
      await optimisticUpdate(db, "encounter", "enc_1", {
        expectedVersion: doctorBExpectedVersion,
        data: { motivoCifrado: "doctorB_edit", version: { increment: 1 } } as never,
        workspaceId: "ws_1",
      })
    } catch (e) {
      conflict = e
    }
    expect(conflict).toBeInstanceOf(OptimisticUpdateError)
    expect((conflict as { cause: { currentVersion: number } }).cause.currentVersion).toBe(1)

    // Doctor-B now has correct version (1) and retries → succeeds.
    const resultB = await optimisticUpdate(db, "encounter", "enc_1", {
      expectedVersion: 1,
      data: { motivoCifrado: "doctorB_retry", version: { increment: 1 } } as never,
      workspaceId: "ws_1",
    })
    expect(resultB).toBeTruthy()
    // Doctor-B's retry overwrites A (last-write-wins on retry is intentional:
    // doctor-B saw they had to refetch and consciously chose to overwrite).
    expect(store.current?.motivoCifrado).toBe("doctorB_retry")
    expect(store.current?.version).toBe(2)
  })

  it("legacy path (no expectedVersion) does NOT throw on mismatch", async () => {
    const db = buildFakeDb()
    // First save advances to v1.
    await optimisticUpdate(db, "encounter", "enc_1", {
      expectedVersion: 0,
      data: { motivoCifrado: "v1", version: { increment: 1 } } as never,
      workspaceId: "ws_1",
    })
    // Second save with NO expectedVersion — legacy path → last-write-wins.
    const r = await optimisticUpdate(db, "encounter", "enc_1", {
      // no expectedVersion
      data: { motivoCifrado: "v2_legacy", version: { increment: 1 } } as never,
      workspaceId: "ws_1",
    })
    expect(r).toBeTruthy()
    expect(store.current?.motivoCifrado).toBe("v2_legacy")
  })
})

// ===========================================================================
// Defense in depth — no TOCTOU race
// ===========================================================================

describe("optimisticUpdate — protocol correctness", () => {
  it("version check happens INSIDE the updateMany WHERE, not before", async () => {
    const db = buildFakeDb()
    // The first call updates from 0 to 1.
    await optimisticUpdate(db, "encounter", "enc_1", {
      expectedVersion: 0,
      data: { motivoCifrado: "x", version: { increment: 1 } } as never,
      workspaceId: "ws_1",
    })
    // The second call with stale version MUST NOT update.
    let thrown: unknown = null
    try {
      await optimisticUpdate(db, "encounter", "enc_1", {
        expectedVersion: 0,
        data: { motivoCifrado: "y", version: { increment: 1 } } as never,
        workspaceId: "ws_1",
      })
    } catch (e) {
      thrown = e
    }
    expect(thrown).toBeInstanceOf(OptimisticUpdateError)
    // Both calls landed on the same store. The first updated to v1; the
    // second's `where {version: 0}` matched zero rows.
    expect(store.updateCalls).toHaveLength(2)
    // The where clauses should include version specifically.
    expect(store.updateCalls[0].where).toMatchObject({ id: "enc_1", version: 0, workspaceId: "ws_1" })
    expect(store.updateCalls[1].where).toMatchObject({ id: "enc_1", version: 0, workspaceId: "ws_1" })
  })

  it("post-update re-read returns the fresh row (including new version)", async () => {
    const db = buildFakeDb()
    const r = await optimisticUpdate(db, "encounter", "enc_1", {
      expectedVersion: 0,
      data: {
        motivoCifrado: "encrypted",
        motivoHmac: "hmac_new",
        historiaClinicaCifrada: "encrypted2",
        version: { increment: 1 },
      } as never,
      workspaceId: "ws_1",
    })
    expect((r as { version: number }).version).toBe(1)
    expect((r as { motivoHmac: string }).motivoHmac).toBe("hmac_new")
    expect((r as { historiaClinicaCifrada: string }).historiaClinicaCifrada).toBe("encrypted2")
  })
})
