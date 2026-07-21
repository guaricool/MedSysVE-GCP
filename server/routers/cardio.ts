import { z } from "zod"
import { router, protectedProcedure } from "../trpc"
import { TRPCError } from "@trpc/server"
import { audit } from "@/lib/audit"

export const cardioRouter = router({
  // ─── 1. ELECTROCARDIOGRAMA (EKG) ───
  getEkg: protectedProcedure
    .input(z.object({ encounterId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return {
          id: "sandbox-ekg-1",
          encounterId: "sandbox-demo",
          patientRegistrationId: "sandbox-demo-pat",
          workspaceId: ctx.session.workspaceId ?? "sandbox",
          ritmo: "Sinusal Normal",
          frecuenciaCardiaca: 72,
          ejeQrs: 45,
          intervaloPr: 160,
          duracionQrs: 88,
          intervaloQtc: 410,
          ondaP: "Positiva en DII, DIII, aVF",
          segmentoSt: "Isoeléctrico sin alteración de repolarización",
          ondaT: "Positiva en derivaciones izquierdas",
          conclusion: "EKG de 12 derivaciones dentro de límites normales.",
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }

      return ctx.db.cardioEkg.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })
    }),

  saveEkg: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        ritmo: z.string(),
        frecuenciaCardiaca: z.number().int().min(30).max(250),
        ejeQrs: z.number().int().optional().nullable(),
        intervaloPr: z.number().int().optional().nullable(),
        duracionQrs: z.number().int().optional().nullable(),
        intervaloQtc: z.number().int().optional().nullable(),
        ondaP: z.string().optional().nullable(),
        segmentoSt: z.string().optional().nullable(),
        ondaT: z.string().optional().nullable(),
        conclusion: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-ekg-1" }
      }

      const existing = await ctx.db.cardioEkg.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })

      const data = {
        ritmo: input.ritmo,
        frecuenciaCardiaca: input.frecuenciaCardiaca,
        ejeQrs: input.ejeQrs,
        intervaloPr: input.intervaloPr,
        duracionQrs: input.duracionQrs,
        intervaloQtc: input.intervaloQtc,
        ondaP: input.ondaP,
        segmentoSt: input.segmentoSt,
        ondaT: input.ondaT,
        conclusion: input.conclusion,
      }

      if (existing) {
        return ctx.db.cardioEkg.update({
          where: { id: existing.id },
          data,
        })
      }

      return ctx.db.cardioEkg.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          ...data,
        },
      })
    }),

  // ─── 2. ECOCARDIOGRAMA DOPPLER ───
  getEcho: protectedProcedure
    .input(z.object({ encounterId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return {
          id: "sandbox-echo-1",
          encounterId: "sandbox-demo",
          patientRegistrationId: "sandbox-demo-pat",
          workspaceId: ctx.session.workspaceId ?? "sandbox",
          fevi: 62,
          metodoFevi: "Simpson Biplano",
          ddvi: 48,
          dsvi: 30,
          septum: 10,
          paredPosterior: 9,
          auriculaIzquierda: 34,
          raizAortica: 31,
          valvulaAortica: "Tripliegue, apertura conservada, sin estenosis",
          valvulaMitral: "Estructura conservada, insg. leve (+/IV)",
          valvulaTricuspide: "Normoconfigurada",
          motilidadPared: "Normocinesia parietal global de VI",
          presionArterialPulmonar: 22,
          conclusion: "Ecocardiograma Doppler dentro de parámetros normales. FEVI 62% por Simpson.",
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }

      return ctx.db.cardioEcho.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })
    }),

  saveEcho: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        fevi: z.number().min(10).max(90),
        metodoFevi: z.string().optional().nullable(),
        ddvi: z.number().optional().nullable(),
        dsvi: z.number().optional().nullable(),
        septum: z.number().optional().nullable(),
        paredPosterior: z.number().optional().nullable(),
        auriculaIzquierda: z.number().optional().nullable(),
        raizAortica: z.number().optional().nullable(),
        valvulaAortica: z.string().optional().nullable(),
        valvulaMitral: z.string().optional().nullable(),
        valvulaTricuspide: z.string().optional().nullable(),
        motilidadPared: z.string().optional().nullable(),
        presionArterialPulmonar: z.number().optional().nullable(),
        conclusion: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-echo-1" }
      }

      const existing = await ctx.db.cardioEcho.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })

      const data = {
        fevi: input.fevi,
        metodoFevi: input.metodoFevi,
        ddvi: input.ddvi,
        dsvi: input.dsvi,
        septum: input.septum,
        paredPosterior: input.paredPosterior,
        auriculaIzquierda: input.auriculaIzquierda,
        raizAortica: input.raizAortica,
        valvulaAortica: input.valvulaAortica,
        valvulaMitral: input.valvulaMitral,
        valvulaTricuspide: input.valvulaTricuspide,
        motilidadPared: input.motilidadPared,
        presionArterialPulmonar: input.presionArterialPulmonar,
        conclusion: input.conclusion,
      }

      if (existing) {
        return ctx.db.cardioEcho.update({
          where: { id: existing.id },
          data,
        })
      }

      return ctx.db.cardioEcho.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          ...data,
        },
      })
    }),

  // ─── 3. CALCULADORAS DE RIESGO CARDIOVASCULAR (SCORE2, ASCVD, CHA₂DS₂-VASc) ───
  getRiskScores: protectedProcedure
    .input(z.object({ encounterId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return {
          id: "sandbox-risk-1",
          encounterId: "sandbox-demo",
          patientRegistrationId: "sandbox-demo-pat",
          workspaceId: ctx.session.workspaceId ?? "sandbox",
          score2Value: 6.8,
          score2Category: "Riesgo Alto",
          ascvdValue: 8.5,
          ascvdCategory: "Riesgo Intermedio",
          cha2ds2VascScore: 2,
          cha2ds2VascRisk: "Riesgo Moderado-Alto (2.2% ACV/año) -> Anticoagulación Recomendada (ACOD)",
          hasBledScore: 1,
          observaciones: "Paciente masculino de 58 años, fumador, hipertensión arterial controlada.",
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }

      return ctx.db.cardioRiskScore.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })
    }),

  saveRiskScores: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        score2Value: z.number().optional().nullable(),
        score2Category: z.string().optional().nullable(),
        ascvdValue: z.number().optional().nullable(),
        ascvdCategory: z.string().optional().nullable(),
        cha2ds2VascScore: z.number().int().optional().nullable(),
        cha2ds2VascRisk: z.string().optional().nullable(),
        hasBledScore: z.number().int().optional().nullable(),
        observaciones: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-risk-1" }
      }

      const existing = await ctx.db.cardioRiskScore.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })

      const data = {
        score2Value: input.score2Value,
        score2Category: input.score2Category,
        ascvdValue: input.ascvdValue,
        ascvdCategory: input.ascvdCategory,
        cha2ds2VascScore: input.cha2ds2VascScore,
        cha2ds2VascRisk: input.cha2ds2VascRisk,
        hasBledScore: input.hasBledScore,
        observaciones: input.observaciones,
      }

      if (existing) {
        return ctx.db.cardioRiskScore.update({
          where: { id: existing.id },
          data,
        })
      }

      return ctx.db.cardioRiskScore.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          ...data,
        },
      })
    }),

  // ─── 4. FLUJOGRAMA LONGITUDINAL COMPARATIVO (HISTORIAL CARDIO) ───
  getPatientLongitudinalData: protectedProcedure
    .input(z.object({ patientRegistrationId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.patientRegistrationId === "sandbox-demo-pat") {
        return {
          vitalsHistory: [
            { fecha: "2025-10-15", paSistolica: 145, paDiastolica: 92, peso: 84.5, fc: 82 },
            { fecha: "2025-12-20", paSistolica: 138, paDiastolica: 88, peso: 83.0, fc: 76 },
            { fecha: "2026-03-10", paSistolica: 130, paDiastolica: 82, peso: 81.5, fc: 74 },
            { fecha: "2026-07-21", paSistolica: 124, paDiastolica: 78, peso: 80.0, fc: 70 },
          ],
          lipidsHistory: [
            { fecha: "2025-10-15", colTotal: 240, ldl: 165, hdl: 42, trigliceridos: 210 },
            { fecha: "2026-03-10", colTotal: 195, ldl: 120, hdl: 46, trigliceridos: 160 },
            { fecha: "2026-07-21", colTotal: 168, ldl: 92, hdl: 50, trigliceridos: 130 },
          ],
          medicationsHistory: [
            { fecha: "2025-10-15", medicamentos: ["Losartán 50mg/día", "Amlodipina 5mg/día"] },
            { fecha: "2026-03-10", medicamentos: ["Losartán 50mg/día", "Atorvastatina 20mg/noche"] },
            { fecha: "2026-07-21", medicamentos: ["Losartán 50mg/día", "Atorvastatina 20mg/noche", "Aspirina 100mg/día"] },
          ],
        }
      }

      const encounters = await ctx.db.encounter.findMany({
        where: { patientRegistrationId: input.patientRegistrationId, workspaceId: ctx.session.workspaceId },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          createdAt: true,
          datosEspecialidad: true,
          prescriptions: {
            include: { items: { include: { medication: true } } },
          },
        },
      })

      const vitalsHistory = encounters
        .map((e) => {
          const datos = (e.datosEspecialidad as any) || {}
          return {
            fecha: e.createdAt.toISOString().split("T")[0],
            paSistolica: datos.paSistolica || null,
            paDiastolica: datos.paDiastolica || null,
            peso: datos.peso || null,
            fc: datos.fc || null,
          }
        })
        .filter((v) => v.paSistolica !== null || v.peso !== null)

      return {
        vitalsHistory,
        lipidsHistory: [],
        medicationsHistory: [],
      }
    }),
})
