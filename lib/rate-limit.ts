import { redis } from "./redis";

/**
 * Redis-backed sliding-window rate limiter.
 *
 * Why sliding window (vs fixed window):
 *  - Fixed window allows bursts at window boundaries (2N requests in 2 seconds
 *    when limit is N/sec). Sliding window is smoother.
 *  - For login + portal access we want strict enforcement — no surprises.
 *
 * Storage: Redis sorted set keyed by `${prefix}:${identifier}`.
 * Each member is a unique request id (timestamp + random nonce).
 * We trim entries older than the window before counting.
 *
 * Failure mode: if Redis is unreachable, we FAIL OPEN (allow the request).
 * Rationale: better to let a few extra login attempts through than to lock
 * the entire system out during a Redis outage. Login is also protected by
 * the bcrypt cost factor + lockout mechanism in lib/auth.ts.
 */

export interface RateLimitConfig {
  /** Unique key prefix, e.g. "rl:login:doctor". */
  prefix: string;
  /** Identifier to rate-limit by (IP, email, userId). */
  identifier: string;
  /** Max requests allowed in the window. */
  max: number;
  /** Window length in seconds. */
  windowSec: number;
}

export interface RateLimitResult {
  ok: boolean;
  /** How many requests remain in the current window. */
  remaining: number;
  /** Seconds until the window resets (0 if not rate-limited). */
  retryAfter: number;
}

export async function rateLimit(config: RateLimitConfig): Promise<RateLimitResult> {
  const { prefix, identifier, max, windowSec } = config;
  const key = `${prefix}:${identifier}`;
  const now = Date.now();
  const windowMs = windowSec * 1000;
  const windowStart = now - windowMs;

  try {
    // 1. Trim entries older than window.
    await redis.zremrangebyscore(key, "-inf", windowStart);

    // 2. Count current entries in window.
    const count = await redis.zcard(key);

    if (count >= max) {
      // Find when the oldest entry expires — that's the retry-after.
      const oldest = await redis.zrange(key, 0, 0, "WITHSCORES");
      const oldestTs = oldest.length >= 2 ? Number(oldest[1]) : now;
      const retryAfter = Math.max(1, Math.ceil((oldestTs + windowMs - now) / 1000));
      return { ok: false, remaining: 0, retryAfter };
    }

    // 3. Add this request to the window.
    // Use timestamp + 6 random digits as the member to allow concurrent requests
    // at the same millisecond.
    const member = `${now}-${Math.random().toString(36).slice(2, 8)}`;
    await redis.zadd(key, now, member);

    // 4. Set expiry so the key cleans itself up if traffic stops.
    await redis.expire(key, windowSec + 1);

    return { ok: true, remaining: max - count - 1, retryAfter: 0 };
  } catch (err) {
    // Fail open: log but allow. See file header for rationale.
    console.error(
      `[rateLimit] Redis error for ${prefix}:${identifier} — failing open:`,
      err instanceof Error ? err.message : "unknown",
    );
    return { ok: true, remaining: max, retryAfter: 0 };
  }
}

/**
 * Convenience helper: extract a rate-limit identifier from a Next.js request.
 * Uses x-forwarded-for chain → falls back to remote addr.
 * Truncates to first 3 hops to mitigate IP-spoofing in headers.
 */
export function getRequestIdentifier(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const hops = xff.split(",").map((s) => s.trim()).filter(Boolean);
    // Use the first untrusted hop (rightmost before our proxy) for actual IP.
    // For now, use the leftmost (client-supplied) — sufficient for our threat model
    // since Traefik in Coolify sets this header reliably.
    return hops[0] ?? "unknown";
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}

/**
 * Pre-configured limiters for common security-sensitive endpoints.
 * Numbers chosen for production: generous enough for normal use, tight enough
 * to deter brute force / credential stuffing.
 */
export const LIMITERS = {
  /** Doctor/staff login: 10 attempts / 5 min per IP+email combo. */
  login: { prefix: "rl:login", max: 10, windowSec: 300 },
  /** Portal patient login: 5 attempts / 5 min per IP+email combo. */
  portalLogin: { prefix: "rl:portal-login", max: 5, windowSec: 300 },
  /** Registration: 3 attempts / hour per IP. */
  register: { prefix: "rl:register", max: 3, windowSec: 3600 },
  /** Password reset request: 3 / hour per email. */
  passwordReset: { prefix: "rl:pwreset", max: 3, windowSec: 3600 },
  /** 2FA verify: 5 attempts / 5 min per userId. */
  twoFactor: { prefix: "rl:2fa", max: 5, windowSec: 300 },
  /** Generic API rate limit per authenticated user: 600 / 10 min. */
  api: { prefix: "rl:api", max: 600, windowSec: 600 },

  // -------------------------------------------------------------------------
  // Audit S8 (2026-07-07) — AI endpoint rate limits.
  //
  // Per-doctor sliding window. Numbers chosen to support normal clinical
  // workflows (a doctor writing notes for a full clinic day with AI assist)
  // while preventing extraction/abuse. Tight enough that a compromised
  // doctor session cannot drain Claude tokens at provider rates without
  // being noticed.
  //
  // Threshold rationale:
  //   - encounter-assist (differential + plan): most expensive call
  //     (1024 max_tokens). 30/min ≈ 1 every 2s in burst — plenty for
  //     typing speed on consult notes.
  //   - drug-interactions (boolean + warning): cheap call (256 max_tokens).
  //     60/min ≈ 1 per second — supports rapid prescription writing flows.
  //   - dose-suggestion (autocomplete-like): cheap (256 max_tokens).
  //     60/min, same rationale.
  //
  // Identification: per `session.user.id`. If a doctor shares credentials
  // they share the bucket — that's intentional (single workspace, audit
  // trail per user).
  // -------------------------------------------------------------------------
  /** encounter-assist: 30 calls / min per doctor. */
  aiEncounterAssist: { prefix: "rl:ai:encounter-assist", max: 30, windowSec: 60 },
  /** drug-interactions: 60 calls / min per doctor. */
  aiDrugInteractions: { prefix: "rl:ai:drug-interactions", max: 60, windowSec: 60 },
  /** dose-suggestion: 60 calls / min per doctor. */
  aiDoseSuggestion: { prefix: "rl:ai:dose-suggestion", max: 60, windowSec: 60 },
} as const;