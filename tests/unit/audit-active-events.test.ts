import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  listActiveAuditEvents,
  getActiveAuditEvent,
  countActiveAuditEvents,
} from "@/lib/audit"

// Mock the db so we can assert the query construction (where clause + args)
// without spinning up Postgres. The actual DB call is just glue — what
// matters is that the where filter is correct.
//
// vi.mock factories are hoisted to the top of the file, so the mock
// variables must be declared with vi.hoisted (Vitest 0.31+) to avoid
// "Cannot access X before initialization".

const { findManyMock, findFirstMock, countMock } = vi.hoisted(() => ({
  findManyMock: vi.fn(),
  findFirstMock: vi.fn(),
  countMock: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    auditEvent: {
      findMany: findManyMock,
      findFirst: findFirstMock,
      count: countMock,
    },
  },
}))

beforeEach(() => {
  findManyMock.mockReset()
  findFirstMock.mockReset()
  countMock.mockReset()
  findManyMock.mockResolvedValue([])
  findFirstMock.mockResolvedValue(null)
  countMock.mockResolvedValue(0)
})

// ===========================================================================
// listActiveAuditEvents
// ===========================================================================

describe("listActiveAuditEvents", () => {
  it("filters by archivedAt: null by default", async () => {
    await listActiveAuditEvents("ws-1")
    expect(findManyMock).toHaveBeenCalledTimes(1)
    const args = findManyMock.mock.calls[0][0]
    expect(args.where.workspaceId).toBe("ws-1")
    expect(args.where.archivedAt).toBeNull()
  })

  it("includes archived rows when includeArchived: true", async () => {
    await listActiveAuditEvents("ws-1", { includeArchived: true })
    const args = findManyMock.mock.calls[0][0]
    expect(args.where.workspaceId).toBe("ws-1")
    expect(args.where.archivedAt).toBeUndefined()
  })

  it("applies optional filters (actor, action, resourceType, patient)", async () => {
    await listActiveAuditEvents("ws-1", {
      actorId: "doc-1",
      action: "VIEW_PATIENT",
      resourceType: "Encounter",
      patientId: "reg-1",
    })
    const args = findManyMock.mock.calls[0][0]
    expect(args.where.actorId).toBe("doc-1")
    expect(args.where.action).toBe("VIEW_PATIENT")
    expect(args.where.resourceType).toBe("Encounter")
    expect(args.where.patientId).toBe("reg-1")
  })

  it("applies from/to date range", async () => {
    const from = new Date("2026-01-01")
    const to = new Date("2026-12-31")
    await listActiveAuditEvents("ws-1", { from, to })
    const args = findManyMock.mock.calls[0][0]
    expect(args.where.createdAt.gte).toBe(from)
    expect(args.where.createdAt.lte).toBe(to)
  })

  it("supports only `from` (no upper bound)", async () => {
    const from = new Date("2026-01-01")
    await listActiveAuditEvents("ws-1", { from })
    const args = findManyMock.mock.calls[0][0]
    expect(args.where.createdAt.gte).toBe(from)
    expect(args.where.createdAt.lte).toBeUndefined()
  })

  it("supports only `to` (no lower bound)", async () => {
    const to = new Date("2026-12-31")
    await listActiveAuditEvents("ws-1", { to })
    const args = findManyMock.mock.calls[0][0]
    expect(args.where.createdAt.gte).toBeUndefined()
    expect(args.where.createdAt.lte).toBe(to)
  })

  it("uses sensible defaults (take=100, skip=0)", async () => {
    await listActiveAuditEvents("ws-1")
    const args = findManyMock.mock.calls[0][0]
    expect(args.take).toBe(100)
    expect(args.skip).toBe(0)
  })

  it("respects custom take and skip", async () => {
    await listActiveAuditEvents("ws-1", { take: 25, skip: 50 })
    const args = findManyMock.mock.calls[0][0]
    expect(args.take).toBe(25)
    expect(args.skip).toBe(50)
  })

  it("orders by createdAt desc (most recent first)", async () => {
    await listActiveAuditEvents("ws-1")
    const args = findManyMock.mock.calls[0][0]
    expect(args.orderBy).toEqual({ createdAt: "desc" })
  })
})

// ===========================================================================
// getActiveAuditEvent
// ===========================================================================

describe("getActiveAuditEvent", () => {
  it("filters by archivedAt: null by default", async () => {
    await getActiveAuditEvent("evt-1")
    const args = findFirstMock.mock.calls[0][0]
    expect(args.where.id).toBe("evt-1")
    expect(args.where.archivedAt).toBeNull()
  })

  it("includes archived rows when includeArchived: true", async () => {
    await getActiveAuditEvent("evt-1", { includeArchived: true })
    const args = findFirstMock.mock.calls[0][0]
    expect(args.where.id).toBe("evt-1")
    expect(args.where.archivedAt).toBeUndefined()
  })
})

// ===========================================================================
// countActiveAuditEvents
// ===========================================================================

describe("countActiveAuditEvents", () => {
  it("filters by archivedAt: null by default", async () => {
    await countActiveAuditEvents("ws-1")
    const args = countMock.mock.calls[0][0]
    expect(args.where.workspaceId).toBe("ws-1")
    expect(args.where.archivedAt).toBeNull()
  })

  it("applies same filters as listActiveAuditEvents", async () => {
    const from = new Date("2026-01-01")
    await countActiveAuditEvents("ws-1", {
      actorId: "doc-1",
      action: "EXPORT_PDF_HISTORY",
      from,
    })
    const args = countMock.mock.calls[0][0]
    expect(args.where.actorId).toBe("doc-1")
    expect(args.where.action).toBe("EXPORT_PDF_HISTORY")
    expect(args.where.createdAt.gte).toBe(from)
  })

  it("ignores take/skip (count has no pagination)", async () => {
    // The function signature strips take/skip via Omit<>.
    // Verify by passing them anyway and confirming they don't appear in args.
    // @ts-expect-error — take/skip not in valid options, but verify they're silently ignored
    await countActiveAuditEvents("ws-1", { take: 999, skip: 999 })
    const args = countMock.mock.calls[0][0]
    expect(args.take).toBeUndefined()
    expect(args.skip).toBeUndefined()
  })
})

// ===========================================================================
// Compliance reporting: includeArchived: true explicitly
// ===========================================================================

describe("compliance queries (includeArchived)", () => {
  it("listActiveAuditEvents: when includeArchived: true, the where clause has no archivedAt filter", async () => {
    await listActiveAuditEvents("ws-1", {
      includeArchived: true,
      actorId: "doc-1",
    })
    const args = findManyMock.mock.calls[0][0]
    // archivedAt should NOT be present in where when including archived
    expect("archivedAt" in args.where).toBe(false)
    expect(args.where.actorId).toBe("doc-1")
  })

  it("getActiveAuditEvent: when includeArchived: true, returns archived rows too", async () => {
    findFirstMock.mockResolvedValue({ id: "evt-1", archivedAt: new Date() })
    const result = await getActiveAuditEvent("evt-1", { includeArchived: true })
    expect(result).not.toBeNull()
    expect(findFirstMock.mock.calls[0][0].where.archivedAt).toBeUndefined()
  })
})
