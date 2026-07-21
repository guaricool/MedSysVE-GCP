import { z } from "zod"
import { router, protectedProcedure } from "../trpc"
import { TRPCError } from "@trpc/server"
import { audit } from "@/lib/audit"

export const pediaRouter = router({
  // ─── 1. CURVAS DE CRECIMIENTO OMS / CDC ───
  listGrowthPoints: protectedProcedure
    .input(z.object({ patientRegistrationId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.patientRegistrationId === "sandbox-demo-pat") {
        return [
          {
            id: "sandbox-growth-1",
            encounterId: "sandbox-demo-1",
            patientRegistrationId: "sandbox-demo-pat",
            workspaceId: ctx.session.workspaceId ?? "sandbox",
            edadMeses: 2,
            pesoKg: 5.2,
            tallaCm: 57.0,
            perimetroCefalicoCm: 39.0,
            imc: 16.0,
            percentilPeso: "P50",
            percentilTalla: "P50",
            percentilPC: "P50",
            zScorePesoEdad: 0.0,
            zScoreTallaEdad: 0.0,
            createdAt: new Date("2025-09-15"),
            updatedAt: new Date("2025-09-15"),
          },
          {
            id: "sandbox-growth-2",
            encounterId: "sandbox-demo-2",
            patientRegistrationId: "sandbox-demo-pat",
            workspaceId: ctx.session.workspaceId ?? "sandbox",
            edadMeses: 6,
            pesoKg: 7.8,
            tallaCm: 66.5,
            perimetroCefalicoCm: 43.0,
            imc: 17.6,
            percentilPeso: "P65",
            percentilTalla: "P50",
            percentilPC: "P50",
            zScorePesoEdad: 0.4,
            zScoreTallaEdad: 0.0,
            createdAt: new Date("2026-01-15"),
            updatedAt: new Date("2026-01-15"),
          },
          {
            id: "sandbox-growth-3",
            encounterId: "sandbox-demo",
            patientRegistrationId: "sandbox-demo-pat",
            workspaceId: ctx.session.workspaceId ?? "sandbox",
            edadMeses: 12,
            pesoKg: 10.2,
            tallaCm: 75.0,
            perimetroCefalicoCm: 46.0,
            imc: 18.1,
            percentilPeso: "P75",
            percentilTalla: "P60",
            percentilPC: "P50",
            zScorePesoEdad: 0.6,
            zScoreTallaEdad: 0.2,
            createdAt: new Date("2026-07-21"),
            updatedAt: new Date("2026-07-21"),
          },
        ]
      }

      return ctx.db.pediaGrowthPoint.findMany({
        where: { patientRegistrationId: input.patientRegistrationId, workspaceId: ctx.session.workspaceId },
        orderBy: { edadMeses: "asc" },
      })
    }),

  saveGrowthPoint: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        edadMeses: z.number().int().min(0).max(216),
        pesoKg: z.number().positive(),
        tallaCm: z.number().positive(),
        perimetroCefalicoCm: z.number().optional().nullable(),
        imc: z.number().optional().nullable(),
        percentilPeso: z.string().optional().nullable(),
        percentilTalla: z.string().optional().nullable(),
        percentilPC: z.string().optional().nullable(),
        zScorePesoEdad: z.number().optional().nullable(),
        zScoreTallaEdad: z.number().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-growth-3" }
      }

      return ctx.db.pediaGrowthPoint.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          edadMeses: input.edadMeses,
          pesoKg: input.pesoKg,
          tallaCm: input.tallaCm,
          perimetroCefalicoCm: input.perimetroCefalicoCm,
          imc: input.imc,
          percentilPeso: input.percentilPeso,
          percentilTalla: input.percentilTalla,
          percentilPC: input.percentilPC,
          zScorePesoEdad: input.zScorePesoEdad,
          zScoreTallaEdad: input.zScoreTallaEdad,
        },
      })
    }),

  // ─── 2. HITOS DEL DESARROLLO (SEMÁFORO) ───
  getMilestones: protectedProcedure
    .input(z.object({ encounterId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return {
          id: "sandbox-mstone-1",
          encounterId: "sandbox-demo",
          patientRegistrationId: "sandbox-demo-pat",
          workspaceId: ctx.session.workspaceId ?? "sandbox",
          edadRango: "12 meses",
          motorGruesoStatus: "VERDE",
          motorGruesoDetalle: "Se pone de pie solo y da pasos sujetado de muebles.",
          motorFinoStatus: "VERDE",
          motorFinoDetalle: "Pinza fina completa (índice-pulgar) para objetos pequeños.",
          lenguajeStatus: "VERDE",
          lenguajeDetalle: "Dice 3 palabras con significado (mamá, papá, agua).",
          socialStatus: "VERDE",
          socialDetalle: "Imita gestos, juega a 'esconderse' y señala lo que desea.",
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }

      return ctx.db.pediaDevelopmentMilestone.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })
    }),

  saveMilestones: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        edadRango: z.string(),
        motorGruesoStatus: z.enum(["VERDE", "AMARILLO", "ROJO"]),
        motorGruesoDetalle: z.string().optional().nullable(),
        motorFinoStatus: z.enum(["VERDE", "AMARILLO", "ROJO"]),
        motorFinoDetalle: z.string().optional().nullable(),
        lenguajeStatus: z.enum(["VERDE", "AMARILLO", "ROJO"]),
        lenguajeDetalle: z.string().optional().nullable(),
        socialStatus: z.enum(["VERDE", "AMARILLO", "ROJO"]),
        socialDetalle: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-mstone-1" }
      }

      const existing = await ctx.db.pediaDevelopmentMilestone.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })

      const data = {
        edadRango: input.edadRango,
        motorGruesoStatus: input.motorGruesoStatus,
        motorGruesoDetalle: input.motorGruesoDetalle,
        motorFinoStatus: input.motorFinoStatus,
        motorFinoDetalle: input.motorFinoDetalle,
        lenguajeStatus: input.lenguajeStatus,
        lenguajeDetalle: input.lenguajeDetalle,
        socialStatus: input.socialStatus,
        socialDetalle: input.socialDetalle,
      }

      if (existing) {
        return ctx.db.pediaDevelopmentMilestone.update({
          where: { id: existing.id },
          data,
        })
      }

      return ctx.db.pediaDevelopmentMilestone.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          ...data,
        },
      })
    }),

  // ─── 3. CALCULADORA DE DOSIS PONDERAL ───
  calculateDose: protectedProcedure
    .input(
      z.object({
        pesoKg: z.number().positive(),
        dosisMgKgDia: z.number().positive(),
        concentracionMg: z.number().positive(),
        concentracionMl: z.number().positive(),
        frecuenciaHoras: z.number().int().positive(),
      }),
    )
    .query(({ input }) => {
      const dosisTotalDiaMg = input.pesoKg * input.dosisMgKgDia
      const tomasPorDia = 24 / input.frecuenciaHoras
      const dosisPorTomaMg = dosisTotalDiaMg / tomasPorDia
      const dosisPorTomaMl = Number(((dosisPorTomaMg * input.concentracionMl) / input.concentracionMg).toFixed(2))

      return {
        dosisTotalDiaMg: Number(dosisTotalDiaMg.toFixed(1)),
        dosisPorTomaMg: Number(dosisPorTomaMg.toFixed(1)),
        dosisPorTomaMl,
        tomasPorDia,
      }
    }),
})
