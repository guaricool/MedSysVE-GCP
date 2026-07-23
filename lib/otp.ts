import crypto from "crypto"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { sendOtpEmail } from "./email"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

/**
 * Lifetime of a fresh OTP. Email verification codes expire in 10 min;
 * password reset codes get 15 min (users may need to dig out of spam).
 */
export const OTP_TTL_MS: Record<"EMAIL_VERIFY" | "PASSWORD_RESET", number> = {
  EMAIL_VERIFY: 10 * 60 * 1000,
  PASSWORD_RESET: 15 * 60 * 1000,
}

/** Maximum failed verification attempts before the OTP is invalidated. */
export const MAX_OTP_ATTEMPTS = 10

/** Maximum OTP requests per email per hour (per purpose). */
export const OTP_REQUEST_LIMIT_PER_HOUR = 20

/**
 * Generate a 6-digit numeric code. Uses crypto.randomInt for unbiased output.
 * Format: zero-padded to 6 digits, e.g. "042917".
 */
export function generateOtpCode(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0")
}

/** Hash a code with SHA-256. Stored in EmailOtp.codeHash. */
export function hashOtpCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex")
}

/**
 * Timing-safe string comparison of two SHA-256 hex digests. Returns false on
 * length mismatch (which is fine — the stored hash is always 64 chars, any
 * length mismatch means the caller gave a wrong hash and there's no point
 * doing a per-byte compare).
 */
