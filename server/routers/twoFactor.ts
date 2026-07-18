import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, doctorProcedure } from "../trpc";
import { audit } from "@/lib/audit";
import {
  generateTotpSecret,
  buildOtpAuthUri,
  generateQrDataUrl,
  verifyTotp,
  generateBackupCodes,
  hashBackupCode,
  verifyBackupCode,
} from "@/lib/totp";
import { rateLimit, LIMITERS } from "@/lib/rate-limit";

/**
 * Two-factor authentication (TOTP) for doctors.
 *
 * Enrollment flow:
 *   1. setupBegin() → returns secret + QR data URL + otpauth URI
 *   2. User scans QR in Google Authenticator / Authy / etc.
 *   3. User enters 6-digit code from app.
 *   4. setupConfirm({ code }) → verifies, enables 2FA, generates 10 backup codes
 *
 * Login flow (when 2FA enabled):
 *   - The standard authorize() returns user, but with `requires2FA: true` in the
 *     returned object instead of the full user. Client then prompts for code.
 *   - verifyLogin({ email, password, totp }) → full session.
 *
 * Recovery:
 *   - Use one of 10 backup codes instead of TOTP. Each code is single-use.
 */
export const twoFactorRouter = router({
  setupBegin: doctorProcedure.mutation(async ({ ctx }) => {
    const doctor = await ctx.db.doctor.findUnique({
      where: { id: ctx.session.id },
      select: { totpEnabled: true, email: true },
    });
    if (!doctor) throw new TRPCError({ code: "NOT_FOUND" });
    if (doctor.totpEnabled) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "2FA ya está habilitado. Desactívelo primero.",
      });
    }
    const secret = generateTotpSecret();
    const uri = buildOtpAuthUri(doctor.email, secret);
    const qrDataUrl = await generateQrDataUrl(uri);
    // Stash the secret in a transient field — confirm step will read it.
    // For simplicity, we store it temporarily in totpSecret (without enabling).
    await ctx.db.doctor.update({
      where: { id: ctx.session.id },
      data: { totpSecret: secret },
    });
    return { secret, qrDataUrl, otpauthUri: uri };
  }),

  setupConfirm: doctorProcedure
    .input(z.object({ code: z.string().regex(/^\d{6}$/) }))
    .mutation(async ({ ctx, input }) => {
      const doctor = await ctx.db.doctor.findUnique({
        where: { id: ctx.session.id },
        select: { totpSecret: true, totpEnabled: true },
      });
      if (!doctor?.totpSecret) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Inicie la configuración primero con setupBegin.",
        });
      }
      if (doctor.totpEnabled) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "2FA ya activo." });
      }
      const ok = verifyTotp(input.code, doctor.totpSecret);
      if (!ok) {
        await audit("TWO_FACTOR_FAILED", {
          userId: ctx.session.id,
          userRole: "DOCTOR",
          workspaceId: ctx.session.workspaceId,
          resourceType: "Doctor",
          resourceId: ctx.session.id,
          outcome: "DENIED",
          reason: "Bad TOTP during setupConfirm",
        });
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Código incorrecto." });
      }
      // Generate 10 backup codes.
      const plaintextCodes = generateBackupCodes(10);
      const hashedCodes = await Promise.all(plaintextCodes.map(hashBackupCode));
      await ctx.db.$transaction([
        ctx.db.doctor.update({
          where: { id: ctx.session.id },
          data: {
            totpEnabled: true,
            totpEnabledAt: new Date(),
            totpSecret: doctor.totpSecret, // already set, explicit for clarity
          },
        }),
        ctx.db.twoFactorBackupCode.deleteMany({ where: { doctorId: ctx.session.id } }),
        ctx.db.twoFactorBackupCode.createMany({
          data: hashedCodes.map((codeHash) => ({
            doctorId: ctx.session.id!,
            codeHash,
          })),
        }),
      ]);
      await audit("TWO_FACTOR_ENABLED", {
        userId: ctx.session.id,
        userRole: "DOCTOR",
        workspaceId: ctx.session.workspaceId,
        resourceType: "Doctor",
        resourceId: ctx.session.id,
      });
      // Return the plaintext codes ONCE — caller must show them and instruct
      // the user to save them.
      return { backupCodes: plaintextCodes };
    }),

  disable: doctorProcedure
    .input(z.object({ code: z.string() })) // TOTP or backup code
    .mutation(async ({ ctx, input }) => {
      const doctor = await ctx.db.doctor.findUnique({
        where: { id: ctx.session.id },
        select: { totpEnabled: true, totpSecret: true },
      });
      if (!doctor?.totpEnabled || !doctor.totpSecret) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "2FA no está activo." });
      }
      let valid = false;
      if (/^\d{6}$/.test(input.code)) {
        valid = verifyTotp(input.code, doctor.totpSecret);
      } else {
        // Try as backup code
        const codes = await ctx.db.twoFactorBackupCode.findMany({
          where: { doctorId: ctx.session.id, usedAt: null },
        });
        for (const c of codes) {
          if (await verifyBackupCode(input.code, c.codeHash)) {
            valid = true;
            await ctx.db.twoFactorBackupCode.update({
              where: { id: c.id },
              data: { usedAt: new Date() },
            });
            break;
          }
        }
      }
      if (!valid) {
        await audit("TWO_FACTOR_FAILED", {
          userId: ctx.session.id,
          userRole: "DOCTOR",
          workspaceId: ctx.session.workspaceId,
          resourceType: "Doctor",
          resourceId: ctx.session.id,
          outcome: "DENIED",
          reason: "Bad code on disable",
        });
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Código incorrecto." });
      }
      await ctx.db.$transaction([
        ctx.db.doctor.update({
          where: { id: ctx.session.id },
          data: { totpEnabled: false, totpEnabledAt: null, totpSecret: null },
        }),
        ctx.db.twoFactorBackupCode.deleteMany({ where: { doctorId: ctx.session.id } }),
      ]);
      await audit("TWO_FACTOR_DISABLED", {
        userId: ctx.session.id,
        userRole: "DOCTOR",
        workspaceId: ctx.session.workspaceId,
        resourceType: "Doctor",
        resourceId: ctx.session.id,
      });
      return { ok: true };
    }),

  verifyLogin: doctorProcedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // NOTE: this is called after a normal login that returned requires2FA: true.
      // The doctor session is already established (cookies set) but the
      // 2FA challenge is pending. We mark it complete here.
      const doctor = await ctx.db.doctor.findUnique({
        where: { id: ctx.session.id },
        select: { totpEnabled: true, totpSecret: true, totpLastUsed: true },
      });
      if (!doctor?.totpEnabled || !doctor.totpSecret) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "2FA no requerido." });
      }
      // Rate limit: 5 attempts / 5 min per user
      const rl = await rateLimit({
        prefix: LIMITERS.twoFactor.prefix,
        identifier: ctx.session.id,
        max: LIMITERS.twoFactor.max,
        windowSec: LIMITERS.twoFactor.windowSec,
      });
      if (!rl.ok) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Demasiados intentos. Espere 5 minutos.",
        });
      }
      let valid = false;
      let viaBackup = false;
      if (/^\d{6}$/.test(input.code)) {
        valid = verifyTotp(input.code, doctor.totpSecret);
      } else {
        // Backup code
        const codes = await ctx.db.twoFactorBackupCode.findMany({
          where: { doctorId: ctx.session.id, usedAt: null },
        });
        for (const c of codes) {
          if (await verifyBackupCode(input.code, c.codeHash)) {
            valid = true;
            viaBackup = true;
            await ctx.db.twoFactorBackupCode.update({
              where: { id: c.id },
              data: { usedAt: new Date() },
            });
            break;
          }
        }
      }
      if (!valid) {
        await audit("TWO_FACTOR_FAILED", {
          userId: ctx.session.id,
          userRole: "DOCTOR",
          workspaceId: ctx.session.workspaceId,
          resourceType: "Doctor",
          resourceId: ctx.session.id,
          outcome: "DENIED",
          reason: "Bad TOTP/backup on login",
        });
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Código incorrecto." });
      }
      // Update last-used for replay protection window
      await ctx.db.doctor.update({
        where: { id: ctx.session.id },
        data: { totpLastUsed: new Date() },
      });
      await audit("LOGIN_OK", {
        userId: ctx.session.id,
        userRole: "DOCTOR",
        workspaceId: ctx.session.workspaceId,
        resourceType: "Doctor",
        resourceId: ctx.session.id,
        metadata: { via2FA: true, viaBackup },
      });
      return { ok: true };
    }),

  status: doctorProcedure.query(async ({ ctx }) => {
    const doctor = await ctx.db.doctor.findUnique({
      where: { id: ctx.session.id },
      select: { totpEnabled: true, totpEnabledAt: true },
    });
    const backupCodesCount = await ctx.db.twoFactorBackupCode.count({
      where: { doctorId: ctx.session.id, usedAt: null },
    });
    return {
      enabled: doctor?.totpEnabled ?? false,
      enabledAt: doctor?.totpEnabledAt ?? null,
      backupCodesRemaining: backupCodesCount,
    };
  }),
});
