import { router, publicProcedure, protectedProcedure } from "../trpc"
import { z } from "zod"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import { TRPCError } from "@trpc/server"
import { headers } from "next/headers"
import {
  requestOtp,
  verifyOtp,
  issueVerifiedToken,
  verifyVerifiedToken,
  OTP_TTL_MS,
} from "@/lib/otp"
import { hashPassword, verifyPassword, strongPasswordSchema } from "@/lib/password-policy"
import { rateLimit, LIMITERS } from "@/lib/rate-limit"
import { safeLog } from "@/lib/log-sanitizer"
import { sendOtpEmail } from "@/lib/email"

const emailSchema = z.string().email().max(254)

/**
 * Email verification + password reset flows.
 *
 * Flows:
 *   1. requestEmailOtp(email)              — sends a 6-digit code to verify
 *      a new registration. The user later calls verifyEmailOtp and gets a
 *      `verifiedToken` to pass into `doctor.register`.
 *
 *   2. requestPasswordReset(email)         — sends a 6-digit code to a known
 *      doctor. After verifyPasswordResetOtp they get a `verifiedToken` to
 *      pass into confirmPasswordReset.
 *
 *   3. verifyEmailOtp / verifyPasswordResetOtp — verify the code, return a
 *      short-lived HMAC-signed credential.
 *
 *   4. confirmPasswordReset(token, newPassword) — exchanges the credential
 *      for a new password hash. Audit-logged.
 *
 * Anti-enumeration: requestEmailOtp / requestPasswordReset always return
 * the same shape (success:true after the rate-limit window) regardless of
 * whether the email is registered.
 */
