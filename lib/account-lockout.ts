import { redis } from "./redis";
import { safeLog } from "./log-sanitizer";

/**
 * Account lockout — protects against brute force / credential stuffing.
 *
 * Strategy:
 *  - Failed login attempts tracked per email in Redis (key: `lock:email:<email>`).
 *  - After N consecutive failures within a sliding window, account is locked for
 *    a fixed duration (default: 15 minutes).
 *  - Successful login clears the counter.
 *
 * Why Redis (not DB):
 *  - Survives deploys (lockout state not lost on container restart).
 *  - Fast — no DB write on every failed attempt (DoS-resistant).
 *  - Auto-expires — no garbage collection needed.
 *
 * Why per-email (not per-IP):
 *  - IP-based is bypassed by botnets. Email-based protects the account itself.
 *  - Per-IP lockout lives in rate-limit.ts (covers a different threat model:
 *    same IP brute-forcing many emails).
 *
 * Compliance:
 *  - HIPAA §164.308(a)(5)(ii)(C): log-in monitoring.
 *  - NIST SP 800-63B §5.2.2: rate limiting + lockout guidance.
 */

const FAILED_ATTEMPTS_KEY = (email: string) => `lock:email:${email.toLowerCase()}`;
const LOCK_KEY = (email: string) => `lock:locked:${email.toLowerCase()}`;

export interface LockoutConfig {
  /** Max failed attempts before lock. */
  maxAttempts: number;
  /** Window for counting failures, in seconds. */
  windowSec: number;
  /** Lockout duration after threshold reached, in seconds. */
  lockDurationSec: number;
}

export const DEFAULT_LOCKOUT: LockoutConfig = {
  maxAttempts: 5,
  windowSec: 15 * 60, // 15 minutes
  lockDurationSec: 15 * 60, // 15 minutes
};

export interface LockoutCheck {
  locked: boolean;
  remainingSeconds: number;
  attemptsRemaining: number;
}

/**
 * Check if an account is currently locked.
 * Call BEFORE attempting password verification.
 */
export async function isLocked(email: string): Promise<LockoutCheck> {
  try {
    const locked = await redis.get(LOCK_KEY(email));
    if (locked) {
      const ttl = await redis.ttl(LOCK_KEY(email));
      return {
        locked: true,
        remainingSeconds: ttl > 0 ? ttl : DEFAULT_LOCKOUT.lockDurationSec,
        attemptsRemaining: 0,
      };
    }
    // Count attempts in window
    const count = await redis.get(FAILED_ATTEMPTS_KEY(email));
    const n = count ? parseInt(count, 10) : 0;
    return {
      locked: false,
      remainingSeconds: 0,
      attemptsRemaining: Math.max(0, DEFAULT_LOCKOUT.maxAttempts - n),
    };
  } catch (err) {
    // Fail open on Redis error — login lockout is defense-in-depth, not primary.
    safeLog("error", "lockout.check_failed", {
      email: email.slice(0, 3) + "***",
      error: err instanceof Error ? err.message : "unknown",
    });
    return { locked: false, remainingSeconds: 0, attemptsRemaining: 999 };
  }
}

/**
 * Record a failed login attempt.
 * Returns the updated state (may now be locked).
 */
export async function recordFailedLogin(email: string): Promise<LockoutCheck> {
  const cfg = DEFAULT_LOCKOUT;
  try {
    const key = FAILED_ATTEMPTS_KEY(email);
    const count = await redis.incr(key);
    if (count === 1) {
      // First failure in this window — set expiry.
      await redis.expire(key, cfg.windowSec);
    }

    if (count >= cfg.maxAttempts) {
      // Lock the account.
      await redis.set(LOCK_KEY(email), "1", "EX", cfg.lockDurationSec);
      safeLog("warn", "auth.account_locked", {
        email: email.slice(0, 3) + "***",
        attempts: count,
        durationSec: cfg.lockDurationSec,
      });
      return {
        locked: true,
        remainingSeconds: cfg.lockDurationSec,
        attemptsRemaining: 0,
      };
    }

    return {
      locked: false,
      remainingSeconds: 0,
      attemptsRemaining: cfg.maxAttempts - count,
    };
  } catch (err) {
    safeLog("error", "lockout.record_failed", {
      error: err instanceof Error ? err.message : "unknown",
    });
    return { locked: false, remainingSeconds: 0, attemptsRemaining: 999 };
  }
}

/**
 * Clear lockout state on successful login.
 */
export async function clearLockout(email: string): Promise<void> {
  try {
    await redis.del(FAILED_ATTEMPTS_KEY(email));
    await redis.del(LOCK_KEY(email));
  } catch (err) {
    safeLog("error", "lockout.clear_failed", {
      error: err instanceof Error ? err.message : "unknown",
    });
  }
}

/**
 * Manually unlock an account (admin action).
 * Endpoint: admin can call this from /admin to unlock a user who was locked
 * out for legitimate reasons.
 */
export async function adminUnlock(email: string): Promise<void> {
  await clearLockout(email);
  safeLog("info", "auth.admin_unlock", { email: email.slice(0, 3) + "***" });
}