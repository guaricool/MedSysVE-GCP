import { describe, it, expect, afterAll, beforeEach, vi } from "vitest"
import {
  loadFlags,
  getFlags,
  isAIFeatureEnabled,
  isExperimentalEnabled,
  isStripeLiveMode,
  DEFAULT_FLAGS,
  __resetFlagsCache,
} from "@/lib/feature-flags"

// ===========================================================================
// Setup / teardown
// ===========================================================================

const ORIGINAL_FEATURE_FLAGS = process.env.FEATURE_FLAGS
const ORIGINAL_STRIPE_KEY = process.env.STRIPE_SECRET_KEY

beforeEach(() => {
  __resetFlagsCache()
})

afterAll(() => {
  if (ORIGINAL_FEATURE_FLAGS !== undefined) {
    process.env.FEATURE_FLAGS = ORIGINAL_FEATURE_FLAGS
  } else {
    delete process.env.FEATURE_FLAGS
  }
  if (ORIGINAL_STRIPE_KEY !== undefined) {
    process.env.STRIPE_SECRET_KEY = ORIGINAL_STRIPE_KEY
  } else {
    delete process.env.STRIPE_SECRET_KEY
  }
  __resetFlagsCache()
})

function setEnv(value: string | undefined) {
  if (value === undefined) {
    delete process.env.FEATURE_FLAGS
  } else {
    process.env.FEATURE_FLAGS = value
  }
  __resetFlagsCache()
}

// ===========================================================================
// loadFlags + getFlags
// ===========================================================================

describe("loadFlags — defaults", () => {
  beforeEach(() => setEnv(undefined))

  it("returns defaults when FEATURE_FLAGS is missing", () => {
    const flags = loadFlags()
    expect(flags.ai.enabled).toBe(true)
    expect(flags.ai.rolloutPercent).toBe(100)
    expect(flags.experimental).toEqual({})
  })

  it("returns a defensive copy (mutating result doesn't affect next call)", () => {
    const a = loadFlags()
    a.ai.enabled = false
    a.experimental.x = true
    const b = loadFlags()
    expect(b.ai.enabled).toBe(true)
    expect(b.experimental).toEqual({})
  })

  it("returns DEFAULT_FLAGS reference when nothing is set", () => {
    expect(getFlags().ai).toEqual(DEFAULT_FLAGS.ai)
  })
})

describe("loadFlags — parsing", () => {
  it("merges partial JSON with defaults", () => {
    setEnv(JSON.stringify({ ai: { enabled: false } }))
    const flags = loadFlags()
    expect(flags.ai.enabled).toBe(false)
    expect(flags.ai.rolloutPercent).toBe(100) // default preserved
  })

  it("merges experimental flags", () => {
    setEnv(JSON.stringify({ experimental: { newDashboard: true } }))
    expect(isExperimentalEnabled("newDashboard")).toBe(true)
    expect(isExperimentalEnabled("notSet")).toBe(false)
  })

  it("falls back to defaults on invalid JSON (does NOT throw)", () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
    setEnv("not valid json {")
    const flags = loadFlags()
    expect(flags).toEqual(DEFAULT_FLAGS)
    expect(consoleSpy).toHaveBeenCalled()
    // First arg of the warning call should mention FEATURE_FLAGS
    const firstCall = consoleSpy.mock.calls[0]
    expect(String(firstCall[0])).toContain("FEATURE_FLAGS")
    consoleSpy.mockRestore()
  })

  it("clamps rolloutPercent to [0, 100]", () => {
    setEnv(JSON.stringify({ ai: { rolloutPercent: 200 } }))
    expect(loadFlags().ai.rolloutPercent).toBe(100)
    setEnv(JSON.stringify({ ai: { rolloutPercent: -5 } }))
    expect(loadFlags().ai.rolloutPercent).toBe(0)
  })

  it("floors non-integer rolloutPercent", () => {
    setEnv(JSON.stringify({ ai: { rolloutPercent: 33.7 } }))
    expect(loadFlags().ai.rolloutPercent).toBe(33)
  })

  it("uses 100 when rolloutPercent is NaN/non-finite", () => {
    setEnv(JSON.stringify({ ai: { rolloutPercent: "abc" } }))
    expect(loadFlags().ai.rolloutPercent).toBe(100)
  })
})

describe("loadFlags — caching", () => {
  it("caches result for same env value", () => {
    setEnv(JSON.stringify({ ai: { enabled: false } }))
    const first = loadFlags()
    expect(first.ai.enabled).toBe(false)
    // Same env value should return same reference (cached)
    const second = loadFlags()
    expect(second).toBe(first)
  })

  it("re-reads when env value changes", () => {
    setEnv(JSON.stringify({ ai: { enabled: false } }))
    expect(loadFlags().ai.enabled).toBe(false)
    setEnv(JSON.stringify({ ai: { enabled: true } }))
    expect(loadFlags().ai.enabled).toBe(true)
  })
})

// ===========================================================================
// isAIFeatureEnabled
// ===========================================================================

