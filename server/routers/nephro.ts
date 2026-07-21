import { z } from "zod"
import { router, protectedProcedure } from "../trpc"
import { TRPCError } from "@trpc/server"
import { audit } from "@/lib/audit"

export const nephroRouter = router({
  // ─── 1. CALCULADORA DE FILTRADO GLOMERULAR CKD-EPI (2021) ───
  getEgfrCalculator: protectedProcedure
    .input(z.object({ encounterId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return {
          id: "sandbox-nephro-egfr-1",
          encounterId: "sandbox-demo",
          patientRegistrationId: "sandbox-demo-pat",
          workspaceId: ctx.session.workspaceId ?? "sandbox",
          creatininaSerica: 2.4,
          edadAnos: 62,
          sexo: "M",
          ckdEpi2021Result: 28.4,
          estadioCkd: "Estadio G4: Severamente Disminuido (TFG 15-29 mL/min/1.73m²)",
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }

      return ctx.db.nephroEgfrCalculator.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })
    }),

  saveEgfrCalculator: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        creatininaSerica: z.number().positive(),
        edadAnos: z.number().int().positive(),
        sexo: z.enum(["M", "F"]),
        ckdEpi2021Result: z.number().positive(),
        estadioCkd: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-nephro-egfr-1" }
      }

      const existing = await ctx.db.nephroEgfrCalculator.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })

      const data = {
        creatininaSerica: input.creatininaSerica,
        edadAnos: input.edadAnos,
        sexo: input.sexo,
        ckdEpi2021Result: input.ckdEpi2021Result,
        estadioCkd: input.estadioCkd,
      }

      if (existing) {
        return ctx.db.nephroEgfrCalculator.update({
          where: { id: existing.id },
          data,
        })
      }

      return ctx.db.nephroEgfrCalculator.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          ...data,
        },
      })
    }),

  // ─── 2. SESIÓN DE HEMODIÁLISIS & PESO SECO ───
  getDialysisSession: protectedProcedure
    .input(z.object({ encounterId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return {
          id: "sandbox-nephro-dial-1",
          encounterId: "sandbox-demo",
          patientRegistrationId: "sandbox-demo-pat",
          workspaceId: ctx.session.workspaceId ?? "sandbox",
          pesoPreDialisisKg: 74.5,
          pesoPostDialisisKg: 71.8,
          pesoSecoObjetivoKg: 71.5,
          ultrafiltracionUfLiters: 2.7,
          flujoSangreQbMlMin: 350,
          flujoDializadoQdMlMin: 500,
          filtroDializador: "Fresenius FX80 High-Flux",
          anticoagulacionHeparina: "Heparina Sódica en bolo 2,500 UI + Mantenimiento 1,000 UI/h",
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }

      return ctx.db.nephroDialysisSession.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })
    }),

  saveDialysisSession: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        pesoPreDialisisKg: z.number().positive(),
        pesoPostDialisisKg: z.number().positive(),
        pesoSecoObjetivoKg: z.number().positive(),
        ultrafiltracionUfLiters: z.number().positive(),
        flujoSangreQbMlMin: z.number().int().positive(),
        flujoDializadoQdMlMin: z.number().int().positive(),
        filtroDializador: z.string().optional().nullable(),
        anticoagulacionHeparina: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-nephro-dial-1" }
      }

      const existing = await ctx.db.nephroDialysisSession.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })

      const data = {
        pesoPreDialisisKg: input.pesoPreDialisisKg,
        pesoPostDialisisKg: input.pesoPostDialisisKg,
        pesoSecoObjetivoKg: input.pesoSecoObjetivoKg,
        ultrafiltracionUfLiters: input.ultrafiltracionUfLiters,
        flujoSangreQbMlMin: input.flujoSangreQbMlMin,
        flujoDializadoQdMlMin: input.flujoDializadoQdMlMin,
        filtroDializador: input.filtroDializador,
        anticoagulacionHeparina: input.anticoagulacionHeparina,
      }

      if (existing) {
        return ctx.db.nephroDialysisSession.update({
          where: { id: existing.id },
          data,
        })
      }

      return ctx.db.nephroDialysisSession.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          ...data,
        },
      })
    }),

  // ─── 3. MAPA DE ACCESOS VASCULARES ───
  listVascularAccesses: protectedProcedure
    .input(z.object({ patientRegistrationId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.patientRegistrationId === "sandbox-demo-pat") {
        return [
          {
            id: "sandbox-nephro-acc-1",
            encounterId: "sandbox-demo",
            patientRegistrationId: "sandbox-demo-pat",
            workspaceId: ctx.session.workspaceId ?? "sandbox",
            tipoAcceso: "FAV Autóloga (Radiocefálica)",
            localizacionAnatomica: "Antebrazo Izquierdo (Brazo no dominante)",
            fechaImplantacion: new Date("2024-03-15"),
            estadoAcceso: "Normofuncionante (Buen Soplo y Trill palpable)",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]
      }

      return ctx.db.nephroVascularAccess.findMany({
        where: { patientRegistrationId: input.patientRegistrationId, workspaceId: ctx.session.workspaceId },
        orderBy: { createdAt: "desc" },
      })
    }),

  saveVascularAccess: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        tipoAcceso: z.string(),
        localizacionAnatomica: z.string(),
        fechaImplantacion: z.date().optional().nullable(),
        estadoAcceso: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-nephro-acc-1" }
      }

      return ctx.db.nephroVascularAccess.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          tipoAcceso: input.tipoAcceso,
          localizacionAnatomica: input.localizacionAnatomica,
          fechaImplantacion: input.fechaImplantacion,
          estadoAcceso: input.estadoAcceso,
        },
      })
    }),
})
