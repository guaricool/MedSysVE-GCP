import { z } from "zod"
import { router, protectedProcedure } from "../trpc"
import { TRPCError } from "@trpc/server"
import { audit } from "@/lib/audit"

export const orlRouter = router({
  // ─── 1. AUDIOMETRÍA & TIMPANOMETRÍA ───
  getAudiometry: protectedProcedure
    .input(z.object({ encounterId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return {
          id: "sandbox-demo-audio",
          encounterId: "sandbox-demo",
          patientRegistrationId: "sandbox-demo-pat",
          workspaceId: ctx.session.workspaceId ?? "sandbox",
          airOd: { "125": 10, "250": 15, "500": 20, "1000": 20, "2000": 25, "4000": 30, "8000": 35 },
          airOi: { "125": 15, "250": 20, "500": 25, "1000": 30, "2000": 35, "4000": 45, "8000": 50 },
          boneOd: { "250": 10, "500": 15, "1000": 15, "2000": 20, "4000": 25 },
          boneOi: { "250": 15, "500": 20, "1000": 25, "2000": 30, "4000": 40 },
          logoaudioOd: 95,
          logoaudioOi: 85,
          srtcOd: 20,
          srtcOi: 30,
          tympanogramOd: "Tipo A (Normal)",
          tympanogramOi: "Tipo C (Disfunción Tubárica)",
          observaciones: "Hipoacusia leve de predominio conductivo en oído izquierdo.",
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }

      const record = await ctx.db.orlAudiometry.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })
      return record ?? null
    }),

  saveAudiometry: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        airOd: z.any().optional(),
        airOi: z.any().optional(),
        boneOd: z.any().optional(),
        boneOi: z.any().optional(),
        logoaudioOd: z.number().int().min(0).max(100).optional().nullable(),
        logoaudioOi: z.number().int().min(0).max(100).optional().nullable(),
        srtcOd: z.number().int().optional().nullable(),
        srtcOi: z.number().int().optional().nullable(),
        tympanogramOd: z.string().optional().nullable(),
        tympanogramOi: z.string().optional().nullable(),
        observaciones: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-demo-audio" }
      }

      const existing = await ctx.db.orlAudiometry.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })

      const data = {
        airOd: input.airOd ?? {},
        airOi: input.airOi ?? {},
        boneOd: input.boneOd ?? {},
        boneOi: input.boneOi ?? {},
        logoaudioOd: input.logoaudioOd,
        logoaudioOi: input.logoaudioOi,
        srtcOd: input.srtcOd,
        srtcOi: input.srtcOi,
        tympanogramOd: input.tympanogramOd,
        tympanogramOi: input.tympanogramOi,
        observaciones: input.observaciones,
      }

      if (existing) {
        return ctx.db.orlAudiometry.update({
          where: { id: existing.id },
          data,
        })
      }

      const created = await ctx.db.orlAudiometry.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          ...data,
        },
      })

      void audit("UPDATE_ENCOUNTER", {
        userId: ctx.session.id,
        userRole: ctx.session.role,
        workspaceId: ctx.session.workspaceId,
        resourceType: "OrlAudiometry",
        resourceId: created.id,
        patientId: input.patientRegistrationId,
      })

      return created
    }),

  // ─── 2. INFORME ENDOSCÓPICO CON CAPTURA DE IMÁGENES ───
  getEndoscopyReport: protectedProcedure
    .input(z.object({ encounterId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return {
          id: "sandbox-demo-endo",
          encounterId: "sandbox-demo",
          patientRegistrationId: "sandbox-demo-pat",
          workspaceId: ctx.session.workspaceId ?? "sandbox",
          tipoProcedimiento: "Nasofibrolaringoscopia Flexible",
          hallazgosFosasNasales: "Tabique centrado, cornetes inferiores hipertróficos grado II con mucosa pálida.",
          hallazgosRinofaringe: "Rodetes tubarios permeables, fosa de Rosenmüller libre de lesiones.",
          hallazgosLaringe: "Epiglotis en omega, aritenoides sin edema.",
          hallazgosCuerdasVocales: "Movilidad bilateral conservada. Nódulo pequeño en tercio anterior de cuerda vocal derecha.",
          imagenesUrl: [],
          conclusion: "Discreta disfonía funcional por nódulo vocal temprano en cuerda vocal derecha.",
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }

      return ctx.db.orlEndoscopyReport.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })
    }),

  saveEndoscopyReport: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        tipoProcedimiento: z.string(),
        hallazgosFosasNasales: z.string().optional().nullable(),
        hallazgosRinofaringe: z.string().optional().nullable(),
        hallazgosLaringe: z.string().optional().nullable(),
        hallazgosCuerdasVocales: z.string().optional().nullable(),
        imagenesUrl: z.array(z.string()).optional(),
        conclusion: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-demo-endo" }
      }

      const existing = await ctx.db.orlEndoscopyReport.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })

      const data = {
        tipoProcedimiento: input.tipoProcedimiento,
        hallazgosFosasNasales: input.hallazgosFosasNasales,
        hallazgosRinofaringe: input.hallazgosRinofaringe,
        hallazgosLaringe: input.hallazgosLaringe,
        hallazgosCuerdasVocales: input.hallazgosCuerdasVocales,
        imagenesUrl: input.imagenesUrl ?? [],
        conclusion: input.conclusion,
      }

      if (existing) {
        return ctx.db.orlEndoscopyReport.update({
          where: { id: existing.id },
          data,
        })
      }

      return ctx.db.orlEndoscopyReport.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          ...data,
        },
      })
    }),

  // ─── 3. DIAGRAMA TRILOCALIZADO (PINS) ───
  listDiagramPins: protectedProcedure
    .input(z.object({ encounterId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return [
          {
            id: "sandbox-pin-1",
            encounterId: "sandbox-demo",
            region: "OIDO_IZQUIERDO",
            xPct: 75.5,
            yPct: 32.0,
            titulo: "Perforación Membrana Timpánica",
            hallazgo: "Perforación timpánica central pequeña subtotal.",
            gravedad: "MODERADO",
            createdAt: new Date(),
          },
          {
            id: "sandbox-pin-2",
            encounterId: "sandbox-demo",
            region: "NARIZ_CORNETES",
            xPct: 48.0,
            yPct: 55.0,
            titulo: "Hipertrofia de Cornetes",
            hallazgo: "Cornete inferior izquierdo obstructivo.",
            gravedad: "LEVE",
            createdAt: new Date(),
          },
        ]
      }

      return ctx.db.orlDiagramPin.findMany({
        where: { encounterId: input.encounterId },
        orderBy: { createdAt: "asc" },
      })
    }),

  addDiagramPin: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        region: z.string(),
        xPct: z.number(),
        yPct: z.number(),
        titulo: z.string(),
        hallazgo: z.string(),
        gravedad: z.enum(["NORMAL", "LEVE", "MODERADO", "SEVERO"]).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return {
          id: `sandbox-pin-${Date.now()}`,
          ...input,
          gravedad: input.gravedad ?? "LEVE",
          createdAt: new Date(),
        }
      }

      return ctx.db.orlDiagramPin.create({
        data: {
          encounterId: input.encounterId,
          region: input.region,
          xPct: input.xPct,
          yPct: input.yPct,
          titulo: input.titulo,
          hallazgo: input.hallazgo,
          gravedad: input.gravedad ?? "LEVE",
        },
      })
    }),

  deleteDiagramPin: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (input.id.startsWith("sandbox-pin-")) {
        return { ok: true }
      }

      await ctx.db.orlDiagramPin.delete({
        where: { id: input.id },
      })
      return { ok: true }
    }),
})
