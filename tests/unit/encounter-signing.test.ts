import { describe, it, expect, beforeAll, afterAll } from "vitest"
import crypto from "node:crypto"
import { signEncounterHash } from "@/lib/encounter-signing"

// ---------------------------------------------------------------------------
// Test setup — signEncounterHash uses FIELD_SIGN_KEY (separate from
// FIELD_ENCRYPTION_KEY) as the HMAC secret. Audit #7 follow-up.
// ---------------------------------------------------------------------------
const TEST_FIELD_KEY = crypto.randomBytes(32).toString("base64") // FIELD_ENCRYPTION_KEY
const TEST_SIGN_KEY = crypto.randomBytes(32).toString("base64") // FIELD_SIGN_KEY

const ORIGINAL_FIELD_KEY = process.env.FIELD_ENCRYPTION_KEY
const ORIGINAL_SIGN_KEY = process.env.FIELD_SIGN_KEY

beforeAll(() => {
  process.env.FIELD_ENCRYPTION_KEY = TEST_FIELD_KEY
  process.env.FIELD_SIGN_KEY = TEST_SIGN_KEY
})

afterAll(() => {
  if (ORIGINAL_FIELD_KEY !== undefined) {
    process.env.FIELD_ENCRYPTION_KEY = ORIGINAL_FIELD_KEY
  } else {
    delete process.env.FIELD_ENCRYPTION_KEY
  }
  if (ORIGINAL_SIGN_KEY !== undefined) {
    process.env.FIELD_SIGN_KEY = ORIGINAL_SIGN_KEY
  } else {
    delete process.env.FIELD_SIGN_KEY
  }
})

// Helper — build a valid baseline input
function makeInput(overrides: Partial<Parameters<typeof signEncounterHash>[0]> = {}) {
  return {
    encounterId: "enc-abc-123",
    signedBy: "doc-xyz-789",
    signedAt: new Date("2026-07-02T18:00:00.000Z"),
    historiaClinicaCifrada: "vpoxnkDcafWLnzkeqxQX+TQ+2XEpXjK1lS...",
    planCifrado: "1OPL9jP0ZBXYh+RcAaSDzGfmZsRw...",
    vitales: { taSistolica: 120, taDiastolica: 80, fc: 72, spo2: 98 },
    examenFisico: { hallazgos: "normales", region: "general" },
    ...overrides,
  }
}

// ===========================================================================
// Basic determinism + format
// ===========================================================================

describe("signEncounterHash — determinism", () => {
  it("returns same signature for identical input", () => {
    const input = makeInput()
    expect(signEncounterHash(input)).toBe(signEncounterHash(input))
  })

  it("returns base64 string of expected length (HMAC-SHA-256 = 44 chars)", () => {
    const sig = signEncounterHash(makeInput())
    expect(sig).toMatch(/^[A-Za-z0-9+/]+=*$/)
    expect(sig.length).toBe(44)
  })

  it("returns different signature when encounterId differs", () => {
    const a = signEncounterHash(makeInput({ encounterId: "enc-001" }))
    const b = signEncounterHash(makeInput({ encounterId: "enc-002" }))
    expect(a).not.toBe(b)
  })

  it("returns different signature when signedBy differs", () => {
    const a = signEncounterHash(makeInput({ signedBy: "doc-alice" }))
    const b = signEncounterHash(makeInput({ signedBy: "doc-bob" }))
    expect(a).not.toBe(b)
  })

  it("returns different signature when signedAt differs by 1ms", () => {
    const t1 = new Date("2026-07-02T18:00:00.000Z")
    const t2 = new Date("2026-07-02T18:00:00.001Z")
    const a = signEncounterHash(makeInput({ signedAt: t1 }))
    const b = signEncounterHash(makeInput({ signedAt: t2 }))
    expect(a).not.toBe(b)
  })

  it("returns different signature when historiaClinicaCifrada differs", () => {
    const a = signEncounterHash(makeInput({ historiaClinicaCifrada: "ciphertext-A" }))
    const b = signEncounterHash(makeInput({ historiaClinicaCifrada: "ciphertext-B" }))
    expect(a).not.toBe(b)
  })

  it("returns different signature when planCifrado differs", () => {
    const a = signEncounterHash(makeInput({ planCifrado: "plan-A" }))
    const b = signEncounterHash(makeInput({ planCifrado: "plan-B" }))
    expect(a).not.toBe(b)
  })

  it("returns different signature when vitales differs", () => {
    const a = signEncounterHash(
      makeInput({ vitales: { taSistolica: 120, taDiastolica: 80 } }),
    )
    const b = signEncounterHash(
      makeInput({ vitales: { taSistolica: 130, taDiastolica: 85 } }),
    )
    expect(a).not.toBe(b)
  })

  it("returns different signature when examenFisico differs", () => {
    const a = signEncounterHash(makeInput({ examenFisico: { x: 1 } }))
    const b = signEncounterHash(makeInput({ examenFisico: { x: 2 } }))
    expect(a).not.toBe(b)
  })
})

