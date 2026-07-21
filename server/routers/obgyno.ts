import { z } from "zod"
import { router, protectedProcedure } from "../trpc"
import { TRPCError } from "@trpc/server"
import { audit } from "@/lib/audit"

export const obgynoRouter = router({
  // ─── 1. PERFIL GINECO-OBSTÉTRICO (FÓRMULA OBSTÉTRICA & FUR/FPP) ───
  getProfile: protectedProcedure
    .input(z.object({ patientRegistrationId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.patientRegistrationId === "sandbox-demo-pat") {
        return {
          id: "sandbox-ob-prof-1",
          patientRegistrationId: "sandbox-demo-pat",
          workspaceId: ctx.session.workspaceId ?? "sandbox",
          gestas: 2,
          partos: 1,
          abortos: 0,
          cesareas: 0,
          hijosVivos: 1,
          fur: new Date("2026-01-10"),
          fpp: new Date("2026-10-17"),
          grupoSanguineoRh: "O Rh Positivo",
          isRhNegative: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }

      return ctx.db.obGynoProfile.findUnique({
        where: { patientRegistrationId: input.patientRegistrationId },
      })
    }),

  saveProfile: protectedProcedure
    .input(
      z.object({
        patientRegistrationId: z.string(),
        gestas: z.number().int().min(0),
        partos: z.number().int().min(0),
        abortos: z.number().int().min(0),
        cesareas: z.number().int().min(0),
        hijosVivos: z.number().int().min(0),
        fur: z.date().optional().nullable(),
        fpp: z.date().optional().nullable(),
        grupoSanguineoRh: z.string().optional().nullable(),
        isRhNegative: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.patientRegistrationId === "sandbox-demo-pat") {
        return { ok: true, id: "sandbox-ob-prof-1" }
      }

      return ctx.db.obGynoProfile.upsert({
        where: { patientRegistrationId: input.patientRegistrationId },
        update: {
          gestas: input.gestas,
          partos: input.partos,
          abortos: input.abortos,
          cesareas: input.cesareas,
          hijosVivos: input.hijosVivos,
          fur: input.fur,
          fpp: input.fpp,
          grupoSanguineoRh: input.grupoSanguineoRh,
          isRhNegative: input.isRhNegative ?? false,
        },
        create: {
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          gestas: input.gestas,
          partos: input.partos,
          abortos: input.abortos,
          cesareas: input.cesareas,
          hijosVivos: input.hijosVivos,
          fur: input.fur,
          fpp: input.fpp,
          grupoSanguineoRh: input.grupoSanguineoRh,
          isRhNegative: input.isRhNegative ?? false,
        },
      })
    }),

  // ─── 2. FICHA PRENATAL MATRICIAL (CONTROLES SECUENCIALES) ───
  listPrenatalControls: protectedProcedure
    .input(z.object({ patientRegistrationId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.patientRegistrationId === "sandbox-demo-pat") {
        return [
          {
            id: "sandbox-prenatal-1",
            encounterId: "sandbox-enc-1",
            patientRegistrationId: "sandbox-demo-pat",
            workspaceId: ctx.session.workspaceId ?? "sandbox",
            fechaControl: new Date("2026-03-10"),
            edadGestacionalSemanas: 8.4,
            fcfLpm: 155,
            alturaUterinaCm: 8.0,
            presionArterial: "110/70",
            pesoKg: 62.5,
            movimientosFetales: "No percibidos",
            presentacionFetal: "No aplicable",
            proteinuria: "Negativa",
            edema: "Ausente",
            observaciones: "Eco precoz confirma embriocardia +, saco coriónico normoinserto.",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: "sandbox-prenatal-2",
            encounterId: "sandbox-enc-2",
            patientRegistrationId: "sandbox-demo-pat",
            workspaceId: ctx.session.workspaceId ?? "sandbox",
            fechaControl: new Date("2026-05-15"),
            edadGestacionalSemanas: 18.0,
            fcfLpm: 148,
            alturaUterinaCm: 17.0,
            presionArterial: "115/72",
            pesoKg: 65.0,
            movimientosFetales: "Percibidos leves",
            presentacionFetal: "Indiferente",
            proteinuria: "Negativa",
            edema: "Ausente",
            observaciones: "Eco morfológico normal. Placenta fúndica posterior.",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: "sandbox-prenatal-3",
            encounterId: "sandbox-demo",
            patientRegistrationId: "sandbox-demo-pat",
            workspaceId: ctx.session.workspaceId ?? "sandbox",
            fechaControl: new Date("2026-07-21"),
            edadGestacionalSemanas: 27.3,
            fcfLpm: 142,
            alturaUterinaCm: 26.0,
            presionArterial: "118/75",
            pesoKg: 68.2,
            movimientosFetales: "Activos y vigorosos",
            presentacionFetal: "Cefálica",
            proteinuria: "Negativa",
            edema: "Ausente",
            observaciones: "Control mensual de III trimestre normal. Ecografía Doppler umbilical normal.",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]
      }

      return ctx.db.obPrenatalControl.findMany({
        where: { patientRegistrationId: input.patientRegistrationId, workspaceId: ctx.session.workspaceId },
        orderBy: { fechaControl: "asc" },
      })
    }),

  addPrenatalControl: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        edadGestacionalSemanas: z.number().positive(),
        fcfLpm: z.number().int().optional().nullable(),
        alturaUterinaCm: z.number().optional().nullable(),
        presionArterial: z.string().optional().nullable(),
        pesoKg: z.number().optional().nullable(),
        movimientosFetales: z.string().optional().nullable(),
        presentacionFetal: z.string().optional().nullable(),
        proteinuria: z.string().optional().nullable(),
        edema: z.string().optional().nullable(),
        observaciones: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-prenatal-3" }
      }

      return ctx.db.obPrenatalControl.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          edadGestacionalSemanas: input.edadGestacionalSemanas,
          fcfLpm: input.fcfLpm,
          alturaUterinaCm: input.alturaUterinaCm,
          presionArterial: input.presionArterial,
          pesoKg: input.pesoKg,
          movimientosFetales: input.movimientosFetales,
          presentacionFetal: input.presentacionFetal,
          proteinuria: input.proteinuria,
          edema: input.edema,
          observaciones: input.observaciones,
        },
      })
    }),

  // ─── 3. CRIBADO GINECOLÓGICO (BETHESDA & BI-RADS) ───
  getGynoScreening: protectedProcedure
    .input(z.object({ encounterId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return {
          id: "sandbox-screen-1",
          encounterId: "sandbox-demo",
          patientRegistrationId: "sandbox-demo-pat",
          workspaceId: ctx.session.workspaceId ?? "sandbox",
          citologiaBethesda: "NILM (Negativo para Lesión Intraepitelial o Malignidad)",
          citologiaFecha: new Date("2026-02-10"),
          mamografiaBirads: "BI-RADS 1 (Normal / Hallazgos Simétricos)",
          mamografiaFecha: new Date("2025-11-05"),
          ecoPelvicoHallazgos: "Útero en AVF de contornos regulares. Ambos ovarios morfológicamente normales.",
          observaciones: "Tamizaje gineco-oncológico al día.",
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }

      return ctx.db.gynoScreening.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })
    }),

  saveGynoScreening: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        citologiaBethesda: z.string().optional().nullable(),
        citologiaFecha: z.date().optional().nullable(),
        mamografiaBirads: z.string().optional().nullable(),
        mamografiaFecha: z.date().optional().nullable(),
        ecoPelvicoHallazgos: z.string().optional().nullable(),
        observaciones: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-screen-1" }
      }

      const existing = await ctx.db.gynoScreening.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })

      const data = {
        citologiaBethesda: input.citologiaBethesda,
        citologiaFecha: input.citologiaFecha,
        mamografiaBirads: input.mamografiaBirads,
        mamografiaFecha: input.mamografiaFecha,
        ecoPelvicoHallazgos: input.ecoPelvicoHallazgos,
        observaciones: input.observaciones,
      }

      if (existing) {
        return ctx.db.gynoScreening.update({
          where: { id: existing.id },
          data,
        })
      }

      return ctx.db.gynoScreening.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          ...data,
        },
      })
    }),

  // ─── 4. CALCULADORA OBSTÉTRICA (REGLA DE NAEGELE & EG) ───
  calculateGestationalAge: protectedProcedure
    .input(z.object({ fur: z.date() }))
    .query(({ input }) => {
      const furDate = new Date(input.fur)
      const now = new Date()

      // Regla de Naegele: FUR + 7 días - 3 meses + 1 año
      const fppDate = new Date(furDate)
      fppDate.setDate(fppDate.getDate() + 7)
      fppDate.setMonth(fppDate.getMonth() - 3)
      fppDate.setFullYear(fppDate.getFullYear() + 1)

      const diffTime = Math.abs(now.getTime() - furDate.getTime())
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      const semanas = Math.floor(diffDays / 7)
      const dias = diffDays % 7

      return {
        fpp: fppDate.toISOString().split("T")[0],
        semanas,
        dias,
        egFormatted: `${semanas}.${dias} semanas`,
      }
    }),
})
