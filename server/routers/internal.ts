import { z } from "zod"
import { router, protectedProcedure } from "../trpc"
import { TRPCError } from "@trpc/server"
import { audit } from "@/lib/audit"

export const internalRouter = router({
  // ─── 1. ÍNDICE DE COMORBILIDAD DE CHARLSON (CCI) ───
  getCharlsonIndex: protectedProcedure
    .input(z.object({ encounterId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return {
          id: "sandbox-internal-cci-1",
          encounterId: "sandbox-demo",
          patientRegistrationId: "sandbox-demo-pat",
          workspaceId: ctx.session.workspaceId ?? "sandbox",
          charlsonTotalScore: 4,
          estimated10YearSurvivalPercent: 53.0,
          comorbilidadesJson: [
            { nombre: "Diabetes Mellitus Tipo 2 no complicada", pts: 1 },
            { nombre: "Enfermedad Renal Crónica Leve-Moderada", pts: 1 },
            { nombre: "Infarto de Miocardio previo", pts: 1 },
            { nombre: "Edad 60-69 años", pts: 1 },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }

      return ctx.db.internalCharlsonIndex.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })
    }),

  saveCharlsonIndex: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        charlsonTotalScore: z.number().int().min(0),
        estimated10YearSurvivalPercent: z.number().min(0).max(100),
        comorbilidadesJson: z.any(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-internal-cci-1" }
      }

      const existing = await ctx.db.internalCharlsonIndex.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })

      const data = {
        charlsonTotalScore: input.charlsonTotalScore,
        estimated10YearSurvivalPercent: input.estimated10YearSurvivalPercent,
        comorbilidadesJson: input.comorbilidadesJson,
      }

      if (existing) {
        return ctx.db.internalCharlsonIndex.update({
          where: { id: existing.id },
          data,
        })
      }

      return ctx.db.internalCharlsonIndex.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          ...data,
        },
      })
    }),

  // ─── 2. CALCULADORAS INTERNÍSTICAS (4T HIT, CHILD-PUGH & MELD) ───
  getClinicalScores: protectedProcedure
    .input(z.object({ encounterId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return {
          id: "sandbox-internal-scores-1",
          encounterId: "sandbox-demo",
          patientRegistrationId: "sandbox-demo-pat",
          workspaceId: ctx.session.workspaceId ?? "sandbox",
          fourTScoreHit: 2,
          fourTHitRiskCategory: "Probabilidad Baja de Trombocitopenia por Heparina (HIT <= 3 pts)",
          childPughScore: 6,
          childPughClass: "Clase A (Cirrosis Compensada - Buen Pronóstico)",
          meldScore: 11.2,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }

      return ctx.db.internalClinicalScores.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })
    }),

  saveClinicalScores: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        fourTScoreHit: z.number().int().min(0).max(8).optional().nullable(),
        fourTHitRiskCategory: z.string().optional().nullable(),
        childPughScore: z.number().int().min(5).max(15).optional().nullable(),
        childPughClass: z.string().optional().nullable(),
        meldScore: z.number().positive().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-internal-scores-1" }
      }

      const existing = await ctx.db.internalClinicalScores.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })

      const data = {
        fourTScoreHit: input.fourTScoreHit,
        fourTHitRiskCategory: input.fourTHitRiskCategory,
        childPughScore: input.childPughScore,
        childPughClass: input.childPughClass,
        meldScore: input.meldScore,
      }

      if (existing) {
        return ctx.db.internalClinicalScores.update({
          where: { id: existing.id },
          data,
        })
      }

      return ctx.db.internalClinicalScores.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          ...data,
        },
      })
    }),

  // ─── 3. POLIFARMACIA & DESPRESCRIPCIÓN (BEERS / STOPP-START) ───
  getPolypharmacyAlert: protectedProcedure
    .input(z.object({ encounterId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return {
          id: "sandbox-internal-poly-1",
          encounterId: "sandbox-demo",
          patientRegistrationId: "sandbox-demo-pat",
          workspaceId: ctx.session.workspaceId ?? "sandbox",
          conteoMedicamentosActivos: 7,
          criteriosBeersAplicables: "Uso de Benzodiazepina de vida media larga en adulto mayor (Riesgo de caídas y fracturas).",
          criteriosStoppStartAplicables: "STOPP: AINE prolongado con ClCr < 50 mL/min. START: Iniciar Estatina en prevención secundaria.",
          planDesprescripcion: "Descontinuar alprazolam progresivamente con disminución de 25% semanal. Sustituir AINE por paracetamol.",
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }

      return ctx.db.internalPolypharmacyAlert.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })
    }),

  savePolypharmacyAlert: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        conteoMedicamentosActivos: z.number().int().min(0),
        criteriosBeersAplicables: z.string().optional().nullable(),
        criteriosStoppStartAplicables: z.string().optional().nullable(),
        planDesprescripcion: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-internal-poly-1" }
      }

      const existing = await ctx.db.internalPolypharmacyAlert.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })

      const data = {
        conteoMedicamentosActivos: input.conteoMedicamentosActivos,
        criteriosBeersAplicables: input.criteriosBeersAplicables,
        criteriosStoppStartAplicables: input.criteriosStoppStartAplicables,
        planDesprescripcion: input.planDesprescripcion,
      }

      if (existing) {
        return ctx.db.internalPolypharmacyAlert.update({
          where: { id: existing.id },
          data,
        })
      }

      return ctx.db.internalPolypharmacyAlert.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          ...data,
        },
      })
    }),
})
