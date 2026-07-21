import { z } from "zod"
import { router, protectedProcedure } from "../trpc"
import { TRPCError } from "@trpc/server"
import { audit } from "@/lib/audit"

export const anesthesiaRouter = router({
  // ─── 1. VALORACIÓN PREANESTÉSICA & ESTADO FÍSICO ASA ───
  getPreEval: protectedProcedure
    .input(z.object({ encounterId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return {
          id: "sandbox-anesthesia-preeval-1",
          encounterId: "sandbox-demo",
          patientRegistrationId: "sandbox-demo-pat",
          workspaceId: ctx.session.workspaceId ?? "sandbox",
          asaPhysicalStatus: "ASA II (Paciente con enfermedad sistémica leve controlada)",
          isEmergency: false,
          horasAyuno: 8,
          antecedentesAnestesicos: "Sin complicaciones en anestesias previas. Negativo a hipertermia maligna.",
          riesgoCardiovascular: "Riesgo Bajo (Índice de Lee - RCRI 0 puntos)",
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }

      return ctx.db.anesthesiaPreEval.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })
    }),

  savePreEval: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        asaPhysicalStatus: z.string(),
        isEmergency: z.boolean().default(false),
        horasAyuno: z.number().int().min(0).optional().nullable(),
        antecedentesAnestesicos: z.string().optional().nullable(),
        riesgoCardiovascular: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-anesthesia-preeval-1" }
      }

      const existing = await ctx.db.anesthesiaPreEval.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })

      const data = {
        asaPhysicalStatus: input.asaPhysicalStatus,
        isEmergency: input.isEmergency,
        horasAyuno: input.horasAyuno,
        antecedentesAnestesicos: input.antecedentesAnestesicos,
        riesgoCardiovascular: input.riesgoCardiovascular,
      }

      if (existing) {
        return ctx.db.anesthesiaPreEval.update({
          where: { id: existing.id },
          data,
        })
      }

      return ctx.db.anesthesiaPreEval.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          ...data,
        },
      })
    }),

  // ─── 2. EVALUACIÓN DE VÍA AÉREA DIFÍCIL (MALLAMPATI & PATIL-ALDRETI) ───
  getAirwayAssessment: protectedProcedure
    .input(z.object({ encounterId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return {
          id: "sandbox-anesthesia-airway-1",
          encounterId: "sandbox-demo",
          patientRegistrationId: "sandbox-demo-pat",
          workspaceId: ctx.session.workspaceId ?? "sandbox",
          mallampatiClass: "Clase I (Visibilidad total del paladar blando, úvula, pilares y amígdalas)",
          distanciaTiromentonianaMm: 65,
          aperturaBucalMm: 45,
          movilidadCervical: "Conservada (> 35° de extensión)",
          protrusionMandibular: "Clase I (Incisivos inferiores protruyen más allá de los superiores)",
          prediccionViaAereaDificil: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }

      return ctx.db.anesthesiaAirwayAssessment.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })
    }),

  saveAirwayAssessment: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        mallampatiClass: z.string(),
        distanciaTiromentonianaMm: z.number().positive().optional().nullable(),
        aperturaBucalMm: z.number().positive().optional().nullable(),
        movilidadCervical: z.string(),
        protrusionMandibular: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const isMallampatiHigh = input.mallampatiClass.includes("III") || input.mallampatiClass.includes("IV")
      const isDistanciaShort = input.distanciaTiromentonianaMm ? input.distanciaTiromentonianaMm < 60 : false
      const isAperturaNarrow = input.aperturaBucalMm ? input.aperturaBucalMm < 35 : false
      const isMovilidadLimited = input.movilidadCervical.includes("Limitada") || input.movilidadCervical.includes("Nula")

      const isVadPredictive = isMallampatiHigh || isDistanciaShort || isAperturaNarrow || isMovilidadLimited

      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-anesthesia-airway-1" }
      }

      const existing = await ctx.db.anesthesiaAirwayAssessment.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })

      const data = {
        mallampatiClass: input.mallampatiClass,
        distanciaTiromentonianaMm: input.distanciaTiromentonianaMm,
        aperturaBucalMm: input.aperturaBucalMm,
        movilidadCervical: input.movilidadCervical,
        protrusionMandibular: input.protrusionMandibular,
        prediccionViaAereaDificil: isVadPredictive,
      }

      if (existing) {
        return ctx.db.anesthesiaAirwayAssessment.update({
          where: { id: existing.id },
          data,
        })
      }

      return ctx.db.anesthesiaAirwayAssessment.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          ...data,
        },
      })
    }),

  // ─── 3. REGISTRO INTRAOPERATORIO DE ANESTESIA ───
  getIntraopRecord: protectedProcedure
    .input(z.object({ encounterId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return {
          id: "sandbox-anesthesia-intraop-1",
          encounterId: "sandbox-demo",
          patientRegistrationId: "sandbox-demo-pat",
          workspaceId: ctx.session.workspaceId ?? "sandbox",
          tecnicaAnestesica: "General Balanceada (Inhalatoria + Intravenosa)",
          agentesUtilizados: "Propofol 150mg IV, Fentanilo 200mcg IV, Rocuronio 50mg IV, Sevoflurano 1.8-2.0 CAM.",
          monitoreoUtilizado: "ECG 5 derivaciones, PNI cada 5 min, SpO2, EtCO2, BIS (40-60).",
          eventosRelevantes: "Intubación endotraqueal al primer intento con tubo 7.5. Hemodinamia estable.",
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }

      return ctx.db.anesthesiaIntraopRecord.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })
    }),

  saveIntraopRecord: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        tecnicaAnestesica: z.string(),
        agentesUtilizados: z.string(),
        monitoreoUtilizado: z.string(),
        eventosRelevantes: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-anesthesia-intraop-1" }
      }

      const existing = await ctx.db.anesthesiaIntraopRecord.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })

      const data = {
        tecnicaAnestesica: input.tecnicaAnestesica,
        agentesUtilizados: input.agentesUtilizados,
        monitoreoUtilizado: input.monitoreoUtilizado,
        eventosRelevantes: input.eventosRelevantes,
      }

      if (existing) {
        return ctx.db.anesthesiaIntraopRecord.update({
          where: { id: existing.id },
          data,
        })
      }

      return ctx.db.anesthesiaIntraopRecord.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          ...data,
        },
      })
    }),
})
