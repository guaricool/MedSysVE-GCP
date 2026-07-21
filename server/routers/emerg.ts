import { z } from "zod"
import { router, protectedProcedure } from "../trpc"
import { TRPCError } from "@trpc/server"
import { audit } from "@/lib/audit"

export const emergRouter = router({
  // ─── 1. TRIAGE ESTRUCTURADO (ESI LEVEL 1 - 5) ───
  getTriageAssessment: protectedProcedure
    .input(z.object({ encounterId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return {
          id: "sandbox-emerg-triage-1",
          encounterId: "sandbox-demo",
          patientRegistrationId: "sandbox-demo-pat",
          workspaceId: ctx.session.workspaceId ?? "sandbox",
          esiLevel: 2,
          triageColor: "Naranja (Emergencia - Alto Riesgo)",
          chiefComplaint: "Dolor torácico opresivo irradiado a mandíbula con diaforesis y disnea aguda.",
          targetWaitTimeMin: 10,
          glasgowComaScale: 15,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }

      return ctx.db.emergTriageAssessment.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })
    }),

  saveTriageAssessment: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        esiLevel: z.number().int().min(1).max(5),
        triageColor: z.string(),
        chiefComplaint: z.string(),
        targetWaitTimeMin: z.number().int().min(0),
        glasgowComaScale: z.number().int().min(3).max(15).optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-emerg-triage-1" }
      }

      const existing = await ctx.db.emergTriageAssessment.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })

      const data = {
        esiLevel: input.esiLevel,
        triageColor: input.triageColor,
        chiefComplaint: input.chiefComplaint,
        targetWaitTimeMin: input.targetWaitTimeMin,
        glasgowComaScale: input.glasgowComaScale,
      }

      if (existing) {
        return ctx.db.emergTriageAssessment.update({
          where: { id: existing.id },
          data,
        })
      }

      return ctx.db.emergTriageAssessment.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          ...data,
        },
      })
    }),

  // ─── 2. BITÁCORA CRONOMETRADA DE RCP & REANIMACIÓN ───
  getResusCode: protectedProcedure
    .input(z.object({ encounterId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return {
          id: "sandbox-emerg-resus-1",
          encounterId: "sandbox-demo",
          patientRegistrationId: "sandbox-demo-pat",
          workspaceId: ctx.session.workspaceId ?? "sandbox",
          startTime: new Date(),
          initialRhythm: "FV (Fibrilación Ventricular)",
          shocksDelivered: 3,
          joulesPerShock: 200,
          epinephrineDoses: 2,
          amiodaroneDoses: 1,
          roscAchieved: true,
          resusDurationMin: 14,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }

      return ctx.db.emergResusCode.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })
    }),

  saveResusCode: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        initialRhythm: z.string(),
        shocksDelivered: z.number().int().min(0),
        joulesPerShock: z.number().int().optional().nullable(),
        epinephrineDoses: z.number().int().min(0),
        amiodaroneDoses: z.number().int().min(0),
        roscAchieved: z.boolean(),
        resusDurationMin: z.number().int().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-emerg-resus-1" }
      }

      const existing = await ctx.db.emergResusCode.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })

      const data = {
        initialRhythm: input.initialRhythm,
        shocksDelivered: input.shocksDelivered,
        joulesPerShock: input.joulesPerShock,
        epinephrineDoses: input.epinephrineDoses,
        amiodaroneDoses: input.amiodaroneDoses,
        roscAchieved: input.roscAchieved,
        resusDurationMin: input.resusDurationMin,
      }

      if (existing) {
        return ctx.db.emergResusCode.update({
          where: { id: existing.id },
          data,
        })
      }

      return ctx.db.emergResusCode.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          ...data,
        },
      })
    }),

  // ─── 3. PROTOCOLOS DE MANEJO RÁPIDO DE EMERGENCIA ───
  getFastProtocol: protectedProcedure
    .input(z.object({ encounterId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return {
          id: "sandbox-emerg-fast-1",
          encounterId: "sandbox-demo",
          patientRegistrationId: "sandbox-demo-pat",
          workspaceId: ctx.session.workspaceId ?? "sandbox",
          protocolType: "Código Infarto IAM con Elevación del ST (IAMCEST)",
          doorToNeedleTimeMin: 35,
          thrombolyticAgent: "Estreptoquinasa 1.5 Millones UI IV en 60 min",
          vasopressorUsed: "Sin requerimiento de inotrópicos",
          fluidResusLiters: 1.0,
          protocolStatus: "Completado con Criterios de Reperfusión Positivos",
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }

      return ctx.db.emergFastProtocol.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })
    }),

  saveFastProtocol: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        protocolType: z.string(),
        doorToNeedleTimeMin: z.number().int().optional().nullable(),
        thrombolyticAgent: z.string().optional().nullable(),
        vasopressorUsed: z.string().optional().nullable(),
        fluidResusLiters: z.number().optional().nullable(),
        protocolStatus: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-emerg-fast-1" }
      }

      const existing = await ctx.db.emergFastProtocol.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })

      const data = {
        protocolType: input.protocolType,
        doorToNeedleTimeMin: input.doorToNeedleTimeMin,
        thrombolyticAgent: input.thrombolyticAgent,
        vasopressorUsed: input.vasopressorUsed,
        fluidResusLiters: input.fluidResusLiters,
        protocolStatus: input.protocolStatus,
      }

      if (existing) {
        return ctx.db.emergFastProtocol.update({
          where: { id: existing.id },
          data,
        })
      }

      return ctx.db.emergFastProtocol.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          ...data,
        },
      })
    }),
})
