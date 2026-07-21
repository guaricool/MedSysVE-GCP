import { z } from "zod"
import { router, protectedProcedure } from "../trpc"
import { TRPCError } from "@trpc/server"
import { audit } from "@/lib/audit"

export const pneumoRouter = router({
  // ─── 1. ESPIROMETRÍA COMPLETA & PRUEBA DE BRONCODILATACIÓN ───
  getSpirometry: protectedProcedure
    .input(z.object({ encounterId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return {
          id: "sandbox-pneumo-spir-1",
          encounterId: "sandbox-demo",
          patientRegistrationId: "sandbox-demo-pat",
          workspaceId: ctx.session.workspaceId ?? "sandbox",
          vef1PreLiters: 2.1,
          cvfPreLiters: 3.8,
          vef1CvfRatioPercent: 55.2,
          vef1PostLiters: 2.5,
          respuestaBroncodilatadoraMl: 400,
          respuestaBroncodilatadoraPercent: 19.0,
          interpretacionEspirometrica: "Patrón Obstructivo Moderado con Respuesta Broncodilatadora Positiva (Reversibilidad)",
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }

      return ctx.db.pneumoSpirometry.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })
    }),

  saveSpirometry: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        vef1PreLiters: z.number().positive(),
        cvfPreLiters: z.number().positive(),
        vef1CvfRatioPercent: z.number().positive(),
        vef1PostLiters: z.number().positive().optional().nullable(),
        respuestaBroncodilatadoraMl: z.number().optional().nullable(),
        respuestaBroncodilatadoraPercent: z.number().optional().nullable(),
        interpretacionEspirometrica: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-pneumo-spir-1" }
      }

      const existing = await ctx.db.pneumoSpirometry.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })

      const data = {
        vef1PreLiters: input.vef1PreLiters,
        cvfPreLiters: input.cvfPreLiters,
        vef1CvfRatioPercent: input.vef1CvfRatioPercent,
        vef1PostLiters: input.vef1PostLiters,
        respuestaBroncodilatadoraMl: input.respuestaBroncodilatadoraMl,
        respuestaBroncodilatadoraPercent: input.respuestaBroncodilatadoraPercent,
        interpretacionEspirometrica: input.interpretacionEspirometrica,
      }

      if (existing) {
        return ctx.db.pneumoSpirometry.update({
          where: { id: existing.id },
          data,
        })
      }

      return ctx.db.pneumoSpirometry.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          ...data,
        },
      })
    }),

  // ─── 2. CLASIFICACIÓN ASMA GINA & EPOC GOLD ───
  getGinaGold: protectedProcedure
    .input(z.object({ encounterId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return {
          id: "sandbox-pneumo-ginagold-1",
          encounterId: "sandbox-demo",
          patientRegistrationId: "sandbox-demo-pat",
          workspaceId: ctx.session.workspaceId ?? "sandbox",
          clasificacionGinaAsma: "Paso 3 GINA (Asma Persistente Moderada - Dosis baja CI + LABA)",
          goldGradeEpoc: "GOLD 2 (Limitación moderada del flujo aéreo: 50% <= VEF1 < 80%)",
          goldGroupEpoc: "Grupo B (Sintomático, Bajo Riesgo Exacerbador)",
          exacerabacionesUltimoAno: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }

      return ctx.db.pneumoGinaGold.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })
    }),

  saveGinaGold: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        clasificacionGinaAsma: z.string().optional().nullable(),
        goldGradeEpoc: z.string().optional().nullable(),
        goldGroupEpoc: z.string().optional().nullable(),
        exacerabacionesUltimoAno: z.number().int().min(0).optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-pneumo-ginagold-1" }
      }

      const existing = await ctx.db.pneumoGinaGold.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })

      const data = {
        clasificacionGinaAsma: input.clasificacionGinaAsma,
        goldGradeEpoc: input.goldGradeEpoc,
        goldGroupEpoc: input.goldGroupEpoc,
        exacerabacionesUltimoAno: input.exacerabacionesUltimoAno,
      }

      if (existing) {
        return ctx.db.pneumoGinaGold.update({
          where: { id: existing.id },
          data,
        })
      }

      return ctx.db.pneumoGinaGold.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          ...data,
        },
      })
    }),

  // ─── 3. ESCALA DE DISNEA mMRC, TEST CAT & OXIMETRÍA PaO2/FiO2 ───
  getDyspneaCat: protectedProcedure
    .input(z.object({ encounterId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return {
          id: "sandbox-pneumo-dyspnea-1",
          encounterId: "sandbox-demo",
          patientRegistrationId: "sandbox-demo-pat",
          workspaceId: ctx.session.workspaceId ?? "sandbox",
          mmrcDyspneaGrade: 2,
          catScoreTotal: 18,
          pao2Fio2KirbyIndex: 320.0,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }

      return ctx.db.pneumoDyspneaCat.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })
    }),

  saveDyspneaCat: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        mmrcDyspneaGrade: z.number().int().min(0).max(4),
        catScoreTotal: z.number().int().min(0).max(40),
        pao2Fio2KirbyIndex: z.number().positive().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-pneumo-dyspnea-1" }
      }

      const existing = await ctx.db.pneumoDyspneaCat.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })

      const data = {
        mmrcDyspneaGrade: input.mmrcDyspneaGrade,
        catScoreTotal: input.catScoreTotal,
        pao2Fio2KirbyIndex: input.pao2Fio2KirbyIndex,
      }

      if (existing) {
        return ctx.db.pneumoDyspneaCat.update({
          where: { id: existing.id },
          data,
        })
      }

      return ctx.db.pneumoDyspneaCat.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          ...data,
        },
      })
    }),
})
