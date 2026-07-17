/**
 * Feature flags for MedSysVE.
 *
 * Single source of truth for runtime toggles. Loaded from FEATURE_FLAGS env
 * var (JSON), with safe defaults if missing or malformed.
 *
 * ## Why this exists
 *
 * Before this module, the only way to turn off AI features, switch Stripe
 * to live mode, or experiment with new behavior was to redeploy with a code
 * change. Now you can flip a flag in Coolify → Environment → FEATURE_FLAGS,
 * redeploy, and the change takes effect.
 *
 * ## Usage
 *
 * ```typescript
 * import { isAIFeatureEnabled, isStripeLiveMode } from "@/lib/feature-flags"
 *
 * if (!isAIFeatureEnabled(session)) {
 *   throw new TRPCError({ code: "FEATURE_DISABLED", message: "AI temporarily disabled" })
 * }
 *
 * if (isStripeLiveMode()) {
 *   // use live Stripe API
 * }
 * ```
 *
 * ## Format of FEATURE_FLAGS env var
 *
 * ```json
 * {
 *   "ai": { "enabled": true, "rolloutPercent": 100 },
 *   "experimental": { "newDashboard": true, "betaFeature": false }
 * }
 * ```
 *
 * - `ai.enabled`: master switch for AI features. Default: `true`.
 * - `ai.rolloutPercent`: 0-100. Hash(session.id) % 100 < rolloutPercent → enabled
 *   for that user. Useful for gradual rollout. Default: `100`.
 * - `experimental.<key>`: free-form bool map. Use `isExperimentalEnabled("newDashboard")`.
 *
 * ## Stripe live mode
 *
 * NOT controlled via FEATURE_FLAGS — auto-detected from `STRIPE_SECRET_KEY`
 * prefix (`sk_live_` vs `sk_test_`). Avoids config drift where the flag
 * says live but the key is test (or vice versa).
 *
 * ## Defaults
 *
 * If FEATURE_FLAGS is missing or malformed, defaults are used:
 * - AI: enabled, 100% rollout
 * - Experimental: all false
 *
 * Invalid JSON does NOT throw — it logs a warning and uses defaults. This
 * ensures a malformed env var doesn't take down the whole app.
 */

import crypto from "node:crypto"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FeatureFlags {
  ai: { enabled: boolean; rolloutPercent: number }
  experimental: Record<string, boolean>
}

export const DEFAULT_FLAGS: FeatureFlags = {
  ai: { enabled: true, rolloutPercent: 100 },
  experimental: {},
}

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

let cachedFlags: FeatureFlags | null = null
let cachedRaw: string | null = null

/**
 * Parse FEATURE_FLAGS env var. Returns merged flags (defaults overridden by
 * parsed JSON). Never throws — invalid JSON falls back to defaults with a
 * console warning.
 */
export function loadFlags(): FeatureFlags {
  const raw = process.env.FEATURE_FLAGS
  if (!raw) return cloneFlags(DEFAULT_FLAGS)
  if (raw === cachedRaw && cachedFlags) return cachedFlags

  let parsed: Partial<FeatureFlags> = {}
  try {
    parsed = JSON.parse(raw) as Partial<FeatureFlags>
  } catch (err) {
    console.warn(
      "[feature-flags] FEATURE_FLAGS env var is not valid JSON, using defaults:",
      err instanceof Error ? err.message : String(err),
    )
    cachedRaw = raw
    cachedFlags = cloneFlags(DEFAULT_FLAGS)
    return cachedFlags
  }

  const merged: FeatureFlags = {
    ai: {
      enabled: parsed.ai?.enabled ?? DEFAULT_FLAGS.ai.enabled,
      rolloutPercent: clampPercent(parsed.ai?.rolloutPercent ?? DEFAULT_FLAGS.ai.rolloutPercent),
    },
    experimental: {
      ...DEFAULT_FLAGS.experimental,
      ...(parsed.experimental ?? {}),
    },
  }
  cachedRaw = raw
  cachedFlags = merged
  return merged
}

/**
 * Force the in-memory cache to be re-read from env on the next loadFlags().
 * Test-only — do NOT call from production code.
 */
export function __resetFlagsCache(): void {
  cachedFlags = null
  cachedRaw = null
}

// ---------------------------------------------------------------------------
// Convenience accessors
// ---------------------------------------------------------------------------

/**
 * Get the current flags (loads from env if not cached).
 */
export function getFlags(): FeatureFlags {
  return loadFlags()
}

/**
 * Check if AI features are enabled for the given user.
 *
 * Decision tree:
 * 1. Master `ai.enabled` switch off → false (no exceptions)
 * 2. `rolloutPercent >= 100` → true (all users enabled, if master is on)
 * 3. `rolloutPercent <= 0` → false (no users enabled)
 * 4. `rolloutPercent` in (0, 100):
 *    - If session has a user.id, deterministic hash → bucket < percent
 *    - If session has no user.id, deny (no bucket to compare)
 *
 * No-session-deny is the safer default: callers without a user context
 * (background jobs, system tasks) should not silently bypass rollout.
 */
