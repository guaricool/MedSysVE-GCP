import { safeLog } from "./log-sanitizer";

/**
 * Account lockout — protects against brute force / credential stuffing.
 *
 * Strategy:
 *  - Failed login attempts tracked per email in memory.
 *  - After N consecutive failures within a sliding window, account is locked for
 *    a fixed duration (default: 15 minutes).
 *  - Successful login clears the counter.
 *
 * Why In-Memory:
 *  - Fast — no DB write on every failed attempt (DoS-resistant).
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

// In-memory storage for lockout state
const lockoutCache = new Map<string, { lockedUntil: number }>();
const failedAttemptsCache = new Map<string, { count: number; expiresAt: number }>();

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
    const now = Date.now();
    const lockKey = LOCK_KEY(email);
    const lockEntry = lockoutCache.get(lockKey);
    
    if (lockEntry && lockEntry.lockedUntil > now) {
      const ttlSeconds = Math.ceil((lockEntry.lockedUntil - now) / 1000);
      return {
        locked: true,
        remainingSeconds: ttlSeconds > 0 ? ttlSeconds : DEFAULT_LOCKOUT.lockDurationSec,
        attemptsRemaining: 0,
      };
    } else if (lockEntry) {
      // Clean up expired lock
      lockoutCache.delete(lockKey);
    }

    // Count attempts in window
    const attemptsKey = FAILED_ATTEMPTS_KEY(email);
    const attemptsEntry = failedAttemptsCache.get(attemptsKey);
    
    if (attemptsEntry && attemptsEntry.expiresAt <= now) {
      // Clean up expired attempts
      failedAttemptsCache.delete(attemptsKey);
    }
    
    const count = attemptsEntry && attemptsEntry.expiresAt > now ? attemptsEntry.count : 0;
    
    return {
      locked: false,
      remainingSeconds: 0,
      attemptsRemaining: Math.max(0, DEFAULT_LOCKOUT.maxAttempts - count),
    };
  } catch (err) {
    // Fail open on error — login lockout is defense-in-depth, not primary.
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
    const now = Date.now();
    const key = FAILED_ATTEMPTS_KEY(email);
    
    let attemptsEntry = failedAttemptsCache.get(key);
    
    // Reset if expired
    if (attemptsEntry && attemptsEntry.expiresAt <= now) {
      attemptsEntry = undefined;
    }
    
    let count = 1;
    let expiresAt = now + (cfg.windowSec * 1000);
    
    if (attemptsEntry) {
      count = attemptsEntry.count + 1;
      expiresAt = attemptsEntry.expiresAt;
    }
    
    failedAttemptsCache.set(key, { count, expiresAt });

    if (count >= cfg.maxAttempts) {
      // Lock the account.
      const lockedUntil = now + (cfg.lockDurationSec * 1000);
      lockoutCache.set(LOCK_KEY(email), { lockedUntil });
      
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
    failedAttemptsCache.delete(FAILED_ATTEMPTS_KEY(email));
    lockoutCache.delete(LOCK_KEY(email));
  } catch (err) {
    safeLog("error", "lockout.clear_failed", {
      error: err instanceof Error ? err.message : "unknown",
    });
  }
}

export async function adminUnlock(email: string): Promise<void> {
  await clearLockout(email.toLowerCase().trim());
}