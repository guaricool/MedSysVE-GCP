import { z } from "zod"
import { router, protectedProcedure } from "../trpc"
import { TRPCError } from "@trpc/server"
import { audit } from "@/lib/audit"

export const fammedRouter = router({
  // ─── 1. GENOGRAMA FAMILIAR INTERACTIVO DE 3 GENERACIONES ───
  getGenogram: protectedProcedure
    .input(z.object({ encounterId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return {
          id: "sandbox-fammed-geno-1",
          encounterId: "sandbox-demo",
          patientRegistrationId: "sandbox-demo-pat",
          workspaceId: ctx.session.workspaceId ?? "sandbox",
          generationsCount: 3,
          membersCount: 6,
          genogramDataJson: JSON.stringify({
            members: [
              { id: "g1_father", name: "Abuelo Paterno", age: 78, diseases: ["HTA", "ACV"] },
              { id: "g1_mother", name: "Abuela Paterna", age: 74, diseases: ["DM2"] },
              { id: "g2_father", name: "Padre", age: 52, diseases: ["HTA"] },
              { id: "g2_mother", name: "Madre", age: 49, diseases: ["Sano"] },
              { id: "g3_patient", name: "Paciente Paciente", age: 24, diseases: ["Asma"] },
              { id: "g3_sibling", name: "Hermano", age: 20, diseases: ["Sano"] },
            ],
          }),
          hereditaryRisksJson: JSON.stringify(["Hipertensión Arterial HTA", "Diabetes Mellitus Tipo 2", "Asma Bronquial"]),
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }

      return ctx.db.famMedGenogram.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })
    }),

  saveGenogram: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        generationsCount: z.number().int().min(1).max(5),
        membersCount: z.number().int().min(0),
        genogramDataJson: z.string().optional().nullable(),
        hereditaryRisksJson: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-fammed-geno-1" }
      }

      const existing = await ctx.db.famMedGenogram.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })

      const data = {
        generationsCount: input.generationsCount,
        membersCount: input.membersCount,
        genogramDataJson: input.genogramDataJson,
        hereditaryRisksJson: input.hereditaryRisksJson,
      }

      if (existing) {
        return ctx.db.famMedGenogram.update({
          where: { id: existing.id },
          data,
        })
      }

      return ctx.db.famMedGenogram.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          ...data,
        },
      })
    }),

  // ─── 2. APGAR FAMILIAR (DINÁMICA & FUNCIONALIDAD FAMILIAR) ───
  getApgarScore: protectedProcedure
    .input(z.object({ encounterId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return {
          id: "sandbox-fammed-apgar-1",
          encounterId: "sandbox-demo",
          patientRegistrationId: "sandbox-demo-pat",
          workspaceId: ctx.session.workspaceId ?? "sandbox",
          adaptabilityScore: 2,
          partnershipScore: 1,
          growthScore: 2,
          affectionScore: 2,
          resolveScore: 1,
          totalApgarScore: 8,
          functionalityCategory: "Buena Funcionalidad Familiar (APGAR 7 - 10 pts)",
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }

      return ctx.db.famMedApgarScore.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })
    }),

  saveApgarScore: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        adaptabilityScore: z.number().int().min(0).max(2),
        partnershipScore: z.number().int().min(0).max(2),
        growthScore: z.number().int().min(0).max(2),
        affectionScore: z.number().int().min(0).max(2),
        resolveScore: z.number().int().min(0).max(2),
        totalApgarScore: z.number().int().min(0).max(10),
        functionalityCategory: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-fammed-apgar-1" }
      }

      const existing = await ctx.db.famMedApgarScore.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })

      const data = {
        adaptabilityScore: input.adaptabilityScore,
        partnershipScore: input.partnershipScore,
        growthScore: input.growthScore,
        affectionScore: input.affectionScore,
        resolveScore: input.resolveScore,
        totalApgarScore: input.totalApgarScore,
        functionalityCategory: input.functionalityCategory,
      }

      if (existing) {
        return ctx.db.famMedApgarScore.update({
          where: { id: existing.id },
          data,
        })
      }

      return ctx.db.famMedApgarScore.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          ...data,
        },
      })
    }),

  // ─── 3. CICLO VITAL FAMILIAR (MODELO DUVALL & CRISIS) ───
  getFamilyLifeCycle: protectedProcedure
    .input(z.object({ encounterId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return {
          id: "sandbox-fammed-cycle-1",
          encounterId: "sandbox-demo",
          patientRegistrationId: "sandbox-demo-pat",
          workspaceId: ctx.session.workspaceId ?? "sandbox",
          duvallStage: "Etapa V. Familia con Hijos Adolescentes (Mayor 13-19 años)",
          normativeCrises: "Reorganización de límites y autonomía juvenil",
          nonNormativeCrises: "Migración de familiar cercano / Duelo en pandemia",
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }

      return ctx.db.famMedFamilyLifeCycle.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })
    }),

  saveFamilyLifeCycle: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        duvallStage: z.string(),
        normativeCrises: z.string().optional().nullable(),
        nonNormativeCrises: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-fammed-cycle-1" }
      }

      const existing = await ctx.db.famMedFamilyLifeCycle.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })

      const data = {
        duvallStage: input.duvallStage,
        normativeCrises: input.normativeCrises,
        nonNormativeCrises: input.nonNormativeCrises,
      }

      if (existing) {
        return ctx.db.famMedFamilyLifeCycle.update({
          where: { id: existing.id },
          data,
        })
      }

      return ctx.db.famMedFamilyLifeCycle.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          ...data,
        },
      })
    }),
})