export function verifyOtpCode(plaintextCode: string, storedHash: string): boolean {
  if (!plaintextCode || plaintextCode.length !== 6 || !/^\d{6}$/.test(plaintextCode)) {
    return false
  }
  const candidate = hashOtpCode(plaintextCode)
  const a = Buffer.from(candidate, "hex")
  const b = Buffer.from(storedHash, "hex")
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

export interface RequestOtpResult {
  /** True if an email was actually sent. False if rate-limited (silently). */
  sent: boolean
  /** Diagnostic only — never expose to the client. */
  reason?: "rate_limited" | "send_failed"
  /** Seconds until the code expires (for the success toast). */
  expiresInSeconds?: number
}

/**
 * Create + send an OTP. Idempotent w.r.t. existing unexpired unconsumed OTPs
 * for the same (email, purpose): the newest one wins, older ones are marked
 * consumed so a stolen older code can't be used.
 *
 * Rate-limiting: silently cap at OTP_REQUEST_LIMIT_PER_HOUR per (email, purpose).
 * We deliberately return `sent: false` instead of a 429 so attackers can't
 * enumerate which emails are registered.
 */
export async function requestOtp(opts: {
  email: string
  purpose: "EMAIL_VERIFY" | "PASSWORD_RESET"
  ip?: string | null
  userAgent?: string | null
}): Promise<RequestOtpResult> {
  const email = opts.email.trim().toLowerCase()
  if (!email || !email.includes("@")) {
    return { sent: false, reason: "send_failed" }
  }

  // Rate limit: count requests in last hour.
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000)
  const recent = await prisma.emailOtp.count({
    where: {
      email,
      purpose: opts.purpose,
      createdAt: { gte: hourAgo },
    },
  })
  if (recent >= OTP_REQUEST_LIMIT_PER_HOUR) {
    return { sent: false, reason: "rate_limited" }
  }

  // Invalidate any unconsumed, unexpired codes for this (email, purpose).
  await prisma.emailOtp.updateMany({
    where: {
      email,
      purpose: opts.purpose,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    data: { consumedAt: new Date() },
  })

  const code = generateOtpCode()
  const codeHash = hashOtpCode(code)
  const expiresAt = new Date(Date.now() + OTP_TTL_MS[opts.purpose])

  await prisma.emailOtp.create({
    data: {
      email,
      codeHash,
      purpose: opts.purpose,
      expiresAt,
      ip: opts.ip ?? null,
      userAgent: opts.userAgent ?? null,
    },
  })

  const ttlMin = Math.round(OTP_TTL_MS[opts.purpose] / 60_000)
  const result = await sendOtpEmail({
    to: email,
    code,
    purpose: opts.purpose,
    expiresInMinutes: ttlMin,
  })

  if (!result.success) {
    // Roll back the row so the user can retry without waiting for expiry.
    await prisma.emailOtp.deleteMany({
      where: { email, purpose: opts.purpose, codeHash },
    })
    return { sent: false, reason: "send_failed" }
  }

  return { sent: true, expiresInSeconds: Math.round(OTP_TTL_MS[opts.purpose] / 1000) }
}

export type VerifyOtpOutcome =
  | { ok: true; otpId: string }
  | { ok: false; reason: "not_found" | "expired" | "consumed" | "too_many_attempts" | "wrong_code" }

/**
 * Verify a 6-digit code for (email, purpose). On success the row is marked
 * consumed and the row id is returned. The caller should turn the row id
 * into a short-lived signed "verified" credential for the next step.
 */
export async function verifyOtp(opts: {
  email: string
  code: string
  purpose: "EMAIL_VERIFY" | "PASSWORD_RESET"
}): Promise<VerifyOtpOutcome> {
  const email = opts.email.trim().toLowerCase()
  const code = opts.code.trim()
  if (!/^\d{6}$/.test(code)) return { ok: false, reason: "wrong_code" }

  const row = await prisma.emailOtp.findFirst({
    where: { email, purpose: opts.purpose },
    orderBy: { createdAt: "desc" },
  })
  if (!row) return { ok: false, reason: "not_found" }
  if (row.consumedAt) return { ok: false, reason: "consumed" }
  if (row.expiresAt.getTime() <= Date.now()) return { ok: false, reason: "expired" }
  if (row.attempts >= MAX_OTP_ATTEMPTS) return { ok: false, reason: "too_many_attempts" }

  if (!verifyOtpCode(code, row.codeHash)) {
    await prisma.emailOtp.update({
      where: { id: row.id },
      data: { attempts: { increment: 1 } },
    })
    return { ok: false, reason: "wrong_code" }
  }

  await prisma.emailOtp.update({
    where: { id: row.id },
    data: { consumedAt: new Date() },
  })
  return { ok: true, otpId: row.id }
}

/**
 * Issue a short-lived signed "verified" credential from a consumed OTP id.
 * The token binds: otpId + email + purpose + a 15-min expiry, signed with
 * `process.env.AUTH_SECRET` (HMAC-SHA256). The caller must pass this token
 * to the protected action (register, changePassword) within 15 min.
 *
 * Format: `<base64url(JSON payload)>.<base64url HMAC-SHA256 sig>`
 * We use base64url(JSON) instead of dot-joined fields because emails can
 * legitimately contain dots (e.g. `name@gmail.com` → split explodes).
 */
export function issueVerifiedToken(opts: {
  otpId: string
  email: string
  purpose: "EMAIL_VERIFY" | "PASSWORD_RESET"
}): string {
  const payload = {
    o: opts.otpId,
    e: opts.email.toLowerCase(),
    p: opts.purpose,
    x: Date.now() + 15 * 60 * 1000,
  }
  const encoded = Buffer.from(JSON.stringify(payload), "utf-8").toString("base64url")
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "medsysve-gcp-production-auth-secret-key-2026-carlos-pierluissi-secret"
  const sig = crypto
    .createHmac("sha256", secret)
    .update(encoded)
    .digest("base64url")
  return `${encoded}.${sig}`
}

export interface VerifiedTokenClaims {
  otpId: string
  email: string
  purpose: "EMAIL_VERIFY" | "PASSWORD_RESET"
  expiresAt: number
}

export type VerifyTokenResult =
  | { ok: true; claims: VerifiedTokenClaims }
  | { ok: false; reason: "malformed" | "bad_signature" | "expired" }

/**
 * Verify a previously-issued verified token. Constant-time signature compare.
 * Returns the claims on success. Never reveals *why* verification failed to
 * the client beyond a generic boolean.
 */
export function verifyVerifiedToken(token: string): VerifyTokenResult {
  const parts = token.split(".")
  if (parts.length !== 2) return { ok: false, reason: "malformed" }
  const [encoded, sig] = parts

  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "medsysve-gcp-production-auth-secret-key-2026-carlos-pierluissi-secret"
  const expected = crypto
    .createHmac("sha256", secret)
    .update(encoded)
    .digest("base64url")

  // Length check first (returns bad_signature without leaking detail).
  const a = Buffer.from(expected)
  const b = Buffer.from(sig)
  if (a.length !== b.length) return { ok: false, reason: "bad_signature" }
  if (!crypto.timingSafeEqual(a, b)) return { ok: false, reason: "bad_signature" }

  let payload: { o?: unknown; e?: unknown; p?: unknown; x?: unknown }
  try {
    payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf-8"))
  } catch {
    return { ok: false, reason: "malformed" }
  }

  const otpId = typeof payload.o === "string" ? payload.o : null
  const email = typeof payload.e === "string" ? payload.e : null
  const purpose = payload.p === "EMAIL_VERIFY" || payload.p === "PASSWORD_RESET" ? payload.p : null
  const exp = typeof payload.x === "number" ? payload.x : NaN
  if (!otpId || !email || !purpose || !Number.isFinite(exp)) {
    return { ok: false, reason: "malformed" }
  }
  if (exp <= Date.now()) return { ok: false, reason: "expired" }

  return {
    ok: true,
    claims: { otpId, email: email.toLowerCase(), purpose, expiresAt: exp },
  }
}