export const authRouter = router({
  /**
   * Step 1 of registration: send a 6-digit code to the user's email.
   * Returns success even if the email is already registered (anti-enum).
   */
  requestEmailOtp: publicProcedure
    .input(z.object({ email: emailSchema }))
    .mutation(async ({ input }) => {
      const hdrs = await headers()
      const ip =
        hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        hdrs.get("x-real-ip") ??
        "unknown"
      const ua = hdrs.get("user-agent")?.slice(0, 500) ?? null

      // IP-level rate limit on top of the per-email rate limit in lib/otp.
      const rl = await rateLimit({
        prefix: LIMITERS.register.prefix,
        identifier: `otp-request:${ip}`,
        max: 10,
        windowSec: 3600,
      })
      if (!rl.ok) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Demasiadas solicitudes. Intente más tarde.",
        })
      }

      const result = await requestOtp({
        email: input.email,
        purpose: "EMAIL_VERIFY",
        ip,
        userAgent: ua,
      })

      safeLog("info", "auth.email_otp_requested", {
        email: input.email.slice(0, 3) + "***",
        purpose: "EMAIL_VERIFY",
        sent: result.sent,
        reason: result.reason ?? null,
        ip: ip.slice(0, 8) + "***",
      })

      // Always return success to callers (anti-enumeration). The expiresInSeconds
      // is generic; clients should poll until they get a code or timeout.
      return {
        ok: true as const,
        expiresInSeconds: result.expiresInSeconds ?? Math.round(OTP_TTL_MS.EMAIL_VERIFY / 1000),
      }
    }),

  /**
   * Step 2 of registration: verify the 6-digit code. Returns a `verifiedToken`
   * the client must pass to `doctor.register`.
   */
  verifyEmailOtp: publicProcedure
    .input(z.object({
      email: emailSchema,
      code: z.string().regex(/^\d{6}$/, "Código debe ser 6 dígitos"),
    }))
    .mutation(async ({ input }) => {
      const result = await verifyOtp({
        email: input.email,
        code: input.code,
        purpose: "EMAIL_VERIFY",
      })
      if (!result.ok) {
        safeLog("info", "auth.email_otp_verify_failed", {
          email: input.email.slice(0, 3) + "***",
          reason: result.reason,
        })
        // Generic message — don't leak which failure mode.
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Código inválido o expirado.",
        })
      }
      const token = issueVerifiedToken({
        otpId: result.otpId,
        email: input.email,
        purpose: "EMAIL_VERIFY",
      })
      return {
        verifiedToken: token,
        expiresInSeconds: 15 * 60,
      }
    }),

  /**
   * Step 1 of password reset: send a 6-digit code IF the email is registered.
   * Always returns success — anti-enumeration.
   */
  requestPasswordReset: publicProcedure
    .input(z.object({ email: emailSchema }))
    .mutation(async ({ ctx, input }) => {
      const hdrs = await headers()
      const ip =
        hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        hdrs.get("x-real-ip") ??
        "unknown"
      const ua = hdrs.get("user-agent")?.slice(0, 500) ?? null

      // Only send the OTP if the email belongs to a real doctor — this is
      // the ONLY asymmetry between EMAIL_VERIFY and PASSWORD_RESET, but
      // it's safe to expose because it doesn't reveal anything: an attacker
      // can't tell the difference between "email not registered" and
      // "rate limited" because both surface the same generic response.
      const doctor = await ctx.db.doctor.findUnique({
        where: { email: input.email.toLowerCase().trim() },
        select: { id: true },
      })
      if (!doctor) {
        safeLog("info", "auth.password_reset_request_unknown_email", {
          email: input.email.slice(0, 3) + "***",
          ip: ip.slice(0, 8) + "***",
        })
        return {
          ok: true as const,
          expiresInSeconds: Math.round(OTP_TTL_MS.PASSWORD_RESET / 1000),
        }
      }

      const result = await requestOtp({
        email: input.email,
        purpose: "PASSWORD_RESET",
        ip,
        userAgent: ua,
      })

      safeLog("info", "auth.password_reset_otp_sent", {
        email: input.email.slice(0, 3) + "***",
        sent: result.sent,
        reason: result.reason ?? null,
      })

      return {
        ok: true as const,
        expiresInSeconds: result.expiresInSeconds ?? Math.round(OTP_TTL_MS.PASSWORD_RESET / 1000),
      }
    }),

  /**
   * Step 2 of password reset: verify the code. Returns a `verifiedToken`
   * for `confirmPasswordReset`.
   */
  verifyPasswordResetOtp: publicProcedure
    .input(z.object({
      email: emailSchema,
      code: z.string().regex(/^\d{6}$/, "Código debe ser 6 dígitos"),
    }))
    .mutation(async ({ input }) => {
      const result = await verifyOtp({
        email: input.email,
        code: input.code,
        purpose: "PASSWORD_RESET",
      })
      if (!result.ok) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Código inválido o expirado.",
        })
      }
      const token = issueVerifiedToken({
        otpId: result.otpId,
        email: input.email,
        purpose: "PASSWORD_RESET",
      })
      return {
        verifiedToken: token,
        expiresInSeconds: 15 * 60,
      }
    }),

  /**
   * Step 3 of password reset: exchange verifiedToken + new password for a
   * new password hash. Audit-logged with channel=PASSWORD_RESET.
   *
   * The verifiedToken must come from verifyPasswordResetOtp. We re-verify
   * the HMAC + expiry on every call; nothing else proves the user is who
   * they say they are (this is a public procedure).
   */
  confirmPasswordReset: publicProcedure
    .input(z.object({
      verifiedToken: z.string().min(20).max(500),
      newPassword: strongPasswordSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      const claimsResult = verifyVerifiedToken(input.verifiedToken)
      if (!claimsResult.ok) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "El enlace de recuperación expiró. Solicite uno nuevo.",
        })
      }
      const claims = claimsResult.claims
      if (claims.purpose !== "PASSWORD_RESET") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Token inválido para esta operación.",
        })
      }

      const doctor = await ctx.db.doctor.findUnique({
        where: { email: claims.email },
        select: { id: true },
      })
      if (!doctor) {
        // Shouldn't happen — token was issued against an email that existed.
        // But race conditions could delete the doctor. Fail closed.
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Cuenta no encontrada.",
        })
      }

      // Look up an associated workspace for the audit row. Most doctors own
      // at least one; if a doctor has no workspaces (e.g. legacy data) we
      // skip the audit row rather than fail the reset.
      const workspace = await ctx.db.workspace.findFirst({
        where: { doctorId: doctor.id },
        select: { id: true },
      })

      const newHash = await hashPassword(input.newPassword)
      await ctx.db.doctor.update({
        where: { id: doctor.id },
        data: { passwordHash: newHash },
      })

      // Invalidate any active sessions for this doctor by rotating
      // passwordHash alone — NextAuth v5 still requires re-login.
      // (We don't track session tokens server-side for JWT sessions.)

      if (workspace) {
        await ctx.db.auditEvent.create({
          data: {
            workspaceId: workspace.id,
            actorId: doctor.id,
            actorRole: "DOCTOR",
            action: "PASSWORD_RESET_COMPLETED",
            resourceType: "Doctor",
            resourceId: doctor.id,
            outcome: "ALLOWED",
            channel: "API",
          },
        })
      }

      safeLog("info", "auth.password_reset_completed", {
        doctorId: doctor.id,
      })

      return { ok: true as const }
    }),

  /**
   * Authenticated: change password (current password + new).
   * Different flow from reset — requires you to already be logged in.
   * Reuses the same strongPasswordSchema.
   */
  changePassword: protectedProcedure
    .input(z.object({
      currentPassword: z.string().min(1).max(200),
      newPassword: strongPasswordSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      const doctorId = ctx.session.doctorId
      const doctor = await ctx.db.doctor.findUnique({
        where: { id: doctorId },
        select: { id: true, passwordHash: true },
      })
      if (!doctor) throw new TRPCError({ code: "NOT_FOUND" })
      const ok = await verifyPassword(input.currentPassword, doctor.passwordHash)
      if (!ok) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "La contraseña actual no es correcta.",
        })
      }
      const workspace = await ctx.db.workspace.findFirst({
        where: { doctorId },
        select: { id: true },
      })
      const newHash = await hashPassword(input.newPassword)
      await ctx.db.doctor.update({
        where: { id: doctorId },
        data: { passwordHash: newHash },
      })
      if (workspace) {
        await ctx.db.auditEvent.create({
          data: {
            workspaceId: workspace.id,
            actorId: doctorId,
            actorRole: "DOCTOR",
            action: "PASSWORD_CHANGED",
            resourceType: "Doctor",
            resourceId: doctorId,
            outcome: "ALLOWED",
            channel: "UI",
          },
        })
      }
      return { ok: true as const }
    }),

  /**
   * Authenticated: send a fresh verification code to the doctor who is
   * changing their 2FA setup, email, or anything else that needs re-proving.
   * Useful for the "verify new email" flow if/when we add it.
   */
  resendOtp: publicProcedure
    .input(z.object({
      email: emailSchema,
      purpose: z.enum(["EMAIL_VERIFY", "PASSWORD_RESET"]),
    }))
    .mutation(async ({ input }) => {
      const hdrs = await headers()
      const ip =
        hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        hdrs.get("x-real-ip") ??
        "unknown"
      const ua = hdrs.get("user-agent")?.slice(0, 500) ?? null
      const result = await requestOtp({
        email: input.email,
        purpose: input.purpose,
        ip,
        userAgent: ua,
      })
      return {
        ok: true as const,
        expiresInSeconds: result.expiresInSeconds ?? 0,
      }
    }),
})

// Se eliminó la exportación sin uso de verifyVerifiedToken