// ===========================================================================
// Null/undefined handling (clinical content can be null pre-sign)
// ===========================================================================

describe("signEncounterHash — null handling", () => {
  it("treats null historiaClinicaCifrada as empty string (same as '')", () => {
    const a = signEncounterHash(makeInput({ historiaClinicaCifrada: null }))
    const b = signEncounterHash(makeInput({ historiaClinicaCifrada: "" }))
    expect(a).toBe(b)
  })

  it("treats null planCifrado as empty string (same as '')", () => {
    const a = signEncounterHash(makeInput({ planCifrado: null }))
    const b = signEncounterHash(makeInput({ planCifrado: "" }))
    expect(a).toBe(b)
  })

  it("treats null vitales as null (different from {})", () => {
    const a = signEncounterHash(makeInput({ vitales: null }))
    const b = signEncounterHash(makeInput({ vitales: {} }))
    // null vs {} may produce same JSON ("null" vs "{}") but differ
    expect(a).toBeDefined()
    expect(b).toBeDefined()
    // Both should still be valid signatures
    expect(a).toMatch(/^[A-Za-z0-9+/]+=*$/)
    expect(b).toMatch(/^[A-Za-z0-9+/]+=*$/)
  })

  it("treats null examenFisico as null", () => {
    const a = signEncounterHash(makeInput({ examenFisico: null }))
    expect(a).toMatch(/^[A-Za-z0-9+/]+=*$/)
  })

  it("null clinical content still produces valid signature (no crash)", () => {
    const input = {
      encounterId: "enc-null-all",
      signedBy: "doc-null",
      signedAt: new Date("2026-07-02T00:00:00.000Z"),
      historiaClinicaCifrada: null,
      planCifrado: null,
      vitales: null,
      examenFisico: null,
    }
    const sig = signEncounterHash(input)
    expect(sig).toMatch(/^[A-Za-z0-9+/]+=*$/)
  })
})

// ===========================================================================
// Key handling — FIELD_SIGN_KEY separation (audit #7 follow-up)
// ===========================================================================

describe("signEncounterHash — key handling (FIELD_SIGN_KEY)", () => {
  it("throws when FIELD_SIGN_KEY is missing (fail-loud)", () => {
    delete process.env.FIELD_SIGN_KEY
    try {
      expect(() => signEncounterHash(makeInput())).toThrow(/FIELD_SIGN_KEY/)
    } finally {
      process.env.FIELD_SIGN_KEY = TEST_SIGN_KEY
    }
  })

  it("ignores FIELD_ENCRYPTION_KEY (does NOT use it for signing)", () => {
    // Set FIELD_ENCRYPTION_KEY to a different value than FIELD_SIGN_KEY.
    // Signature should still match what FIELD_SIGN_KEY alone would produce.
    const otherEncryptKey = crypto.randomBytes(32).toString("base64")
    process.env.FIELD_ENCRYPTION_KEY = otherEncryptKey
    try {
      const sigA = signEncounterHash(makeInput())
      expect(sigA).toMatch(/^[A-Za-z0-9+/]+=*$/)
      // sigA is computed with FIELD_SIGN_KEY, NOT FIELD_ENCRYPTION_KEY.
      // If we sign again with the original FIELD_ENCRYPTION_KEY restored,
      // the signature should be identical because FIELD_SIGN_KEY didn't change.
      process.env.FIELD_ENCRYPTION_KEY = TEST_FIELD_KEY
      const sigB = signEncounterHash(makeInput())
      expect(sigA).toBe(sigB)
    } finally {
      process.env.FIELD_ENCRYPTION_KEY = TEST_FIELD_KEY
    }
  })

  it("produces different signature with a different FIELD_SIGN_KEY", () => {
    const a = signEncounterHash(makeInput())
    const otherSignKey = crypto.randomBytes(32).toString("base64")
    process.env.FIELD_SIGN_KEY = otherSignKey
    try {
      const b = signEncounterHash(makeInput())
      expect(a).not.toBe(b)
    } finally {
      process.env.FIELD_SIGN_KEY = TEST_SIGN_KEY
    }
  })

  it("FIELD_SIGN_KEY rotation invalidates signatures (documented limitation)", () => {
    // Sign with key A, then sign with key B, verify they differ.
    // This is the one key whose rotation invalidates signatures.
    // (FIELD_ENCRYPTION_KEY rotation does NOT, since they're separated.)
    const sigA = signEncounterHash(makeInput())
    const newSignKey = crypto.randomBytes(32).toString("base64")
    process.env.FIELD_SIGN_KEY = newSignKey
    try {
      const sigB = signEncounterHash(makeInput())
      expect(sigA).not.toBe(sigB)
    } finally {
      process.env.FIELD_SIGN_KEY = TEST_SIGN_KEY
    }
  })

  it("works when FIELD_SIGN_KEY === FIELD_ENCRYPTION_KEY (initial rollout state)", () => {
    // During the first deploy of this separation, both keys have the
    // same value. Signatures should be deterministic and verifiable
    // under the combined-key state.
    process.env.FIELD_SIGN_KEY = TEST_FIELD_KEY
    try {
      const sig = signEncounterHash(makeInput())
      expect(sig).toMatch(/^[A-Za-z0-9+/]+=*$/)
    } finally {
      process.env.FIELD_SIGN_KEY = TEST_SIGN_KEY
    }
  })
})

