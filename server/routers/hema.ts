import { z } from "zod"
import { router, protectedProcedure } from "../trpc"
import { TRPCError } from "@trpc/server"
import { audit } from "@/lib/audit"

export const hemaRouter = router({
  // ─── 1. SERIE ROJA / BLANCA / PLAQUETARIA & FROTIS SANGRE PERIFÉRICA ───
  getPeripheralSmear: protectedProcedure
    .input(z.object({ encounterId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return {
          id: "sandbox-hema-smear-1",
          encounterId: "sandbox-demo",
          patientRegistrationId: "sandbox-demo-pat",
          workspaceId: ctx.session.workspaceId ?? "sandbox",
          redSeriesFindings: "Abundantes Drepanocitos (Sickle cells 15%), Dacrocitos +, Hipocromía ++",
          whiteSeriesFindings: "Leucocitosis reactiva 14.500/mm3 con neutrofilia sin blastos",
          plateletSeriesFindings: "Trombocitosis reactiva 480.000/mm3 sin agregados",
          blastPercentage: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }

      return ctx.db.hemaPeripheralSmear.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })
    }),

  savePeripheralSmear: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        redSeriesFindings: z.string(),
        whiteSeriesFindings: z.string(),
        plateletSeriesFindings: z.string(),
        blastPercentage: z.number().min(0).max(100).optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-hema-smear-1" }
      }

      const existing = await ctx.db.hemaPeripheralSmear.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })

      const data = {
        redSeriesFindings: input.redSeriesFindings,
        whiteSeriesFindings: input.whiteSeriesFindings,
        plateletSeriesFindings: input.plateletSeriesFindings,
        blastPercentage: input.blastPercentage,
      }

      if (existing) {
        return ctx.db.hemaPeripheralSmear.update({
          where: { id: existing.id },
          data,
        })
      }

      return ctx.db.hemaPeripheralSmear.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          ...data,
        },
      })
    }),

  // ─── 2. MÓDULO DE DREPANOCITOSIS / ANEMIA FALCIFORME (ELECTROFORESIS HBS) ───
  getSickleCellModule: protectedProcedure
    .input(z.object({ encounterId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return {
          id: "sandbox-hema-sickle-1",
          encounterId: "sandbox-demo",
          patientRegistrationId: "sandbox-demo-pat",
          workspaceId: ctx.session.workspaceId ?? "sandbox",
          hbSPercent: 82.5,
          hbAPercent: 0.0,
          hbFPercent: 14.2,
          reticulocytePercent: 8.5,
          vasoocclusiveCrisisYear: 3,
          hydroxyureaDoseMgDay: 1000,
          transfusionProgramActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }

      return ctx.db.hemaSickleCellModule.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })
    }),

  saveSickleCellModule: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        hbSPercent: z.number().min(0).max(100),
        hbAPercent: z.number().min(0).max(100),
        hbFPercent: z.number().min(0).max(100),
        reticulocytePercent: z.number().min(0).optional().nullable(),
        vasoocclusiveCrisisYear: z.number().int().min(0),
        hydroxyureaDoseMgDay: z.number().positive().optional().nullable(),
        transfusionProgramActive: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-hema-sickle-1" }
      }

      const existing = await ctx.db.hemaSickleCellModule.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })

      const data = {
        hbSPercent: input.hbSPercent,
        hbAPercent: input.hbAPercent,
        hbFPercent: input.hbFPercent,
        reticulocytePercent: input.reticulocytePercent,
        vasoocclusiveCrisisYear: input.vasoocclusiveCrisisYear,
        hydroxyureaDoseMgDay: input.hydroxyureaDoseMgDay,
        transfusionProgramActive: input.transfusionProgramActive,
      }

      if (existing) {
        return ctx.db.hemaSickleCellModule.update({
          where: { id: existing.id },
          data,
        })
      }

      return ctx.db.hemaSickleCellModule.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          ...data,
        },
      })
    }),

  // ─── 3. PROTOCOLOS DE TRANSFUSIÓN DE HEMOCOMPONENTES ───
  listTransfusions: protectedProcedure
    .input(z.object({ patientRegistrationId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.patientRegistrationId === "sandbox-demo-pat") {
        return [
          {
            id: "sandbox-hema-trans-1",
            encounterId: "sandbox-demo",
            patientRegistrationId: "sandbox-demo-pat",
            workspaceId: ctx.session.workspaceId ?? "sandbox",
            componentType: "Concentrado Globular CG Desleucocitado",
            unitsCount: 2,
            bloodGroupRh: "O Positivo (O+)",
            crossmatchResult: "Compatible / Coombs Directo Negativo",
            adverseReaction: "Sin reacciones adversas / Tolerado adecuadamente",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]
      }

      return ctx.db.hemaTransfusionRecord.findMany({
        where: { patientRegistrationId: input.patientRegistrationId, workspaceId: ctx.session.workspaceId },
        orderBy: { createdAt: "desc" },
      })
    }),

  saveTransfusion: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        componentType: z.string(),
        unitsCount: z.number().int().min(1),
        bloodGroupRh: z.string(),
        crossmatchResult: z.string(),
        adverseReaction: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-hema-trans-1" }
      }

      return ctx.db.hemaTransfusionRecord.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          componentType: input.componentType,
          unitsCount: input.unitsCount,
          bloodGroupRh: input.bloodGroupRh,
          crossmatchResult: input.crossmatchResult,
          adverseReaction: input.adverseReaction,
        },
      })
    }),
})
