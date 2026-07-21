import { z } from "zod"
import { router, protectedProcedure } from "../trpc"
import { TRPCError } from "@trpc/server"
import { audit } from "@/lib/audit"

export const gastroRouter = router({
  // ─── 1. REPORTE ENDOSCÓPICO & BOSTON BOWEL PREP SCORE (BBPS) ───
  listEndoscopyReports: protectedProcedure
    .input(z.object({ patientRegistrationId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.patientRegistrationId === "sandbox-demo-pat") {
        return [
          {
            id: "sandbox-gastro-report-1",
            encounterId: "sandbox-demo",
            patientRegistrationId: "sandbox-demo-pat",
            workspaceId: ctx.session.workspaceId ?? "sandbox",
            tipoProcedimiento: "Colonoscopia Total",
            hallazgos: "Pólipo sésil de 6mm en colon ascendente, extirpado mediante asa fría sin complicaciones.",
            bostonScoreColonDerecho: 3,
            bostonScoreColonTransverso: 3,
            bostonScoreColonIzquierdo: 2,
            bostonTotalScore: 8,
            biopsiasTomadas: "Pólipo colon ascendente (Frasco 1)",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]
      }

      return ctx.db.gastroEndoscopyReport.findMany({
        where: { patientRegistrationId: input.patientRegistrationId, workspaceId: ctx.session.workspaceId },
        orderBy: { createdAt: "desc" },
      })
    }),

  saveEndoscopyReport: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        tipoProcedimiento: z.string(),
        hallazgos: z.string(),
        bostonScoreColonDerecho: z.number().int().min(0).max(3).optional().nullable(),
        bostonScoreColonTransverso: z.number().int().min(0).max(3).optional().nullable(),
        bostonScoreColonIzquierdo: z.number().int().min(0).max(3).optional().nullable(),
        biopsiasTomadas: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      let bostonTotal: number | null = null
      if (
        input.bostonScoreColonDerecho !== null &&
        input.bostonScoreColonDerecho !== undefined &&
        input.bostonScoreColonTransverso !== null &&
        input.bostonScoreColonTransverso !== undefined &&
        input.bostonScoreColonIzquierdo !== null &&
        input.bostonScoreColonIzquierdo !== undefined
      ) {
        bostonTotal =
          input.bostonScoreColonDerecho +
          input.bostonScoreColonTransverso +
          input.bostonScoreColonIzquierdo
      }

      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-gastro-report-1" }
      }

      return ctx.db.gastroEndoscopyReport.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          tipoProcedimiento: input.tipoProcedimiento,
          hallazgos: input.hallazgos,
          bostonScoreColonDerecho: input.bostonScoreColonDerecho,
          bostonScoreColonTransverso: input.bostonScoreColonTransverso,
          bostonScoreColonIzquierdo: input.bostonScoreColonIzquierdo,
          bostonTotalScore: bostonTotal,
          biopsiasTomadas: input.biopsiasTomadas,
        },
      })
    }),

  // ─── 2. CLASIFICACIÓN DE FORREST & LOS ÁNGELES (ESOFAGITIS) ───
  getBleedingScale: protectedProcedure
    .input(z.object({ encounterId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return {
          id: "sandbox-gastro-bleed-1",
          encounterId: "sandbox-demo",
          patientRegistrationId: "sandbox-demo-pat",
          workspaceId: ctx.session.workspaceId ?? "sandbox",
          forrestClassification: "Forrest III (Úlcera con base limpia / Sin sangrado activo)",
          losAngelesEsofagitis: "Grado A (Erosiones mucosas < 5mm que no se extienden entre pliegues)",
          hemostasiaEndoscopica: "Ninguna requerida",
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }

      return ctx.db.gastroBleedingScale.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })
    }),

  saveBleedingScale: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        forrestClassification: z.string().optional().nullable(),
        losAngelesEsofagitis: z.string().optional().nullable(),
        hemostasiaEndoscopica: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-gastro-bleed-1" }
      }

      const existing = await ctx.db.gastroBleedingScale.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })

      const data = {
        forrestClassification: input.forrestClassification,
        losAngelesEsofagitis: input.losAngelesEsofagitis,
        hemostasiaEndoscopica: input.hemostasiaEndoscopica,
      }

      if (existing) {
        return ctx.db.gastroBleedingScale.update({
          where: { id: existing.id },
          data,
        })
      }

      return ctx.db.gastroBleedingScale.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          ...data,
        },
      })
    }),

  // ─── 3. ÍNDICE DE MAYO PARA ENFERMEDAD INFLAMATORIA INTESTINAL (EII) ───
  getIbdScore: protectedProcedure
    .input(z.object({ encounterId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return {
          id: "sandbox-gastro-ibd-1",
          encounterId: "sandbox-demo",
          patientRegistrationId: "sandbox-demo-pat",
          workspaceId: ctx.session.workspaceId ?? "sandbox",
          diagnosticoEii: "Colitis Ulcerosa (CU)",
          mayoFrecuenciaDeposiciones: 1,
          mayoSangradoRectal: 0,
          mayoHallazgosEndoscopicos: 1,
          mayoEvaluacionGlobalMedico: 1,
          mayoTotalScore: 3,
          mayoCategory: "Colitis Ulcerosa Leve (3-5 pts)",
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }

      return ctx.db.gastroIbdScore.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })
    }),

  saveIbdScore: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        diagnosticoEii: z.string(),
        mayoFrecuenciaDeposiciones: z.number().int().min(0).max(3).optional().nullable(),
        mayoSangradoRectal: z.number().int().min(0).max(3).optional().nullable(),
        mayoHallazgosEndoscopicos: z.number().int().min(0).max(3).optional().nullable(),
        mayoEvaluacionGlobalMedico: z.number().int().min(0).max(3).optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      let totalMayo: number | null = null
      let categoryMayo: string | null = null

      if (
        input.mayoFrecuenciaDeposiciones !== null &&
        input.mayoFrecuenciaDeposiciones !== undefined &&
        input.mayoSangradoRectal !== null &&
        input.mayoSangradoRectal !== undefined &&
        input.mayoHallazgosEndoscopicos !== null &&
        input.mayoHallazgosEndoscopicos !== undefined &&
        input.mayoEvaluacionGlobalMedico !== null &&
        input.mayoEvaluacionGlobalMedico !== undefined
      ) {
        totalMayo =
          input.mayoFrecuenciaDeposiciones +
          input.mayoSangradoRectal +
          input.mayoHallazgosEndoscopicos +
          input.mayoEvaluacionGlobalMedico

        if (totalMayo <= 2) categoryMayo = "Remisión Clínica (0-2 pts)"
        else if (totalMayo <= 5) categoryMayo = "Colitis Ulcerosa Leve (3-5 pts)"
        else if (totalMayo <= 10) categoryMayo = "Colitis Ulcerosa Moderada (6-10 pts)"
        else categoryMayo = "Colitis Ulcerosa Grave (11-12 pts)"
      }

      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-gastro-ibd-1" }
      }

      const existing = await ctx.db.gastroIbdScore.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })

      const data = {
        diagnosticoEii: input.diagnosticoEii,
        mayoFrecuenciaDeposiciones: input.mayoFrecuenciaDeposiciones,
        mayoSangradoRectal: input.mayoSangradoRectal,
        mayoHallazgosEndoscopicos: input.mayoHallazgosEndoscopicos,
        mayoEvaluacionGlobalMedico: input.mayoEvaluacionGlobalMedico,
        mayoTotalScore: totalMayo,
        mayoCategory: categoryMayo,
      }

      if (existing) {
        return ctx.db.gastroIbdScore.update({
          where: { id: existing.id },
          data,
        })
      }

      return ctx.db.gastroIbdScore.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          ...data,
        },
      })
    }),
})
