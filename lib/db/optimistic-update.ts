/**
 * Optimistic update helper for Prisma (Audit S9, 2026-07-07).
 *
 * Pattern: two doctors (or a doctor + auto-save debounce) editing the same
 * encounter concurrently used to be last-write-wins — the second `.update()`
 * silently overwrote the first doctor's edits with no warning. This helper
 * implements a lightweight optimistic-locking protocol on top of Prisma by
 * adding an integer `version` column that's incremented on every successful
 * write. Mutations compare the caller-supplied `expectedVersion` against the
 * current row value; mismatches throw `TRPCError` with `CONFLICT`.
 *
 * Why not `SELECT ... FOR UPDATE`?
 *   - Prisma doesn't expose row-level locks cleanly and we'd be reinventing
 *     them across every procedure.
 *   - Auto-save debounce paths (1.5s) and human edits both want to *succeed*
 *     in isolation; lock-based contention would block benign concurrent reads.
 *   - Version-based optimistic locking is the standard pattern in tRPC +
 *     Next.js apps (Stripe, GitHub-style API consumers, etc.) and the
 *     failure mode (CONFLICT) maps cleanly to "refetch + reapply".
 *
 * Usage:
 *   import { optimisticUpdate, OptimisticUpdateError } from "@/lib/db/optimistic-update"
 *
 *   try {
 *     const updated = await optimisticUpdate(ctx.db, "encounter", input.id, {
 *       expectedVersion: input.version,
 *       data: { motivoCifrado: ..., motivoHmac: ..., version: { increment: 1 } },
 *       workspaceId: ctx.session.workspaceId,  // tenant scope, optional
 *     })
 *   } catch (err) {
 *     if (err instanceof OptimisticUpdateError) {
 *       // err.cause has the actual conflict details (currentVersion, etc.)
 *       throw new TRPCError({ code: "CONFLICT", message: err.message, cause: err.cause })
 *     }
 *     throw err
 *   }
 *
 * Defense in depth:
 *   - The `version` field is part of the WHERE clause in `updateMany`, so
 *     there's zero window for a TOCTOU race: even if two requests arrive at
 *     the same millisecond, only ONE matches the version and the other
 *     sees `count === 0` and throws.
 *   - When `expectedVersion` is `undefined`, we still increment version but
 *     do NOT throw on mismatch (legacy callers, gradual rollout). Routes
 *     migrating to optimistic locking should require `expectedVersion` in
 *     their input schema and document the failure mode.
 *
 * @see docs/AUDIT_BACKLOG.md#12 for the audit that produced this.
 */

import { TRPCError } from "@trpc/server"
import type { PrismaClient } from "@prisma/client"

// The interface we need from PrismaClient. We accept a structural type so
// tests can pass a mock without pulling the whole PrismaClient into scope.
export interface OptimisticUpdateClient {
  encounter: {
    updateMany: (args: {
      where: Record<string, unknown>
      data: Record<string, unknown>
    }) => Promise<{ count: number }>
    findFirst: (args: {
      where: Record<string, unknown>
      select?: Record<string, unknown>
    }) => Promise<Record<string, unknown> | null>
  }
  // Extend here when other tables adopt optimistic locking.
}

export interface OptimisticUpdateArgs {
  /**
   * The integer version the caller expected to find on the row. If the row's
   * current version differs, the update is a no-op and we throw CONFLICT.
   *
   * Set `undefined` to skip the version check (last-write-wins behavior).
   * Most callers should NOT do this — set it explicitly when migrating to
   * optimistic locking.
   */
  expectedVersion?: number
  /**
   * The data to write. IMPORTANT: include `version: { increment: 1 }` in
   * your data object so successful writes advance the counter. The helper
   * does NOT auto-inject this — callers must be explicit so the contract
   * is visible at the call site.
   */
  data: Record<string, unknown>
  /** Optional workspaceId for tenant-scoped tables (defense in depth). */
  workspaceId?: string
}

export class OptimisticUpdateError extends Error {
  readonly cause: {
    resourceId: string
    expectedVersion: number | undefined
    currentVersion: number | null
  }
  constructor(
    resourceId: string,
    expectedVersion: number | undefined,
    currentVersion: number | null,
  ) {
    super(
      `Optimistic update conflict on ${resourceId}: expected version ${expectedVersion ?? "(none)"} but current is ${currentVersion ?? "(missing)"}. Refetch and reapply.`,
    )
    this.name = "OptimisticUpdateError"
    this.cause = { resourceId, expectedVersion, currentVersion }
  }
}

/**
 * Apply an optimistic-locked update. Returns the (re-read) row on success;
 * throws {@link OptimisticUpdateError} on version mismatch (caller should
 * convert to TRPCError CONFLICT). The actual `update` only fires when the
 * row exists AND the version matches — both conditions encoded in a single
 * `updateMany` call so there's no race between the check and the write.
 *
 * **Caveat**: `updateMany` does NOT return the updated rows. We re-read with
 * `findFirst` after a successful update so callers get a fresh object with
 * the incremented `version`. This is one extra round trip per write —
 * acceptable for a clinical app where write throughput is low and safety is
 * the priority.
 */
export async function optimisticUpdate(
  db: OptimisticUpdateClient,
  resource: "encounter",
  resourceId: string,
  args: OptimisticUpdateArgs,
): Promise<Record<string, unknown>> {
  const { expectedVersion, data, workspaceId } = args

  // Build the WHERE clause. If expectedVersion is provided, it MUST match.
  // We always include `id` to prevent cross-resource substitution.
  const where: Record<string, unknown> = { id: resourceId }
  if (expectedVersion !== undefined) where.version = expectedVersion
  if (workspaceId !== undefined) where.workspaceId = workspaceId

  const result = await db.encounter.updateMany({ where, data })
  if (result.count === 0) {
    // Either the row doesn't exist, OR the version mismatched, OR the row
    // is in a different workspace than the caller expected. Disambiguate
    // by reading the row (no filter on version, no tenant scope) so the
    // caller can map each case to the right TRPCError code.
    const current = await db.encounter.findFirst({
      where: { id: resourceId },
      select: { version: true, workspaceId: true },
    })
    if (!current) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Encounter ${resourceId} not found.`,
      })
    }
    // Cross-workspace probe: caller passed a workspaceId but the row
    // doesn't belong to it. Per multi-tenancy invariant this is FORBIDDEN
    // (NOT 404 — we don't leak existence across tenants, but the existence
    // is already implied by `version` matching would-be possible; either
    // way we forbid without saying more).
    if (
      typeof workspaceId === "string" &&
      (current.workspaceId as string | null) !== workspaceId
    ) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Encounter ${resourceId} is not in workspace ${workspaceId}.`,
      })
    }
    // Same workspace, version mismatch → OptimisticUpdateError.
    throw new OptimisticUpdateError(
      resourceId,
      expectedVersion,
      current.version as number | null,
    )
  }

  // Success — re-read so the caller sees the post-update state (including
  // the new version).
  const fresh = await db.encounter.findFirst({
    where: { id: resourceId },
  })
  if (!fresh) {
    // Vanishingly unlikely — the row was just updated and deleted in the
    // same tick. Treat as NOT_FOUND rather than CONFLICT.
    throw new TRPCError({
      code: "NOT_FOUND",
      message: `Encounter ${resourceId} disappeared after update.`,
    })
  }
  return fresh
}