describe("isAIFeatureEnabled — master switch", () => {
  it("returns false when ai.enabled is false (regardless of rollout)", () => {
    setEnv(JSON.stringify({ ai: { enabled: false, rolloutPercent: 100 } }))
    expect(isAIFeatureEnabled({ user: { id: "u1" } })).toBe(false)
  })

  it("returns true when ai.enabled is true and rollout is 100", () => {
    setEnv(undefined)
    expect(isAIFeatureEnabled({ user: { id: "u1" } })).toBe(true)
  })

  it("returns false when rollout is 0 (even with master on)", () => {
    setEnv(JSON.stringify({ ai: { enabled: true, rolloutPercent: 0 } }))
    expect(isAIFeatureEnabled({ user: { id: "u1" } })).toBe(false)
  })
})

describe("isAIFeatureEnabled — gradual rollout", () => {
  it("deterministic per user (same userId always returns same answer)", () => {
    setEnv(JSON.stringify({ ai: { enabled: true, rolloutPercent: 50 } }))
    const a = isAIFeatureEnabled({ user: { id: "user-abc" } })
    const b = isAIFeatureEnabled({ user: { id: "user-abc" } })
    expect(a).toBe(b)
  })

  it("different users may have different buckets at 50% rollout", () => {
    setEnv(JSON.stringify({ ai: { enabled: true, rolloutPercent: 50 } }))
    // Sample 100 users, count how many are enabled
    let enabled = 0
    for (let i = 0; i < 100; i++) {
      if (isAIFeatureEnabled({ user: { id: `user-${i}` } })) enabled++
    }
    // Should be approximately 50 (allow ±15 for hash distribution)
    expect(enabled).toBeGreaterThan(35)
    expect(enabled).toBeLessThan(65)
  })

  it("at 0% rollout, NO users are enabled", () => {
    setEnv(JSON.stringify({ ai: { enabled: true, rolloutPercent: 0 } }))
    for (let i = 0; i < 50; i++) {
      expect(isAIFeatureEnabled({ user: { id: `user-${i}` } })).toBe(false)
    }
  })

  it("at 100% rollout, ALL users are enabled", () => {
    setEnv(JSON.stringify({ ai: { enabled: true, rolloutPercent: 100 } }))
    for (let i = 0; i < 50; i++) {
      expect(isAIFeatureEnabled({ user: { id: `user-${i}` } })).toBe(true)
    }
  })
})

describe("isAIFeatureEnabled — no session", () => {
  it("returns false when session is null and rollout < 100", () => {
    setEnv(JSON.stringify({ ai: { enabled: true, rolloutPercent: 50 } }))
    expect(isAIFeatureEnabled(null)).toBe(false)
  })

  it("returns true when session is null and rollout is 100", () => {
    setEnv(JSON.stringify({ ai: { enabled: true, rolloutPercent: 100 } }))
    expect(isAIFeatureEnabled(null)).toBe(true)
  })

  it("returns false when master switch is off, regardless of session", () => {
    setEnv(JSON.stringify({ ai: { enabled: false, rolloutPercent: 100 } }))
    expect(isAIFeatureEnabled(null)).toBe(false)
    expect(isAIFeatureEnabled({ user: null })).toBe(false)
    expect(isAIFeatureEnabled({ user: { id: "u1" } })).toBe(false)
  })

  it("denies session without user.id at partial rollout", () => {
    setEnv(JSON.stringify({ ai: { enabled: true, rolloutPercent: 50 } }))
    expect(isAIFeatureEnabled({ user: null })).toBe(false)
    expect(isAIFeatureEnabled({ user: {} })).toBe(false)
  })
})

// ===========================================================================
// isExperimentalEnabled
// ===========================================================================

describe("isExperimentalEnabled", () => {
  it("returns false for unset flags", () => {
    setEnv(undefined)
    expect(isExperimentalEnabled("anything")).toBe(false)
  })

  it("returns true when flag is explicitly true", () => {
    setEnv(JSON.stringify({ experimental: { newDashboard: true } }))
    expect(isExperimentalEnabled("newDashboard")).toBe(true)
  })

  it("returns false when flag is explicitly false", () => {
    setEnv(JSON.stringify({ experimental: { newDashboard: false } }))
    expect(isExperimentalEnabled("newDashboard")).toBe(false)
  })

  it("returns false for non-existent flags even when others are set", () => {
    setEnv(JSON.stringify({ experimental: { a: true } }))
    expect(isExperimentalEnabled("b")).toBe(false)
  })
})

// ===========================================================================
// isStripeLiveMode
// ===========================================================================

describe("isStripeLiveMode", () => {
  it("returns true for sk_live_ prefix", () => {
    process.env.STRIPE_SECRET_KEY = "sk_live_abc123"
    expect(isStripeLiveMode()).toBe(true)
  })

  it("returns false for sk_test_ prefix", () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_abc123"
    expect(isStripeLiveMode()).toBe(false)
  })

  it("returns false when key is missing", () => {
    delete process.env.STRIPE_SECRET_KEY
    expect(isStripeLiveMode()).toBe(false)
  })

  it("returns false for unknown prefix (safe default)", () => {
    process.env.STRIPE_SECRET_KEY = "rk_live_xyz"
    expect(isStripeLiveMode()).toBe(false)
    process.env.STRIPE_SECRET_KEY = "invalid_key"
    expect(isStripeLiveMode()).toBe(false)
  })
})
