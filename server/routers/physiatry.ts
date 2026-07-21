import { z } from "zod"
import { router, protectedProcedure } from "../trpc"
import { TRPCError } from "@trpc/server"
import { audit } from "@/lib/audit"

export const physiatryRouter = router({
  // ─── 1. ESCALA DE DANIELS (MMT) & GONIOMETRÍA ARTICULAR (ROM) ───
  listMuscleGonio: protectedProcedure
    .input(z.object({ encounterId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return [
          {
            id: "sandbox-phys-muscle-1",
            encounterId: "sandbox-demo",
            patientRegistrationId: "sandbox-demo-pat",
            workspaceId: ctx.session.workspaceId ?? "sandbox",
            muscleGroup: "Cuádriceps Femoral Izquierdo",
            danielsScore: 3,
            flexionRomDegrees: 110.0,
            extensionRomDegrees: 0.0,
            rotationRomDegrees: 0.0,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: "sandbox-phys-muscle-2",
            encounterId: "sandbox-demo",
            patientRegistrationId: "sandbox-demo-pat",
            workspaceId: ctx.session.workspaceId ?? "sandbox",
            muscleGroup: "Deltoides Medio Derecho",
            danielsScore: 4,
            flexionRomDegrees: 160.0,
            extensionRomDegrees: 45.0,
            rotationRomDegrees: 70.0,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]
      }

      return ctx.db.physiatryMuscleGonio.findMany({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
        orderBy: { createdAt: "asc" },
      })
    }),

  saveMuscleGonio: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        muscleGroup: z.string(),
        danielsScore: z.number().int().min(0).max(5),
        flexionRomDegrees: z.number().min(0).max(180).optional().nullable(),
        extensionRomDegrees: z.number().min(0).max(180).optional().nullable(),
        rotationRomDegrees: z.number().min(0).max(180).optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-phys-muscle-1" }
      }

      return ctx.db.physiatryMuscleGonio.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          muscleGroup: input.muscleGroup,
          danielsScore: input.danielsScore,
          flexionRomDegrees: input.flexionRomDegrees,
          extensionRomDegrees: input.extensionRomDegrees,
          rotationRomDegrees: input.rotationRomDegrees,
        },
      })
    }),

  // ─── 2. EVALUACIÓN DE ESPASTICIDAD (ASHWORTH MODIFICADA) ───
  getAshworthScale: protectedProcedure
    .input(z.object({ encounterId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return {
          id: "sandbox-phys-ash-1",
          encounterId: "sandbox-demo",
          patientRegistrationId: "sandbox-demo-pat",
          workspaceId: ctx.session.workspaceId ?? "sandbox",
          bodySegment: "Miembro Inferior Izquierdo (Patrón Hemiparético post-ACV)",
          ashworthScore: "2 (Aumento pronunciado del tono en la mayor parte del arco articular)",
          clonusPresent: true,
          posturalPattern: "Patrón flexor en miembro superior / extensor en miembro inferior",
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }

      return ctx.db.physiatryAshworthScale.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })
    }),

  saveAshworthScale: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        bodySegment: z.string(),
        ashworthScore: z.string(),
        clonusPresent: z.boolean(),
        posturalPattern: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-phys-ash-1" }
      }

      const existing = await ctx.db.physiatryAshworthScale.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })

      const data = {
        bodySegment: input.bodySegment,
        ashworthScore: input.ashworthScore,
        clonusPresent: input.clonusPresent,
        posturalPattern: input.posturalPattern,
      }

      if (existing) {
        return ctx.db.physiatryAshworthScale.update({
          where: { id: existing.id },
          data,
        })
      }

      return ctx.db.physiatryAshworthScale.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          ...data,
        },
      })
    }),

  // ─── 3. PLAN DE PRESCRIPCIÓN FISIOTERAPÉUTICA & ELECTROTERAPIA ───
  getPrescriptionPlan: protectedProcedure
    .input(z.object({ encounterId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return {
          id: "sandbox-phys-plan-1",
          encounterId: "sandbox-demo",
          patientRegistrationId: "sandbox-demo-pat",
          workspaceId: ctx.session.workspaceId ?? "sandbox",
          modalitiesJson: JSON.stringify([
            "TENS Analgésico 100Hz / 20 min en rodilla izquierda",
            "Ultrasonido Terapéutico 1MHz Pulsado 1.5 W/cm2 / 8 min",
            "Cinesiterapia Pasiva & Estiramientos Miotendinosos",
            "Reeducación Neuromuscular de la Marcha en Barras Paralelas",
          ]),
          sessionDurationMin: 45,
          sessionsPerWeek: 3,
          totalWeeks: 6,
          physiotherapyGoals: "Ganancia de fuerza muscular (Daniels 3 -> 4), modulación del dolor miotendinoso e independencia en la marcha autónoma",
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }

      return ctx.db.physiatryPrescriptionPlan.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })
    }),

  savePrescriptionPlan: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        modalitiesJson: z.string().optional().nullable(),
        sessionDurationMin: z.number().int().positive(),
        sessionsPerWeek: z.number().int().min(1).max(7),
        totalWeeks: z.number().int().positive(),
        physiotherapyGoals: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-phys-plan-1" }
      }

      const existing = await ctx.db.physiatryPrescriptionPlan.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })

      const data = {
        modalitiesJson: input.modalitiesJson,
        sessionDurationMin: input.sessionDurationMin,
        sessionsPerWeek: input.sessionsPerWeek,
        totalWeeks: input.totalWeeks,
        physiotherapyGoals: input.physiotherapyGoals,
      }

      if (existing) {
        return ctx.db.physiatryPrescriptionPlan.update({
          where: { id: existing.id },
          data,
        })
      }

      return ctx.db.physiatryPrescriptionPlan.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          ...data,
        },
      })
    }),
})
