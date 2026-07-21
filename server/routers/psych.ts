import { z } from "zod"
import { router, protectedProcedure } from "../trpc"
import { TRPCError } from "@trpc/server"
import { audit } from "@/lib/audit"

export const psychRouter = router({
  // ─── 1. EXAMEN DEL ESTADO MENTAL (EEM / MSE) ───
  getMSE: protectedProcedure
    .input(z.object({ encounterId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return {
          id: "sandbox-mse-1",
          encounterId: "sandbox-demo",
          patientRegistrationId: "sandbox-demo-pat",
          workspaceId: ctx.session.workspaceId ?? "sandbox",
          aspectoPorte: "Aliñado / Higiene adecuada",
          actitud: "Colaboradora y comunicativa",
          afectoEstructura: "Eutímico con adecuada reactividad",
          cursoPensamiento: "Lógico, coherente y estructurado",
          contenidoPensamiento: "Sin ideas delirantes ni ideación suicida activa",
          sensorioOrientacion: "Orientado en espacio, tiempo y persona (3/3)",
          juicioIntrospeccion: "Juicio conservado. Adecuada conciencia de enfermedad.",
          observaciones: "Evaluación psiquiátrica dentro de límites normales.",
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }

      return ctx.db.psychMentalStateExam.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })
    }),

  saveMSE: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        aspectoPorte: z.string(),
        actitud: z.string(),
        afectoEstructura: z.string(),
        cursoPensamiento: z.string(),
        contenidoPensamiento: z.string(),
        sensorioOrientacion: z.string(),
        juicioIntrospeccion: z.string(),
        observaciones: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-mse-1" }
      }

      const existing = await ctx.db.psychMentalStateExam.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })

      const data = {
        aspectoPorte: input.aspectoPorte,
        actitud: input.actitud,
        afectoEstructura: input.afectoEstructura,
        cursoPensamiento: input.cursoPensamiento,
        contenidoPensamiento: input.contenidoPensamiento,
        sensorioOrientacion: input.sensorioOrientacion,
        juicioIntrospeccion: input.juicioIntrospeccion,
        observaciones: input.observaciones,
      }

      if (existing) {
        return ctx.db.psychMentalStateExam.update({
          where: { id: existing.id },
          data,
        })
      }

      return ctx.db.psychMentalStateExam.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          ...data,
        },
      })
    }),

  // ─── 2. ESCALAS PSICOMÉTRICAS (PHQ-9, GAD-7, C-SSRS) ───
  getScales: protectedProcedure
    .input(z.object({ encounterId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return {
          id: "sandbox-psych-scale-1",
          encounterId: "sandbox-demo",
          patientRegistrationId: "sandbox-demo-pat",
          workspaceId: ctx.session.workspaceId ?? "sandbox",
          phq9Score: 4,
          phq9Category: "Depresión Mínima (0-4 pts)",
          gad7Score: 3,
          gad7Category: "Ansiedad Mínima (0-4 pts)",
          cssrsRiskLevel: "BAJO",
          cssrsDetail: "Sin ideación suicida activa ni comportamiento autolesivo.",
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }

      return ctx.db.psychScalesRecord.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })
    }),

  saveScales: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        phq9Score: z.number().int().min(0).max(27).optional().nullable(),
        gad7Score: z.number().int().min(0).max(21).optional().nullable(),
        cssrsRiskLevel: z.enum(["BAJO", "MODERADO", "ALTO", "EXTREMO"]).optional().nullable(),
        cssrsDetail: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      let phq9Cat: string | null = null
      if (input.phq9Score !== null && input.phq9Score !== undefined) {
        if (input.phq9Score <= 4) phq9Cat = "Depresión Mínima (0-4 pts)"
        else if (input.phq9Score <= 9) phq9Cat = "Depresión Leve (5-9 pts)"
        else if (input.phq9Score <= 14) phq9Cat = "Depresión Moderada (10-14 pts)"
        else if (input.phq9Score <= 19) phq9Cat = "Depresión Moderadamente Grave (15-19 pts)"
        else phq9Cat = "Depresión Grave (20-27 pts)"
      }

      let gad7Cat: string | null = null
      if (input.gad7Score !== null && input.gad7Score !== undefined) {
        if (input.gad7Score <= 4) gad7Cat = "Ansiedad Mínima (0-4 pts)"
        else if (input.gad7Score <= 9) gad7Cat = "Ansiedad Leve (5-9 pts)"
        else if (input.gad7Score <= 14) gad7Cat = "Ansiedad Moderada (10-14 pts)"
        else gad7Cat = "Ansiedad Grave (15-21 pts)"
      }

      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-psych-scale-1" }
      }

      const existing = await ctx.db.psychScalesRecord.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })

      const data = {
        phq9Score: input.phq9Score,
        phq9Category: phq9Cat,
        gad7Score: input.gad7Score,
        gad7Category: gad7Cat,
        cssrsRiskLevel: input.cssrsRiskLevel,
        cssrsDetail: input.cssrsDetail,
      }

      if (existing) {
        return ctx.db.psychScalesRecord.update({
          where: { id: existing.id },
          data,
        })
      }

      return ctx.db.psychScalesRecord.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          ...data,
        },
      })
    }),

  // ─── 3. MONITOREO METABÓLICO & PSICOFARMACOLÓGICO ───
  getMedicationMonitoring: protectedProcedure
    .input(z.object({ encounterId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return {
          id: "sandbox-psych-med-1",
          encounterId: "sandbox-demo",
          patientRegistrationId: "sandbox-demo-pat",
          workspaceId: ctx.session.workspaceId ?? "sandbox",
          psicofarmacosActuales: "Sertralina 50mg/día, Clonazepam 0.5mg/noche",
          prolactinaNgMl: 14.2,
          pesoKg: 68.0,
          perimetroAbdominalCm: 82.0,
          qtcIntervaloMs: 410,
          efectosAdversos: "Sin síntomas extrapiramidales ni somnolencia diurna.",
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }

      return ctx.db.psychMedicationMonitoring.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })
    }),

  saveMedicationMonitoring: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        psicofarmacosActuales: z.string(),
        prolactinaNgMl: z.number().positive().optional().nullable(),
        pesoKg: z.number().positive().optional().nullable(),
        perimetroAbdominalCm: z.number().positive().optional().nullable(),
        qtcIntervaloMs: z.number().int().positive().optional().nullable(),
        efectosAdversos: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-psych-med-1" }
      }

      const existing = await ctx.db.psychMedicationMonitoring.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })

      const data = {
        psicofarmacosActuales: input.psicofarmacosActuales,
        prolactinaNgMl: input.prolactinaNgMl,
        pesoKg: input.pesoKg,
        perimetroAbdominalCm: input.perimetroAbdominalCm,
        qtcIntervaloMs: input.qtcIntervaloMs,
        efectosAdversos: input.efectosAdversos,
      }

      if (existing) {
        return ctx.db.psychMedicationMonitoring.update({
          where: { id: existing.id },
          data,
        })
      }

      return ctx.db.psychMedicationMonitoring.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          ...data,
        },
      })
    }),
})
