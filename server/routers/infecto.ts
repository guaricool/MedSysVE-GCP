import { z } from "zod"
import { router, protectedProcedure } from "../trpc"
import { TRPCError } from "@trpc/server"
import { audit } from "@/lib/audit"

export const infectoRouter = router({
  // ─── 1. ANTIBIOGRAMA INTERACTIVO & PANEL DE SENSIBILIDAD ───
  listAntibiograms: protectedProcedure
    .input(z.object({ patientRegistrationId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.patientRegistrationId === "sandbox-demo-pat") {
        return [
          {
            id: "sandbox-infecto-abg-1",
            encounterId: "sandbox-demo",
            patientRegistrationId: "sandbox-demo-pat",
            workspaceId: ctx.session.workspaceId ?? "sandbox",
            tipoMuestra: "Hemocultivo Central",
            microorganismoAislado: "Klebsiella pneumoniae BLEE (+)",
            panelSensibilidadJson: [
              { antibiotico: "Meropenem", interpretacion: "S", micUgMl: 0.25 },
              { antibiotico: "Amikacina", interpretacion: "S", micUgMl: 2.0 },
              { antibiotico: "Ceftriaxona", interpretacion: "R", micUgMl: 64.0 },
              { antibiotico: "Ciprofloxacina", interpretacion: "R", micUgMl: 16.0 },
              { antibiotico: "Piperacilina/Tazobactam", interpretacion: "I", micUgMl: 16.0 },
            ],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]
      }

      return ctx.db.infectoAntibiogram.findMany({
        where: { patientRegistrationId: input.patientRegistrationId, workspaceId: ctx.session.workspaceId },
        orderBy: { createdAt: "desc" },
      })
    }),

  saveAntibiogram: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        tipoMuestra: z.string(),
        microorganismoAislado: z.string(),
        panelSensibilidadJson: z.any(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-infecto-abg-1" }
      }

      return ctx.db.infectoAntibiogram.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          tipoMuestra: input.tipoMuestra,
          microorganismoAislado: input.microorganismoAislado,
          panelSensibilidadJson: input.panelSensibilidadJson,
        },
      })
    }),

  // ─── 2. CALCULADORA DE AJUSTE ANTIMICROBIANO RENAL (ClCr) ───
  listRenalAdjustments: protectedProcedure
    .input(z.object({ patientRegistrationId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.patientRegistrationId === "sandbox-demo-pat") {
        return [
          {
            id: "sandbox-infecto-renal-1",
            encounterId: "sandbox-demo",
            patientRegistrationId: "sandbox-demo-pat",
            workspaceId: ctx.session.workspaceId ?? "sandbox",
            creatininaSericaMgDl: 1.8,
            clearanceCreatininaMlMin: 42.5,
            antimicrobianoEvaluado: "Vancomicina IV",
            dosisAjustadaRecomendada: "15 mg/kg cada 24 horas (Ajustado por ClCr 42.5 mL/min)",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]
      }

      return ctx.db.infectoRenalAdjustment.findMany({
        where: { patientRegistrationId: input.patientRegistrationId, workspaceId: ctx.session.workspaceId },
        orderBy: { createdAt: "desc" },
      })
    }),

  saveRenalAdjustment: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        creatininaSericaMgDl: z.number().positive(),
        clearanceCreatininaMlMin: z.number().positive(),
        antimicrobianoEvaluado: z.string(),
        dosisAjustadaRecomendada: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-infecto-renal-1" }
      }

      return ctx.db.infectoRenalAdjustment.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          creatininaSericaMgDl: input.creatininaSericaMgDl,
          clearanceCreatininaMlMin: input.clearanceCreatininaMlMin,
          antimicrobianoEvaluado: input.antimicrobianoEvaluado,
          dosisAjustadaRecomendada: input.dosisAjustadaRecomendada,
        },
      })
    }),

  // ─── 3. CONTROL DE INFECCIONES & AISLAMIENTO EPIDEMIOLÓGICO ───
  getInfectionControl: protectedProcedure
    .input(z.object({ encounterId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return {
          id: "sandbox-infecto-ctrl-1",
          encounterId: "sandbox-demo",
          patientRegistrationId: "sandbox-demo-pat",
          workspaceId: ctx.session.workspaceId ?? "sandbox",
          tipoAislamiento: "Aislamiento de Contacto + Gotas",
          germenMultidrogorresistenteMdr: "KPC (Klebsiella pneumoniae productora de carbapenemasa)",
          notificadoEpidemiologia: true,
          observacionesControlInfeccion: "Habitación individual con presión negativa. Uso obligatorio de bata y guantes al ingreso.",
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }

      return ctx.db.infectoInfectionControl.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })
    }),

  saveInfectionControl: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        tipoAislamiento: z.string(),
        germenMultidrogorresistenteMdr: z.string().optional().nullable(),
        notificadoEpidemiologia: z.boolean().default(false),
        observacionesControlInfeccion: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-infecto-ctrl-1" }
      }

      const existing = await ctx.db.infectoInfectionControl.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })

      const data = {
        tipoAislamiento: input.tipoAislamiento,
        germenMultidrogorresistenteMdr: input.germenMultidrogorresistenteMdr,
        notificadoEpidemiologia: input.notificadoEpidemiologia,
        observacionesControlInfeccion: input.observacionesControlInfeccion,
      }

      if (existing) {
        return ctx.db.infectoInfectionControl.update({
          where: { id: existing.id },
          data,
        })
      }

      return ctx.db.infectoInfectionControl.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          ...data,
        },
      })
    }),
})
