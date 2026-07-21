import { z } from "zod"
import { router, protectedProcedure } from "../trpc"
import { TRPCError } from "@trpc/server"
import { audit } from "@/lib/audit"

export const plasticRouter = router({
  // ─── 1. MAPEO CORPORAL PRE Y POST-OPERATORIO ───
  getBodyMapping: protectedProcedure
    .input(z.object({ encounterId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return {
          id: "sandbox-plastic-map-1",
          encounterId: "sandbox-demo",
          patientRegistrationId: "sandbox-demo-pat",
          workspaceId: ctx.session.workspaceId ?? "sandbox",
          procedureTypes: "Liposucción HD + Lipotransferencia Glútea + Abdominoplastia",
          targetAreasJson: JSON.stringify(["Abdomen Flancos", "Espalda Alta/Baja", "Región Glútea"]),
          estimatedLipoCc: 3200,
          graftVolumeCc: 450,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }

      return ctx.db.plasticBodyMapping.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })
    }),

  saveBodyMapping: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        procedureTypes: z.string(),
        targetAreasJson: z.string().optional().nullable(),
        estimatedLipoCc: z.number().int().optional().nullable(),
        graftVolumeCc: z.number().int().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-plastic-map-1" }
      }

      const existing = await ctx.db.plasticBodyMapping.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })

      const data = {
        procedureTypes: input.procedureTypes,
        targetAreasJson: input.targetAreasJson,
        estimatedLipoCc: input.estimatedLipoCc,
        graftVolumeCc: input.graftVolumeCc,
      }

      if (existing) {
        return ctx.db.plasticBodyMapping.update({
          where: { id: existing.id },
          data,
        })
      }

      return ctx.db.plasticBodyMapping.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          ...data,
        },
      })
    }),

  // ─── 2. REGISTRO & CARNET DE IMPLANTES MAMARIOS Y PRÓTESIS ───
  listImplants: protectedProcedure
    .input(z.object({ patientRegistrationId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.patientRegistrationId === "sandbox-demo-pat") {
        return [
          {
            id: "sandbox-plastic-imp-1",
            encounterId: "sandbox-demo",
            patientRegistrationId: "sandbox-demo-pat",
            workspaceId: ctx.session.workspaceId ?? "sandbox",
            side: "Mama Izquierda / Derecha (Bilateral)",
            brand: "Motiva Ergonomix Ergonomic Surface",
            volumeCc: 375,
            profile: "Perfil Alto Corsé",
            placementPlane: "Plano Dual (Dual Plane III)",
            incisionSite: "Vía Surco Inframamario",
            lotNumber: "LOT-2025-9982",
            serialNumber: "SN-MOT-889102-L / R",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]
      }

      return ctx.db.plasticBreastImplant.findMany({
        where: { patientRegistrationId: input.patientRegistrationId, workspaceId: ctx.session.workspaceId },
        orderBy: { createdAt: "desc" },
      })
    }),

  saveImplant: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        side: z.string(),
        brand: z.string(),
        volumeCc: z.number().int().positive(),
        profile: z.string(),
        placementPlane: z.string(),
        incisionSite: z.string(),
        lotNumber: z.string().optional().nullable(),
        serialNumber: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-plastic-imp-1" }
      }

      return ctx.db.plasticBreastImplant.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          side: input.side,
          brand: input.brand,
          volumeCc: input.volumeCc,
          profile: input.profile,
          placementPlane: input.placementPlane,
          incisionSite: input.incisionSite,
          lotNumber: input.lotNumber,
          serialNumber: input.serialNumber,
        },
      })
    }),

  // ─── 3. ESCALA DE CICATRIZACIÓN DE VANCOUVER (VSS) ───
  getScarAssessment: protectedProcedure
    .input(z.object({ encounterId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return {
          id: "sandbox-plastic-scar-1",
          encounterId: "sandbox-demo",
          patientRegistrationId: "sandbox-demo-pat",
          workspaceId: ctx.session.workspaceId ?? "sandbox",
          vancouverVssScore: 3,
          pigmentation: "Hiperpigmentada (Leve incremento melanina)",
          vascularity: "Rosada / Leve vasodilatación",
          pliability: "Flexible (Cede a la presión sin adherencias profundas)",
          heightMm: 1.5,
          scarType: "Normotrófica en proceso madurativo adecuado",
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }

      return ctx.db.plasticScarAssessment.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })
    }),

  saveScarAssessment: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        vancouverVssScore: z.number().int().min(0).max(13),
        pigmentation: z.string(),
        vascularity: z.string(),
        pliability: z.string(),
        heightMm: z.number().min(0),
        scarType: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-plastic-scar-1" }
      }

      const existing = await ctx.db.plasticScarAssessment.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })

      const data = {
        vancouverVssScore: input.vancouverVssScore,
        pigmentation: input.pigmentation,
        vascularity: input.vascularity,
        pliability: input.pliability,
        heightMm: input.heightMm,
        scarType: input.scarType,
      }

      if (existing) {
        return ctx.db.plasticScarAssessment.update({
          where: { id: existing.id },
          data,
        })
      }

      return ctx.db.plasticScarAssessment.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          ...data,
        },
      })
    }),
})
