import { z } from "zod"
import { router, protectedProcedure } from "../trpc"
import { TRPCError } from "@trpc/server"
import { audit } from "@/lib/audit"

export const endoRouter = router({
  // ─── 1. HISTORIAL GLUCÉMICO & HBA1C ───
  listGlycemicLogs: protectedProcedure
    .input(z.object({ patientRegistrationId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.patientRegistrationId === "sandbox-demo-pat") {
        return [
          {
            id: "sandbox-gly-1",
            encounterId: "sandbox-enc-1",
            patientRegistrationId: "sandbox-demo-pat",
            workspaceId: ctx.session.workspaceId ?? "sandbox",
            hba1cPorcentaje: 8.4,
            hba1cFecha: new Date("2025-11-10"),
            glucemiaAyunasMgDl: 165,
            glucemiaPostprandialMgDl: 210,
            promedioCapilarMgDl: 185,
            observaciones: "Mal control glucémico pre-tratamiento.",
            createdAt: new Date("2025-11-10"),
            updatedAt: new Date("2025-11-10"),
          },
          {
            id: "sandbox-gly-2",
            encounterId: "sandbox-enc-2",
            patientRegistrationId: "sandbox-demo-pat",
            workspaceId: ctx.session.workspaceId ?? "sandbox",
            hba1cPorcentaje: 7.3,
            hba1cFecha: new Date("2026-03-15"),
            glucemiaAyunasMgDl: 125,
            glucemiaPostprandialMgDl: 160,
            promedioCapilarMgDl: 140,
            observaciones: "Mejoría franca tras titulación de insulina basal.",
            createdAt: new Date("2026-03-15"),
            updatedAt: new Date("2026-03-15"),
          },
          {
            id: "sandbox-gly-3",
            encounterId: "sandbox-demo",
            patientRegistrationId: "sandbox-demo-pat",
            workspaceId: ctx.session.workspaceId ?? "sandbox",
            hba1cPorcentaje: 6.8,
            hba1cFecha: new Date("2026-07-21"),
            glucemiaAyunasMgDl: 108,
            glucemiaPostprandialMgDl: 138,
            promedioCapilarMgDl: 120,
            observaciones: "Meta glucémica alcanzada (HbA1c < 7.0%).",
            createdAt: new Date("2026-07-21"),
            updatedAt: new Date("2026-07-21"),
          },
        ]
      }

      return ctx.db.endoGlycemicLog.findMany({
        where: { patientRegistrationId: input.patientRegistrationId, workspaceId: ctx.session.workspaceId },
        orderBy: { createdAt: "asc" },
      })
    }),

  saveGlycemicLog: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        hba1cPorcentaje: z.number().positive().optional().nullable(),
        hba1cFecha: z.date().optional().nullable(),
        glucemiaAyunasMgDl: z.number().int().positive().optional().nullable(),
        glucemiaPostprandialMgDl: z.number().int().positive().optional().nullable(),
        promedioCapilarMgDl: z.number().int().positive().optional().nullable(),
        observaciones: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-gly-3" }
      }

      return ctx.db.endoGlycemicLog.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          hba1cPorcentaje: input.hba1cPorcentaje,
          hba1cFecha: input.hba1cFecha,
          glucemiaAyunasMgDl: input.glucemiaAyunasMgDl,
          glucemiaPostprandialMgDl: input.glucemiaPostprandialMgDl,
          promedioCapilarMgDl: input.promedioCapilarMgDl,
          observaciones: input.observaciones,
        },
      })
    }),

  // ─── 2. CALCULADORA Y TITULACIÓN DE INSULINA BASAL-BOLUS ───
  getInsulinTitration: protectedProcedure
    .input(z.object({ encounterId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return {
          id: "sandbox-ins-1",
          encounterId: "sandbox-demo",
          patientRegistrationId: "sandbox-demo-pat",
          workspaceId: ctx.session.workspaceId ?? "sandbox",
          pesoKg: 70.0,
          dosisTotalDiariaU: 28.0, // 0.4 UI/kg
          dosisBasalU: 14.0, // 50% Glargina
          dosisBolusDesayunoU: 5.0,
          dosisBolusAlmuerzoU: 5.0,
          dosisBolusCenaU: 4.0,
          ratioCarbohidratos: 15, // 1 UI por 15g de HC
          factorSensibilidad: 50, // 1 UI reduce 50 mg/dL
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }

      return ctx.db.endoInsulinTitration.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })
    }),

  calculateAndSaveInsulin: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        pesoKg: z.number().positive(),
        uPerKg: z.number().positive().default(0.4), // 0.3 a 0.6 UI/kg/día
        ratioCarbohidratos: z.number().int().optional().nullable(),
        factorSensibilidad: z.number().int().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const dtd = Number((input.pesoKg * input.uPerKg).toFixed(1))
      const basal = Number((dtd * 0.5).toFixed(1))
      const bolusTotal = dtd * 0.5
      const bolusCadaComida = Number((bolusTotal / 3).toFixed(1))

      if (input.encounterId === "sandbox-demo") {
        return {
          ok: true,
          dtd,
          basal,
          bolusCadaComida,
        }
      }

      const existing = await ctx.db.endoInsulinTitration.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })

      const data = {
        pesoKg: input.pesoKg,
        dosisTotalDiariaU: dtd,
        dosisBasalU: basal,
        dosisBolusDesayunoU: bolusCadaComida,
        dosisBolusAlmuerzoU: bolusCadaComida,
        dosisBolusCenaU: bolusCadaComida,
        ratioCarbohidratos: input.ratioCarbohidratos,
        factorSensibilidad: input.factorSensibilidad,
      }

      if (existing) {
        return ctx.db.endoInsulinTitration.update({
          where: { id: existing.id },
          data,
        })
      }

      return ctx.db.endoInsulinTitration.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          ...data,
        },
      })
    }),

  // ─── 3. TIROIDES: NÓDULOS TI-RADS & BETHESDA ───
  listThyroidNodules: protectedProcedure
    .input(z.object({ patientRegistrationId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.patientRegistrationId === "sandbox-demo-pat") {
        return [
          {
            id: "sandbox-nodule-1",
            encounterId: "sandbox-demo",
            patientRegistrationId: "sandbox-demo-pat",
            workspaceId: ctx.session.workspaceId ?? "sandbox",
            localizacion: "Lóbulo Derecho (Tercio Medio)",
            diametroMayorMm: 14.5,
            composicion: "Sólido",
            ecogenicidad: "Hipoecoico",
            margenes: "Lisos",
            focosEcogenicos: "Punteados ecogénicos (Microcalcificaciones)",
            tiRadsCategory: "TI-RADS 4 (Moderadamente Sospechoso)",
            bafnBethesdaCategory: "Bethesda II (Benigno - BAFN indicación por tamaño)",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]
      }

      return ctx.db.endoThyroidNodule.findMany({
        where: { patientRegistrationId: input.patientRegistrationId, workspaceId: ctx.session.workspaceId },
      })
    }),

  saveThyroidNodule: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        localizacion: z.string(),
        diametroMayorMm: z.number().positive(),
        composicion: z.string(),
        ecogenicidad: z.string(),
        margenes: z.string(),
        focosEcogenicos: z.string(),
        tiRadsCategory: z.string(),
        bafnBethesdaCategory: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-nodule-1" }
      }

      return ctx.db.endoThyroidNodule.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          localizacion: input.localizacion,
          diametroMayorMm: input.diametroMayorMm,
          composicion: input.composicion,
          ecogenicidad: input.ecogenicidad,
          margenes: input.margenes,
          focosEcogenicos: input.focosEcogenicos,
          tiRadsCategory: input.tiRadsCategory,
          bafnBethesdaCategory: input.bafnBethesdaCategory,
        },
      })
    }),
})
