import { z } from "zod"
import { router, protectedProcedure } from "../trpc"
import { TRPCError } from "@trpc/server"
import { audit } from "@/lib/audit"

export const oncoRouter = router({
  // ─── 1. ESTADIFICACIÓN TNM AJCC & ESTADIO CLÍNICO ───
  getTnmStaging: protectedProcedure
    .input(z.object({ encounterId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return {
          id: "sandbox-onco-tnm-1",
          encounterId: "sandbox-demo",
          patientRegistrationId: "sandbox-demo-pat",
          workspaceId: ctx.session.workspaceId ?? "sandbox",
          primaryTumorT: "T2 (Tumor >2cm pero <=5cm en su mayor dimensión)",
          regionalNodesN: "N1 (Metástasis a 1-3 ganglios linfáticos axilares ipsilaterales)",
          distantMetastasisM: "M0 (Sin metástasis a distancia observada)",
          clinicalStageGroup: "Estadio IIB (T2 N1 M0)",
          histopatologia: "Carcinoma Ductal Infiltrante de Mama, Grado Histológico 2 (Nottingham 7/9). HER2 Negativo, RE (+ 90%), RP (+ 70%).",
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }

      return ctx.db.oncoTnmStaging.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })
    }),

  saveTnmStaging: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        primaryTumorT: z.string(),
        regionalNodesN: z.string(),
        distantMetastasisM: z.string(),
        clinicalStageGroup: z.string(),
        histopatologia: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-onco-tnm-1" }
      }

      const existing = await ctx.db.oncoTnmStaging.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })

      const data = {
        primaryTumorT: input.primaryTumorT,
        regionalNodesN: input.regionalNodesN,
        distantMetastasisM: input.distantMetastasisM,
        clinicalStageGroup: input.clinicalStageGroup,
        histopatologia: input.histopatologia,
      }

      if (existing) {
        return ctx.db.oncoTnmStaging.update({
          where: { id: existing.id },
          data,
        })
      }

      return ctx.db.oncoTnmStaging.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          ...data,
        },
      })
    }),

  // ─── 2. EVALUACIÓN DE CAPACIDAD FUNCIONAL (ECOG & KARNOFSKY) ───
  getPerformanceStatus: protectedProcedure
    .input(z.object({ encounterId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return {
          id: "sandbox-onco-perf-1",
          encounterId: "sandbox-demo",
          patientRegistrationId: "sandbox-demo-pat",
          workspaceId: ctx.session.workspaceId ?? "sandbox",
          ecogGrade: 1,
          karnofskyPercent: 90,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }

      return ctx.db.oncoPerformanceStatus.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })
    }),

  savePerformanceStatus: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        ecogGrade: z.number().int().min(0).max(4),
        karnofskyPercent: z.number().int().min(10).max(100),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-onco-perf-1" }
      }

      const existing = await ctx.db.oncoPerformanceStatus.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })

      const data = {
        ecogGrade: input.ecogGrade,
        karnofskyPercent: input.karnofskyPercent,
      }

      if (existing) {
        return ctx.db.oncoPerformanceStatus.update({
          where: { id: existing.id },
          data,
        })
      }

      return ctx.db.oncoPerformanceStatus.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          ...data,
        },
      })
    }),

  // ─── 3. PROTOCOLO DE QUIMIOTERAPIA & TOXICIDAD CTCAE v5.0 ───
  listChemoProtocols: protectedProcedure
    .input(z.object({ patientRegistrationId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.patientRegistrationId === "sandbox-demo-pat") {
        return [
          {
            id: "sandbox-onco-chemo-1",
            encounterId: "sandbox-demo",
            patientRegistrationId: "sandbox-demo-pat",
            workspaceId: ctx.session.workspaceId ?? "sandbox",
            esquemaAntineoplasico: "AC-T (Doxorrubicina + Ciclofosfamida seguidos de Paclitaxel)",
            intencionTratamiento: "Tratamiento Adyuvante Post-Quirúrgico",
            cicloNumero: 3,
            toxicidadCtcaeGrade: "Grado 1: Alopecia & Náuseas leves bien controladas con Ondansetrón.",
            observacionesProtocolo: "Hemograma con Neutrófilos Totales > 1,500/mm3. Apto para ciclo N° 3.",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]
      }

      return ctx.db.oncoChemoProtocol.findMany({
        where: { patientRegistrationId: input.patientRegistrationId, workspaceId: ctx.session.workspaceId },
        orderBy: { createdAt: "desc" },
      })
    }),

  saveChemoProtocol: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        esquemaAntineoplasico: z.string(),
        intencionTratamiento: z.string(),
        cicloNumero: z.number().int().positive(),
        toxicidadCtcaeGrade: z.string().optional().nullable(),
        observacionesProtocolo: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-onco-chemo-1" }
      }

      return ctx.db.oncoChemoProtocol.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          esquemaAntineoplasico: input.esquemaAntineoplasico,
          intencionTratamiento: input.intencionTratamiento,
          cicloNumero: input.cicloNumero,
          toxicidadCtcaeGrade: input.toxicidadCtcaeGrade,
          observacionesProtocolo: input.observacionesProtocolo,
        },
      })
    }),
})