export function isAIFeatureEnabled(
  session?: { user?: { id?: string } | null } | null,
): boolean {
  const flags = loadFlags()
  if (!flags.ai.enabled) return false

  const userId = session?.user?.id
  if (userId) {
    // Audit S10 (2026-07-07): per-doctor override takes precedence over
    // the rollout bucket. If the admin set an override for this doctor,
    // honor it (whether enabling or disabling) — even when the global
    // rollout is 100% or 0%. Without this, an admin couldn't disable AI
    // for a single misbehaving doctor without flipping the global switch.
    //
    // The sync helper is a cache lookup: on the first call the cache
    // is empty and we fall through to the bucket. On subsequent calls
    // (or after __resetOverrideCache() was called) the value is loaded.
    // We accept up to 30s of eventual consistency on a freshly-set
    // override — the featureFlag.setOverride router invalidates the
    // cache synchronously so admin changes take effect on the very
    // next request.
    const override = getFeatureOverrideSync(userId, "ai")
    if (override !== undefined) {
      return override
    }
  }

  const percent = flags.ai.rolloutPercent
  if (percent >= 100) return true
  if (percent <= 0) return false

  if (!userId) {
    // No user context — deny. Rollout requires a stable user bucket.
    return false
  }

  const bucket = userBucket(userId)
  return bucket < percent
}

/**
 * Per-doctor feature override lookup (audit S10, 2026-07-07).
 *
 * Returns:
 *   - `true` / `false` if there is an active, non-expired override for
 *     (doctorId, flagKey). The caller MUST honor this value.
 *   - `undefined` if no override exists OR it has expired. Caller falls
 *     back to the global rollout logic.
 *
 * **Why sync?**
 *   - The check is on the hot path of every AI endpoint request (already
 *     4 layers of work: auth, feature flag, rate limit, prompt guard).
 *     Adding a DB roundtrip would push P95 over the 200ms target.
 *   - We accept eventual consistency: a freshly-set override may take
 *     up to FEATURE_OVERRIDE_CACHE_MS to take effect. This is fine
 *     because overrides are operational tools, not security gates.
 *
 * **Why fail-open?**
 *   - If the DB is unreachable, the rollout bucket still applies
 *     (per audit S8 fail-open principle).
 *   - This means: DB outage ≠ forced feature enable. The global
 *     `ai.enabled` master switch is still consulted in `isAIFeatureEnabled`
 *     before this helper runs.
 */
const FEATURE_OVERRIDE_CACHE_MS = 30_000
interface OverrideCacheEntry {
  value: boolean | undefined
  expiresAt: number
}
const overrideCache = new Map<string, OverrideCacheEntry>()

function getFeatureOverrideSync(
  doctorId: string,
  flagKey: string,
): boolean | undefined {
  const cacheKey = `${flagKey}:${doctorId}`
  const now = Date.now()
  const cached = overrideCache.get(cacheKey)
  if (cached && cached.expiresAt > now) {
    return cached.value
  }
  // We kick off the async refresh but return undefined immediately on miss.
  // The next request (within FEATURE_OVERRIDE_CACHE_MS) will have it cached.
  void refreshOverrideCache(doctorId, flagKey, cacheKey)
  return undefined
}

async function refreshOverrideCache(
  doctorId: string,
  flagKey: string,
  cacheKey: string,
): Promise<void> {
  try {
    // Lazy import: avoid pulling Prisma into the Edge runtime where this
    // module might also be imported. The function only fires from the
    // Node.js runtime path (AI route handlers), not from proxy.ts.
    const { db } = await import("./db")
    const row = await db.doctorFeatureOverride.findUnique({
      where: { doctorId_flagKey: { doctorId, flagKey } },
      select: { enabled: true, expiresAt: true },
    })
    const now = new Date()
    if (row && (!row.expiresAt || row.expiresAt > now)) {
      overrideCache.set(cacheKey, {
        value: row.enabled,
        expiresAt: Date.now() + FEATURE_OVERRIDE_CACHE_MS,
      })
    } else {
      overrideCache.set(cacheKey, {
        value: undefined,
        expiresAt: Date.now() + FEATURE_OVERRIDE_CACHE_MS,
      })
    }
  } catch {
    // Fail-open: leave cache as-is, next request retries.
  }
}

/**
 * Public async version for the admin router (which needs the truth
 * immediately to confirm a set/clear succeeded). Bypasses the cache.
 */
export async function getFeatureOverride(
  doctorId: string,
  flagKey: string,
): Promise<boolean | undefined> {
  try {
    const { db } = await import("./db")
    const row = await db.doctorFeatureOverride.findUnique({
      where: { doctorId_flagKey: { doctorId, flagKey } },
      select: { enabled: true, expiresAt: true },
    })
    if (!row) return undefined
    if (row.expiresAt && row.expiresAt < new Date()) return undefined
    return row.enabled
  } catch {
    return undefined
  }
}

/**
 * Test-only: clear the in-memory override cache.
 */
export function __resetOverrideCache(): void {
  overrideCache.clear()
}

/**
 * Check if a specific experimental flag is enabled.
 */
export function isExperimentalEnabled(key: string): boolean {
  const flags = loadFlags()
  return flags.experimental[key] === true
}

/**
 * Detect Stripe live mode from STRIPE_SECRET_KEY prefix.
 *
 * Returns `true` if the key starts with `sk_live_`, `false` if it starts
 * with `sk_test_`, and `false` if not set or unknown prefix (safe default).
 */
export function isStripeLiveMode(): boolean {
  const key = process.env.STRIPE_SECRET_KEY ?? ""
  return key.startsWith("sk_live_")
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_FLAGS.ai.rolloutPercent
  if (value < 0) return 0
  if (value > 100) return 100
  return Math.floor(value)
}

/**
 * Map a user ID to a stable bucket in [0, 100). Used for percentage rollout.
 * SHA-256 of the user ID, take first 4 bytes as uint32, mod 100.
 */
function userBucket(userId: string): number {
  const hash = crypto.createHash("sha256").update(userId).digest()
  // Read first 4 bytes as big-endian uint32.
  const num = hash.readUInt32BE(0)
  return num % 100
}

function cloneFlags(flags: FeatureFlags): FeatureFlags {
  return {
    ai: { ...flags.ai },
    experimental: { ...flags.experimental },
  }
}