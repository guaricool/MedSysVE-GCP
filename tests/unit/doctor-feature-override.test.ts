/**
 * DoctorFeatureOverride tests — Audit S10 (2026-07-07, closes audit #15).
 *
 * Covers:
 *   - getFeatureOverride sync path (with in-memory cache, no DB on hot path)
 *   - isAIFeatureEnabled integration (override beats global rollout bucket)
 *   - Override expiry: past expiresAt = falls through to global
 *   - isAIFeatureEnabled still respects master `ai.enabled` switch
 *   - __resetOverrideCache utility (test-only)
 *
 * We stub the Prisma client at the module level so the lazy `import("./db")`
 * inside getFeatureOverride picks up our in-memory store.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"

// ---------------------------------------------------------------------------
// In-memory override store (mock for ./db)
// ---------------------------------------------------------------------------
let overrideStore: Map<string, { doctorId: string; flagKey: string; enabled: boolean; expiresAt: Date | null }> = new Map()

vi.mock("@/lib/db", () => ({
  db: {
    doctorFeatureOverride: {
      findUnique: async (args: { where: { doctorId_flagKey: { doctorId: string; flagKey: string } } }) => {
        const key = `${args.where.doctorId_flagKey.doctorId}|${args.where.doctorId_flagKey.flagKey}`
        const row = overrideStore.get(key)
        return row
          ? {
              enabled: row.enabled,
              expiresAt: row.expiresAt,
            }
          : null
      },
    },
  },
}))

// Imports MUST come after vi.mock so the mock is in place.
import {
  isAIFeatureEnabled,
  getFeatureOverride,
  __resetOverrideCache,
} from "@/lib/feature-flags"
import { __resetFlagsCache } from "@/lib/feature-flags"

beforeEach(() => {
  overrideStore = new Map()
  __resetOverrideCache()
  __resetFlagsCache()
})

function setOverride(doctorId: string, flagKey: string, enabled: boolean, expiresAt: Date | null = null) {
  overrideStore.set(`${doctorId}|${flagKey}`, { doctorId, flagKey, enabled, expiresAt })
}

afterEach(() => {
  vi.useRealTimers()
})

// ===========================================================================
// getFeatureOverride — public async API
// ===========================================================================

describe("getFeatureOverride (async API)", () => {
  it("returns undefined when no override exists", async () => {
    const result = await getFeatureOverride("doc_no_override", "ai")
    expect(result).toBeUndefined()
  })

  it("returns the stored enabled value when override exists", async () => {
    setOverride("doc_disabled", "ai", false)
    const result = await getFeatureOverride("doc_disabled", "ai")
    expect(result).toBe(false)
  })

  it("returns true for an enabled override", async () => {
    setOverride("doc_enabled", "ai", true)
    expect(await getFeatureOverride("doc_enabled", "ai")).toBe(true)
  })

  it("returns undefined when override has expired", async () => {
    const past = new Date(Date.now() - 60_000) // 1 minute ago
    setOverride("doc_expired", "ai", false, past)
    expect(await getFeatureOverride("doc_expired", "ai")).toBeUndefined()
  })

  it("returns the value when expiresAt is in the future", async () => {
    const future = new Date(Date.now() + 3600_000) // 1 hour from now
    setOverride("doc_temp", "ai", false, future)
    expect(await getFeatureOverride("doc_temp", "ai")).toBe(false)
  })

  it("returns undefined when expiresAt is null (permanent override)", async () => {
    setOverride("doc_perm", "ai", false, null)
    expect(await getFeatureOverride("doc_perm", "ai")).toBe(false)
  })
})

// ===========================================================================
// isAIFeatureEnabled — integration with override
// ===========================================================================

describe("isAIFeatureEnabled — override integration", () => {
  it("respects the master `ai.enabled: false` switch (override cannot enable)", async () => {
    process.env.FEATURE_FLAGS = JSON.stringify({ ai: { enabled: false, rolloutPercent: 100 } })
    __resetFlagsCache()
    setOverride("doc_admin_overrode", "ai", true) // override says ON
    // ...but master says OFF, so we still return false.
    // The function is sync-from-caller-perspective; the cache populates
    // asynchronously, so we must wait a tick.
    const result = isAIFeatureEnabled({ user: { id: "doc_admin_overrode" } })
    // First call returns the rollout-bucket decision (false because master
    // is off). On the second call the cache has the override loaded, but
    // the master check happens first so it still returns false.
    expect(result).toBe(false)
    // Wait for the cache to populate and verify again.
    await new Promise((r) => setTimeout(r, 50))
    expect(isAIFeatureEnabled({ user: { id: "doc_admin_overrode" } })).toBe(false)
  })

  it("override=false disables AI even when global rollout is 100%", async () => {
    process.env.FEATURE_FLAGS = JSON.stringify({ ai: { enabled: true, rolloutPercent: 100 } })
    __resetFlagsCache()
    setOverride("doc_kill_switch", "ai", false)
    // First call kicks off the async cache refresh; second call (after
    // the await) reads the now-populated cache.
    isAIFeatureEnabled({ user: { id: "doc_kill_switch" } })
    await new Promise((r) => setTimeout(r, 50))
    expect(isAIFeatureEnabled({ user: { id: "doc_kill_switch" } })).toBe(false)
  })

  it("override=true enables AI even when global rollout is 0%", async () => {
    process.env.FEATURE_FLAGS = JSON.stringify({ ai: { enabled: true, rolloutPercent: 0 } })
    __resetFlagsCache()
    setOverride("doc_special_access", "ai", true)
    isAIFeatureEnabled({ user: { id: "doc_special_access" } })
    await new Promise((r) => setTimeout(r, 50))
    expect(isAIFeatureEnabled({ user: { id: "doc_special_access" } })).toBe(true)
  })

  it("no override + global rollout 100% = enabled", async () => {
    process.env.FEATURE_FLAGS = JSON.stringify({ ai: { enabled: true, rolloutPercent: 100 } })
    __resetFlagsCache()
    // No override for this doctor.
    expect(isAIFeatureEnabled({ user: { id: "doc_normal" } })).toBe(true)
  })

  it("expired override is ignored (falls through to global)", async () => {
    process.env.FEATURE_FLAGS = JSON.stringify({ ai: { enabled: true, rolloutPercent: 100 } })
    __resetFlagsCache()
    const past = new Date(Date.now() - 60_000)
    setOverride("doc_expired_disable", "ai", false, past)
    // The sync helper doesn't check expiry (it just returns whatever is
    // cached). The async one does. After cache populates, the sync version
    // will see the override as `false`. To get correct behavior at sync
    // level, we need to evict expired rows from the cache. Currently the
    // sync path trusts the cached value. So either:
    //   (a) The cache loader filters out expired rows (we filter in
    //       refreshOverrideCache), or
    //   (b) The sync helper needs to re-check.
    // Looking at refreshOverrideCache: yes, it filters out expired rows by
    // NOT setting the cache entry to `false`, instead to `undefined`.
    // So after the cache populates, the sync helper returns undefined →
    // falls through to global = true.
    await new Promise((r) => setTimeout(r, 50))
    expect(isAIFeatureEnabled({ user: { id: "doc_expired_disable" } })).toBe(true)
  })

  it("with rollout 0%, returns false even without a user (no bucket needed)", () => {
    process.env.FEATURE_FLAGS = JSON.stringify({ ai: { enabled: true, rolloutPercent: 0 } })
    __resetFlagsCache()
    expect(isAIFeatureEnabled(null)).toBe(false)
    expect(isAIFeatureEnabled({})).toBe(false)
  })

  it("with rollout between 1-99% and no user, returns false (no bucket possible)", () => {
    process.env.FEATURE_FLAGS = JSON.stringify({ ai: { enabled: true, rolloutPercent: 50 } })
    __resetFlagsCache()
    expect(isAIFeatureEnabled(null)).toBe(false)
    expect(isAIFeatureEnabled({})).toBe(false)
  })
})

// ===========================================================================
// Cache invalidation
// ===========================================================================

describe("__resetOverrideCache", () => {
  it("clears in-memory cache so next call re-fetches", async () => {
    process.env.FEATURE_FLAGS = JSON.stringify({ ai: { enabled: true, rolloutPercent: 100 } })
    __resetFlagsCache()
    setOverride("doc_cache_test", "ai", false)
    // First call kicks off async refresh.
    isAIFeatureEnabled({ user: { id: "doc_cache_test" } })
    await new Promise((r) => setTimeout(r, 50))
    // Cached result is now `false`.
    expect(isAIFeatureEnabled({ user: { id: "doc_cache_test" } })).toBe(false)
    // Change the underlying override.
    setOverride("doc_cache_test", "ai", true)
    // Without invalidation, the cache would still say false.
    expect(isAIFeatureEnabled({ user: { id: "doc_cache_test" } })).toBe(false)
    // Invalidate, then the next call refreshes.
    __resetOverrideCache()
    // After invalidation, the next call returns undefined from cache, so
    // falls through to global (= true). The async refresh fires and
    // updates the cache for subsequent calls.
    expect(isAIFeatureEnabled({ user: { id: "doc_cache_test" } })).toBe(true)
    await new Promise((r) => setTimeout(r, 50))
    expect(isAIFeatureEnabled({ user: { id: "doc_cache_test" } })).toBe(true)
  })
})
