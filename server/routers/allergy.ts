import { z } from "zod"
import { router, protectedProcedure } from "../trpc"
import { TRPCError } from "@trpc/server"
import { audit } from "@/lib/audit"

export const allergyRouter = router({
  // ─── 1. PRUEBAS CUTÁNEAS PRICK TEST / ALÉRGENOS ───
  getPrickTest: protectedProcedure
    .input(z.object({ encounterId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return {
          id: "sandbox-allergy-prick-1",
          encounterId: "sandbox-demo",
          patientRegistrationId: "sandbox-demo-pat",
          workspaceId: ctx.session.workspaceId ?? "sandbox",
          histamineControlMm: 7.0,
          salineControlMm: 0.0,
          dustMitesJson: JSON.stringify({ D_pteronyssinus: "8mm", D_farinae: "6mm", Blomia_tropicalis: "9mm" }),
          moldsFungiJson: JSON.stringify({ Alternaria_tenuis: "4mm", Aspergillus_fumigatus: "0mm" }),
          epitheliaAnimalJson: JSON.stringify({ Epitelio_Gato: "7mm", Epitelio_Perro: "0mm" }),
          pollensFoodsJson: JSON.stringify({ Polenes_Gramineas: "3mm" }),
          positiveReactionsCount: 4,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }

      return ctx.db.allergyPrickTest.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })
    }),

  savePrickTest: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        histamineControlMm: z.number().min(0),
        salineControlMm: z.number().min(0),
        dustMitesJson: z.string().optional().nullable(),
        moldsFungiJson: z.string().optional().nullable(),
        epitheliaAnimalJson: z.string().optional().nullable(),
        pollensFoodsJson: z.string().optional().nullable(),
        positiveReactionsCount: z.number().int().min(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-allergy-prick-1" }
      }

      const existing = await ctx.db.allergyPrickTest.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })

      const data = {
        histamineControlMm: input.histamineControlMm,
        salineControlMm: input.salineControlMm,
        dustMitesJson: input.dustMitesJson,
        moldsFungiJson: input.moldsFungiJson,
        epitheliaAnimalJson: input.epitheliaAnimalJson,
        pollensFoodsJson: input.pollensFoodsJson,
        positiveReactionsCount: input.positiveReactionsCount,
      }

      if (existing) {
        return ctx.db.allergyPrickTest.update({
          where: { id: existing.id },
          data,
        })
      }

      return ctx.db.allergyPrickTest.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          ...data,
        },
      })
    }),

  // ─── 2. ESQUEMA DE INMUNOTERAPIA & VACUNAS ALERGÉNICAS ───
  listImmunotherapies: protectedProcedure
    .input(z.object({ patientRegistrationId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.patientRegistrationId === "sandbox-demo-pat") {
        return [
          {
            id: "sandbox-allergy-immu-1",
            encounterId: "sandbox-demo",
            patientRegistrationId: "sandbox-demo-pat",
            workspaceId: ctx.session.workspaceId ?? "sandbox",
            therapyRoute: "SLIT Sublingual (Gotas bajo la lengua)",
            allergenicExtract: "Mezcla Ácaros (D.pteronyssinus 50% + Blomia 50%)",
            phase: "Fase de Mantenimiento (Frasco Concentrado Rojo)",
            vialConcentration: "Concentración Máxima 100.000 DPT/ml",
            doseAmount: "5 gotas diarias por 3 años",
            localReactionMm: 0,
            systemicReaction: "Sin reacciones adversas / Tolerancia excelente",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]
      }

      return ctx.db.allergyImmunotherapy.findMany({
        where: { patientRegistrationId: input.patientRegistrationId, workspaceId: ctx.session.workspaceId },
        orderBy: { createdAt: "desc" },
      })
    }),

  saveImmunotherapy: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        therapyRoute: z.string(),
        allergenicExtract: z.string(),
        phase: z.string(),
        vialConcentration: z.string(),
        doseAmount: z.string(),
        localReactionMm: z.number().min(0).optional().nullable(),
        systemicReaction: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-allergy-immu-1" }
      }

      return ctx.db.allergyImmunotherapy.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          therapyRoute: input.therapyRoute,
          allergenicExtract: input.allergenicExtract,
          phase: input.phase,
          vialConcentration: input.vialConcentration,
          doseAmount: input.doseAmount,
          localReactionMm: input.localReactionMm,
          systemicReaction: input.systemicReaction,
        },
      })
    }),

  // ─── 3. PANEL DE INMUNOGLOBULINAS E INMUNODEFICIENCIAS ───
  getIgPanel: protectedProcedure
    .input(z.object({ encounterId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return {
          id: "sandbox-allergy-ig-1",
          encounterId: "sandbox-demo",
          patientRegistrationId: "sandbox-demo-pat",
          workspaceId: ctx.session.workspaceId ?? "sandbox",
          totalIgEKuiL: 850.0,
          totalIgGMgDl: 1120.0,
          totalIgAMgDl: 210.0,
          totalIgMMgDl: 145.0,
          c3ComplementMgDl: 115.0,
          c4ComplementMgDl: 28.0,
          immunodeficiencyDiagnosis: "Atopia Severa Hiper-IgE (Rinitis & Asma Alérgica)",
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }

      return ctx.db.allergyImmunoglobulinPanel.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })
    }),

  saveIgPanel: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        totalIgEKuiL: z.number().min(0).optional().nullable(),
        totalIgGMgDl: z.number().min(0).optional().nullable(),
        totalIgAMgDl: z.number().min(0).optional().nullable(),
        totalIgMMgDl: z.number().min(0).optional().nullable(),
        c3ComplementMgDl: z.number().min(0).optional().nullable(),
        c4ComplementMgDl: z.number().min(0).optional().nullable(),
        immunodeficiencyDiagnosis: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-allergy-ig-1" }
      }

      const existing = await ctx.db.allergyImmunoglobulinPanel.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })

      const data = {
        totalIgEKuiL: input.totalIgEKuiL,
        totalIgGMgDl: input.totalIgGMgDl,
        totalIgAMgDl: input.totalIgAMgDl,
        totalIgMMgDl: input.totalIgMMgDl,
        c3ComplementMgDl: input.c3ComplementMgDl,
        c4ComplementMgDl: input.c4ComplementMgDl,
        immunodeficiencyDiagnosis: input.immunodeficiencyDiagnosis,
      }

      if (existing) {
        return ctx.db.allergyImmunoglobulinPanel.update({
          where: { id: existing.id },
          data,
        })
      }

      return ctx.db.allergyImmunoglobulinPanel.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          ...data,
        },
      })
    }),
})
