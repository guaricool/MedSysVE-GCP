import { z } from "zod"
import { router, protectedProcedure } from "../trpc"
import { TRPCError } from "@trpc/server"
import { audit } from "@/lib/audit"

export const geriRouter = router({
  // ─── 1. VALORACIÓN GERIÁTRICA INTEGRAL (VGI KATZ / LAWTON-BRODY) ───
  getVgiFunctional: protectedProcedure
    .input(z.object({ encounterId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return {
          id: "sandbox-geri-vgi-1",
          encounterId: "sandbox-demo",
          patientRegistrationId: "sandbox-demo-pat",
          workspaceId: ctx.session.workspaceId ?? "sandbox",
          katzScore: 5,
          katzCategory: "Dependencia Leve (Katz 5/6 pts)",
          lawtonBrodyScore: 6,
          lawtonCategory: "Independencia Parcial en AIVD (Lawton 6/8 pts)",
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }

      return ctx.db.geriVgiFunctional.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })
    }),

  saveVgiFunctional: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        katzScore: z.number().int().min(0).max(6),
        katzCategory: z.string(),
        lawtonBrodyScore: z.number().int().min(0).max(8),
        lawtonCategory: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-geri-vgi-1" }
      }

      const existing = await ctx.db.geriVgiFunctional.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })

      const data = {
        katzScore: input.katzScore,
        katzCategory: input.katzCategory,
        lawtonBrodyScore: input.lawtonBrodyScore,
        lawtonCategory: input.lawtonCategory,
      }

      if (existing) {
        return ctx.db.geriVgiFunctional.update({
          where: { id: existing.id },
          data,
        })
      }

      return ctx.db.geriVgiFunctional.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          ...data,
        },
      })
    }),

  // ─── 2. FRAGILIDAD & RIESGO DE CAÍDAS (FRAIL + TIMED UP AND GO) ───
  getFrailFallRisk: protectedProcedure
    .input(z.object({ encounterId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return {
          id: "sandbox-geri-frail-1",
          encounterId: "sandbox-demo",
          patientRegistrationId: "sandbox-demo-pat",
          workspaceId: ctx.session.workspaceId ?? "sandbox",
          frailScore: 2,
          frailCategory: "Estado Pre-Frágil (Cuestionario FRAIL 1-2 pts)",
          timedUpAndGoSec: 14.2,
          fallRiskCategory: "Riesgo Moderado de Caídas (TUG 10-20 segundos)",
          fallsLastYearCount: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }

      return ctx.db.geriFrailFallRisk.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })
    }),

  saveFrailFallRisk: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        frailScore: z.number().int().min(0).max(5),
        frailCategory: z.string(),
        timedUpAndGoSec: z.number().positive().optional().nullable(),
        fallRiskCategory: z.string(),
        fallsLastYearCount: z.number().int().min(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-geri-frail-1" }
      }

      const existing = await ctx.db.geriFrailFallRisk.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })

      const data = {
        frailScore: input.frailScore,
        frailCategory: input.frailCategory,
        timedUpAndGoSec: input.timedUpAndGoSec,
        fallRiskCategory: input.fallRiskCategory,
        fallsLastYearCount: input.fallsLastYearCount,
      }

      if (existing) {
        return ctx.db.geriFrailFallRisk.update({
          where: { id: existing.id },
          data,
        })
      }

      return ctx.db.geriFrailFallRisk.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          ...data,
        },
      })
    }),

  // ─── 3. CRIBADO COGNITIVO & DEPRESIÓN GERIÁTRICA (MMSE / PFEIFFER / YESAVAGE) ───
  getCognitiveMood: protectedProcedure
    .input(z.object({ encounterId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return {
          id: "sandbox-geri-cog-1",
          encounterId: "sandbox-demo",
          patientRegistrationId: "sandbox-demo-pat",
          workspaceId: ctx.session.workspaceId ?? "sandbox",
          pfeifferErrors: 2,
          mmseScore: 26,
          cognitiveCategory: "Deterioro Cognitivo Leve / Conservado (MMSE 26/30)",
          yesavageGds15Score: 4,
          moodCategory: "Normal / Sin Sintomatología Depresiva Significativa (GDS-15 <= 5)",
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }

      return ctx.db.geriCognitiveMood.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })
    }),

  saveCognitiveMood: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        pfeifferErrors: z.number().int().min(0).max(10).optional().nullable(),
        mmseScore: z.number().int().min(0).max(30).optional().nullable(),
        cognitiveCategory: z.string(),
        yesavageGds15Score: z.number().int().min(0).max(15).optional().nullable(),
        moodCategory: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-geri-cog-1" }
      }

      const existing = await ctx.db.geriCognitiveMood.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })

      const data = {
        pfeifferErrors: input.pfeifferErrors,
        mmseScore: input.mmseScore,
        cognitiveCategory: input.cognitiveCategory,
        yesavageGds15Score: input.yesavageGds15Score,
        moodCategory: input.moodCategory,
      }

      if (existing) {
        return ctx.db.geriCognitiveMood.update({
          where: { id: existing.id },
          data,
        })
      }

      return ctx.db.geriCognitiveMood.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          ...data,
        },
      })
    }),
})
