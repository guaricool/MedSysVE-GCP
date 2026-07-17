/**
 * Feature flag admin router — Audit S10 (2026-07-07, closes audit #15).
 *
 * Per-doctor feature-flag overrides. Admin-only — these are operational
 * tools (e.g. "doctor X has been reporting hallucinations, disable AI
 * features for them for 24h"), not user-facing endpoints.
 *
 * Reuses the same `ADMIN_EMAIL` allowlist pattern as `admin.ts` since
 * MedSysVE has a single super-admin (Carlos) plus workspace `isAdmin`
 * doctor flag; the router doesn't have to be visible to either of those
 * because neither needs to set per-doctor overrides for other doctors in
 * production today. If we ever add a "clinic admin can manage their
 * doctors" flow, swap `adminProcedure` for `clinicAdminProcedure` and
 * add a clinic-scope filter on `setByUserId`.
 */
import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { router, protectedProcedure } from "../trpc"
import { db } from "@/lib/db"
import { audit } from "@/lib/audit"
import { __resetOverrideCache } from "@/lib/feature-flags"
import { safeLog } from "@/lib/log-sanitizer"

const ADMIN_EMAIL = "cpierluissis@gmail.com"

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.session.email !== ADMIN_EMAIL) {
    throw new TRPCError({ code: "FORBIDDEN" })
  }
  return next({ ctx })
})

export const featureFlagRouter = router({
  /**
   * List all per-doctor overrides. Read-only — handy for the admin UI
   * ("who has AI disabled right now?"). Returned sorted by createdAt DESC.
   */
  listOverrides: adminProcedure
    .input(
      z
        .object({
          flagKey: z.string().optional(),
          limit: z.number().int().min(1).max(200).default(50),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const where = input?.flagKey ? { flagKey: input.flagKey } : {}
      const rows = await db.doctorFeatureOverride.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: input?.limit ?? 50,
      })
      return rows
    }),

  /**
   * Set or upsert an override for a specific doctor.
   * - `enabled: false` disables AI features for the doctor.
   * - `enabled: true` re-enables (admin can also use this to clear a
   *   prior disable by setting an override; or call `clearOverride`).
   * - `expiresAt` is optional — set a future time to auto-expire.
   * - `reason` is REQUIRED when disabling (audit trail), optional when
   *   enabling.
   */
  setOverride: adminProcedure
    .input(
      z.object({
        doctorId: z.string().min(1),
        flagKey: z.string().min(1).default("ai"),
        enabled: z.boolean(),
        reason: z.string().optional(),
        expiresAt: z.date().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Defensive: ensure the doctor exists. Otherwise a typo creates an
      // orphan row with a non-existent FK target (Prisma would reject it
      // but we'd lose the context of which id was wrong).
      const doctor = await db.doctor.findUnique({
        where: { id: input.doctorId },
        select: { id: true, email: true, nombre: true, apellido: true },
      })
      if (!doctor) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Doctor ${input.doctorId} not found.`,
        })
      }
      if (input.enabled === false && !input.reason) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Reason is required when disabling a feature. Document the trigger (e.g. 'reported hallucinations 2026-07-07').",
        })
      }
      const row = await db.doctorFeatureOverride.upsert({
        where: {
          doctorId_flagKey: {
            doctorId: input.doctorId,
            flagKey: input.flagKey,
          },
        },
        create: {
          doctorId: input.doctorId,
          flagKey: input.flagKey,
          enabled: input.enabled,
          reason: input.reason ?? null,
          expiresAt: input.expiresAt ?? null,
          setByUserId: ctx.session.id,
        },
        update: {
          enabled: input.enabled,
          reason: input.reason ?? null,
          expiresAt: input.expiresAt ?? null,
          setByUserId: ctx.session.id,
        },
      })
      // Invalidate the in-memory cache so the change takes effect on the
      // next AI endpoint request, not in up to 30s.
      __resetOverrideCache()
      // Audit (HIPAA §164.312(b) workforce + LOPDP Art. 19 data subject
      // change). We log a new AuditAction — reusing
      // "PATIENT_UPDATED"-style pattern but there's no existing action
      // for "admin changed feature flags for a doctor", so we use
      // ACCESS_DENIED's sibling. We need a new AuditAction. For now,
      // log via logAudit with the existing actions.
      void audit("PATIENT_UPDATED", {
        // Reusing an existing action because adding a new AuditAction enum
        // value requires touching lib/audit.ts + the database enum. The
        // entity is the doctor (closest existing semantic). Operators can
        // grep the audit log for doctorId=this + accion=PATIENT_UPDATED
        // to find override events. (Follow-up: add a dedicated
        // "FEATURE_OVERRIDE_SET" action.)
        userId: ctx.session.id,
        userRole: ctx.session.role,
        workspaceId: ctx.session.workspaceId,
        resourceType: "Doctor",
        resourceId: input.doctorId,
        metadata: {
          action: "FEATURE_OVERRIDE_SET",
          flagKey: input.flagKey,
          enabled: input.enabled,
          reason: input.reason ?? null,
          expiresAt: input.expiresAt?.toISOString() ?? null,
          setByUserId: ctx.session.id,
        },
      })
      safeLog("info", "feature_flag.override_set", {
        doctorId: input.doctorId,
        doctorEmail: doctor.email,
        flagKey: input.flagKey,
        enabled: input.enabled,
        reason: input.reason ?? null,
        setByUserId: ctx.session.id,
      })
      return row
    }),

  /**
   * Remove an override entirely (so the global rollout applies).
   * Use this when the override is no longer needed; for time-bounded
   * overrides prefer setting `expiresAt`.
   */
  clearOverride: adminProcedure
    .input(
      z.object({
        doctorId: z.string().min(1),
        flagKey: z.string().min(1).default("ai"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await db.doctorFeatureOverride.findUnique({
        where: {
          doctorId_flagKey: {
            doctorId: input.doctorId,
            flagKey: input.flagKey,
          },
        },
      })
      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `No override for (${input.doctorId}, ${input.flagKey}).`,
        })
      }
      await db.doctorFeatureOverride.delete({
        where: {
          doctorId_flagKey: {
            doctorId: input.doctorId,
            flagKey: input.flagKey,
          },
        },
      })
      __resetOverrideCache()
      void audit("PATIENT_UPDATED", {
        userId: ctx.session.id,
        userRole: ctx.session.role,
        workspaceId: ctx.session.workspaceId,
        resourceType: "Doctor",
        resourceId: input.doctorId,
        metadata: {
          action: "FEATURE_OVERRIDE_CLEAR",
          flagKey: input.flagKey,
          previousValue: existing.enabled,
          clearedByUserId: ctx.session.id,
        },
      })
      safeLog("info", "feature_flag.override_cleared", {
        doctorId: input.doctorId,
        flagKey: input.flagKey,
        clearedByUserId: ctx.session.id,
      })
      return { ok: true }
    }),
})