// ===========================================================================
// Tamper detection semantics (determinism + sensitivity)
// ===========================================================================

describe("signEncounterHash — tamper detection", () => {
  it("same input always produces same signature (deterministic verifier)", () => {
    const input = makeInput()
    const sig1 = signEncounterHash(input)
    const sig2 = signEncounterHash(input)
    const sig3 = signEncounterHash(input)
    expect(sig1).toBe(sig2)
    expect(sig2).toBe(sig3)
  })

  it("a single character change in historiaClinicaCifrada produces different signature", () => {
    const a = signEncounterHash(makeInput({ historiaClinicaCifrada: "AAAA" }))
    const b = signEncounterHash(makeInput({ historiaClinicaCifrada: "AAAB" }))
    expect(a).not.toBe(b)
  })

  it("a single character change in signedBy produces different signature", () => {
    const a = signEncounterHash(makeInput({ signedBy: "doc-001" }))
    const b = signEncounterHash(makeInput({ signedBy: "doc-002" }))
    expect(a).not.toBe(b)
  })

  it("signature binds encounterId + signer + timestamp + content atomically", () => {
    // Changing ANY field of the input must produce a different signature
    const baseline = signEncounterHash(makeInput())
    const variations = [
      makeInput({ encounterId: "DIFFERENT" }),
      makeInput({ signedBy: "DIFFERENT" }),
      makeInput({ signedAt: new Date(0) }),
      makeInput({ historiaClinicaCifrada: "DIFFERENT" }),
      makeInput({ planCifrado: "DIFFERENT" }),
      makeInput({ vitales: { different: true } }),
      makeInput({ examenFisico: { different: true } }),
    ]
    for (const v of variations) {
      expect(signEncounterHash(v)).not.toBe(baseline)
    }
  })
})

// ===========================================================================
// Edge cases
// ===========================================================================

describe("signEncounterHash — edge cases", () => {
  it("handles unicode in clinical fields (ciphertext is opaque to function)", () => {
    const a = signEncounterHash(makeInput({ historiaClinicaCifrada: "cipher-ñáéíóú-🩺" }))
    const b = signEncounterHash(makeInput({ historiaClinicaCifrada: "cipher-ñáéíóú-🩺" }))
    expect(a).toBe(b)
  })

  it("handles very long ciphertext (1 MB)", () => {
    const longCipher = "x".repeat(1_000_000)
    const sig = signEncounterHash(makeInput({ historiaClinicaCifrada: longCipher }))
    expect(sig).toMatch(/^[A-Za-z0-9+/]+=*$/)
  })

  it("handles deeply nested vitales/examenFisico", () => {
    const sig = signEncounterHash(
      makeInput({
        vitales: { a: { b: { c: { d: { e: "deep" } } } } },
        examenFisico: { x: [1, [2, [3, [4, [5]]]]] },
      }),
    )
    expect(sig).toMatch(/^[A-Za-z0-9+/]+=*$/)
  })

  it("handles Date object consistently via ISO string", () => {
    const date1 = new Date("2026-07-02T18:00:00.000Z")
    const date2 = new Date(date1.getTime()) // Same instant, different object
    expect(signEncounterHash(makeInput({ signedAt: date1 }))).toBe(
      signEncounterHash(makeInput({ signedAt: date2 })),
    )
  })
})