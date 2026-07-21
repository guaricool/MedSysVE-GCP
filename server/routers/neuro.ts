import { z } from "zod"
import { router, protectedProcedure } from "../trpc"
import { TRPCError } from "@trpc/server"
import { audit } from "@/lib/audit"

export const neuroRouter = router({
  // ─── 1. ESCALAS NEUROLÓGICAS (GLASGOW, NIHSS, EDSS) ───
  getScales: protectedProcedure
    .input(z.object({ encounterId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return {
          id: "sandbox-neuro-scale-1",
          encounterId: "sandbox-demo",
          patientRegistrationId: "sandbox-demo-pat",
          workspaceId: ctx.session.workspaceId ?? "sandbox",
          glasgowScore: 15,
          glasgowOcular: 4,
          glasgowVerbal: 5,
          glasgowMotor: 6,
          nihssScore: 2,
          nihssCategory: "Leve (1-4 pts)",
          edssScore: 1.5,
          observaciones: "Paciente alerta, orientado en 3 esferas. Mínima disartria residual.",
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }

      return ctx.db.neuroScaleRecord.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })
    }),

  saveScales: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        glasgowOcular: z.number().int().min(1).max(4).optional().nullable(),
        glasgowVerbal: z.number().int().min(1).max(5).optional().nullable(),
        glasgowMotor: z.number().int().min(1).max(6).optional().nullable(),
        nihssScore: z.number().int().min(0).max(42).optional().nullable(),
        edssScore: z.number().min(0).max(10).optional().nullable(),
        observaciones: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-neuro-scale-1" }
      }

      const glasgowTotal =
        input.glasgowOcular && input.glasgowVerbal && input.glasgowMotor
          ? input.glasgowOcular + input.glasgowVerbal + input.glasgowMotor
          : null

      let nihssCat: string | null = null
      if (input.nihssScore !== null && input.nihssScore !== undefined) {
        if (input.nihssScore === 0) nihssCat = "Normal (0 pts)"
        else if (input.nihssScore <= 4) nihssCat = "Leve (1-4 pts)"
        else if (input.nihssScore <= 15) nihssCat = "Moderado (5-15 pts)"
        else if (input.nihssScore <= 20) nihssCat = "Moderado-Grave (16-20 pts)"
        else nihssCat = "Grave (21-42 pts)"
      }

      const existing = await ctx.db.neuroScaleRecord.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })

      const data = {
        glasgowScore: glasgowTotal,
        glasgowOcular: input.glasgowOcular,
        glasgowVerbal: input.glasgowVerbal,
        glasgowMotor: input.glasgowMotor,
        nihssScore: input.nihssScore,
        nihssCategory: nihssCat,
        edssScore: input.edssScore,
        observaciones: input.observaciones,
      }

      if (existing) {
        return ctx.db.neuroScaleRecord.update({
          where: { id: existing.id },
          data,
        })
      }

      return ctx.db.neuroScaleRecord.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          ...data,
        },
      })
    }),

  // ─── 2. MAPA DERMATÓMICO DE SENSIBILIDAD ───
  listDermatomes: protectedProcedure
    .input(z.object({ encounterId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return [
          {
            id: "sandbox-derm-1",
            encounterId: "sandbox-demo",
            patientRegistrationId: "sandbox-demo-pat",
            workspaceId: ctx.session.workspaceId ?? "sandbox",
            nivelDermatoma: "C6",
            lado: "DERECHO",
            sensibilidadTactil: "HIPOESTESIA",
            sensibilidadDolorosa: "HIPOALGESIA",
            propiocepcion: "NORMAL",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: "sandbox-derm-2",
            encounterId: "sandbox-demo",
            patientRegistrationId: "sandbox-demo-pat",
            workspaceId: ctx.session.workspaceId ?? "sandbox",
            nivelDermatoma: "L5",
            lado: "BILATERAL",
            sensibilidadTactil: "NORMAL",
            sensibilidadDolorosa: "NORMAL",
            propiocepcion: "NORMAL",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]
      }

      return ctx.db.neuroDermatomeMap.findMany({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })
    }),

  saveDermatome: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        nivelDermatoma: z.string(),
        lado: z.string(),
        sensibilidadTactil: z.string(),
        sensibilidadDolorosa: z.string(),
        propiocepcion: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-derm-1" }
      }

      return ctx.db.neuroDermatomeMap.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          nivelDermatoma: input.nivelDermatoma,
          lado: input.lado,
          sensibilidadTactil: input.sensibilidadTactil,
          sensibilidadDolorosa: input.sensibilidadDolorosa,
          propiocepcion: input.propiocepcion,
        },
      })
    }),

  // ─── 3. DIARIO / REGISTRO DE CRISIS EPILÉPTICAS ───
  listSeizures: protectedProcedure
    .input(z.object({ patientRegistrationId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.patientRegistrationId === "sandbox-demo-pat") {
        return [
          {
            id: "sandbox-seizure-1",
            encounterId: "sandbox-demo",
            patientRegistrationId: "sandbox-demo-pat",
            workspaceId: ctx.session.workspaceId ?? "sandbox",
            tipoCrisis: "Focal Motor con Conexión Alterada",
            frecuenciaMensual: 1,
            duracionMinutos: 2.0,
            desencadenantes: "Privación de sueño y estrés laboral",
            auraDesc: "Sensación epigástrica ascendente (aura disautonómica)",
            estadoPostictal: "Somnolencia y confusión por 15 minutos",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]
      }

      return ctx.db.neuroSeizureLog.findMany({
        where: { patientRegistrationId: input.patientRegistrationId, workspaceId: ctx.session.workspaceId },
        orderBy: { createdAt: "desc" },
      })
    }),

  saveSeizure: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        tipoCrisis: z.string(),
        frecuenciaMensual: z.number().int().min(0),
        duracionMinutos: z.number().optional().nullable(),
        desencadenantes: z.string().optional().nullable(),
        auraDesc: z.string().optional().nullable(),
        estadoPostictal: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-seizure-1" }
      }

      return ctx.db.neuroSeizureLog.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          tipoCrisis: input.tipoCrisis,
          frecuenciaMensual: input.frecuenciaMensual,
          duracionMinutos: input.duracionMinutos,
          desencadenantes: input.desencadenantes,
          auraDesc: input.auraDesc,
          estadoPostictal: input.estadoPostictal,
        },
      })
    }),
})
