import { z } from "zod"
import { router, protectedProcedure } from "../trpc"
import { TRPCError } from "@trpc/server"
import { audit } from "@/lib/audit"

export const ophthoRouter = router({
  // ─── 1. REFRACCIÓN ULTRA-RÁPIDA & AGUDEZA VISUAL OD/OI ───
  getRefraction: protectedProcedure
    .input(z.object({ encounterId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return {
          id: "sandbox-ophtho-ref-1",
          encounterId: "sandbox-demo",
          patientRegistrationId: "sandbox-demo-pat",
          workspaceId: ctx.session.workspaceId ?? "sandbox",
          avOdSinCorrecion: "20/40",
          avOiSinCorrecion: "20/60",
          esferaOd: -1.75,
          cilindroOd: -0.5,
          ejeOd: 175,
          adicionOd: 1.5,
          avOdConCorreccion: "20/20",
          esferaOi: -2.25,
          cilindroOi: -0.75,
          ejeOi: 10,
          adicionOi: 1.5,
          avOiConCorreccion: "20/20",
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }

      return ctx.db.ophthoRefractionVisualAcuity.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })
    }),

  saveRefraction: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        avOdSinCorrecion: z.string().optional().nullable(),
        avOiSinCorrecion: z.string().optional().nullable(),
        esferaOd: z.number().optional().nullable(),
        cilindroOd: z.number().optional().nullable(),
        ejeOd: z.number().int().min(0).max(180).optional().nullable(),
        adicionOd: z.number().optional().nullable(),
        avOdConCorreccion: z.string().optional().nullable(),
        esferaOi: z.number().optional().nullable(),
        cilindroOi: z.number().optional().nullable(),
        ejeOi: z.number().int().min(0).max(180).optional().nullable(),
        adicionOi: z.number().optional().nullable(),
        avOiConCorreccion: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-ophtho-ref-1" }
      }

      const existing = await ctx.db.ophthoRefractionVisualAcuity.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })

      const data = {
        avOdSinCorrecion: input.avOdSinCorrecion,
        avOiSinCorrecion: input.avOiSinCorrecion,
        esferaOd: input.esferaOd,
        cilindroOd: input.cilindroOd,
        ejeOd: input.ejeOd,
        adicionOd: input.adicionOd,
        avOdConCorreccion: input.avOdConCorreccion,
        esferaOi: input.esferaOi,
        cilindroOi: input.cilindroOi,
        ejeOi: input.ejeOi,
        adicionOi: input.adicionOi,
        avOiConCorreccion: input.avOiConCorreccion,
      }

      if (existing) {
        return ctx.db.ophthoRefractionVisualAcuity.update({
          where: { id: existing.id },
          data,
        })
      }

      return ctx.db.ophthoRefractionVisualAcuity.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          ...data,
        },
      })
    }),

  // ─── 2. GLAUCOMA & RETINOPATÍA DIABÉTICA/HIPERTENSIVA ───
  getGlaucomaRetinopathy: protectedProcedure
    .input(z.object({ encounterId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return {
          id: "sandbox-ophtho-glauc-1",
          encounterId: "sandbox-demo",
          patientRegistrationId: "sandbox-demo-pat",
          workspaceId: ctx.session.workspaceId ?? "sandbox",
          pioOdMmHg: 16.0,
          pioOiMmHg: 18.5,
          tratamientoHipotensor: "Latanoprost 0.005% 1 gota en ambos ojos al acostarse",
          retinopatiaDiabetica: "RDNP Leve (Microaneurismas aislados)",
          retinopatiaHipertensiva: "Grado I (Estrechamiento arterial leve)",
          excavacionPapilarOd: 0.4,
          excavacionPapilarOi: 0.5,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }

      return ctx.db.ophthoGlaucomaRetinopathy.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })
    }),

  saveGlaucomaRetinopathy: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        pioOdMmHg: z.number().positive().optional().nullable(),
        pioOiMmHg: z.number().positive().optional().nullable(),
        tratamientoHipotensor: z.string().optional().nullable(),
        retinopatiaDiabetica: z.string().optional().nullable(),
        retinopatiaHipertensiva: z.string().optional().nullable(),
        excavacionPapilarOd: z.number().min(0.1).max(0.9).optional().nullable(),
        excavacionPapilarOi: z.number().min(0.1).max(0.9).optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-ophtho-glauc-1" }
      }

      const existing = await ctx.db.ophthoGlaucomaRetinopathy.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })

      const data = {
        pioOdMmHg: input.pioOdMmHg,
        pioOiMmHg: input.pioOiMmHg,
        tratamientoHipotensor: input.tratamientoHipotensor,
        retinopatiaDiabetica: input.retinopatiaDiabetica,
        retinopatiaHipertensiva: input.retinopatiaHipertensiva,
        excavacionPapilarOd: input.excavacionPapilarOd,
        excavacionPapilarOi: input.excavacionPapilarOi,
      }

      if (existing) {
        return ctx.db.ophthoGlaucomaRetinopathy.update({
          where: { id: existing.id },
          data,
        })
      }

      return ctx.db.ophthoGlaucomaRetinopathy.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          ...data,
        },
      })
    }),

  // ─── 3. SEGMENTO ANTERIOR/POSTERIOR & DIAGRAMAS OCULARES ───
  getEyeFindings: protectedProcedure
    .input(z.object({ encounterId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return {
          id: "sandbox-ophtho-find-1",
          encounterId: "sandbox-demo",
          patientRegistrationId: "sandbox-demo-pat",
          workspaceId: ctx.session.workspaceId ?? "sandbox",
          segmentoAnteriorOd: "Córnea transparente, cámara anterior amplia sin Tyndall, cristalino con esclerosis nuclear NO-2.",
          segmentoAnteriorOi: "Córnea transparente, cámara anterior formada, cristalino transparente.",
          segmentoPosteriorOd: "Mácula libre de exudados, papila de bordes netos, relación arteria/vena 2:3.",
          segmentoPosteriorOi: "Mácula conservada, papila de color rosado.",
          hallazgosDiagramaOd: "Nevus conjuntival temporal 2mm.",
          hallazgosDiagramaOi: "Sin hallazgos periféricos.",
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }

      return ctx.db.ophthoEyeFindings.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })
    }),

  saveEyeFindings: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        segmentoAnteriorOd: z.string().optional().nullable(),
        segmentoAnteriorOi: z.string().optional().nullable(),
        segmentoPosteriorOd: z.string().optional().nullable(),
        segmentoPosteriorOi: z.string().optional().nullable(),
        hallazgosDiagramaOd: z.string().optional().nullable(),
        hallazgosDiagramaOi: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-ophtho-find-1" }
      }

      const existing = await ctx.db.ophthoEyeFindings.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })

      const data = {
        segmentoAnteriorOd: input.segmentoAnteriorOd,
        segmentoAnteriorOi: input.segmentoAnteriorOi,
        segmentoPosteriorOd: input.segmentoPosteriorOd,
        segmentoPosteriorOi: input.segmentoPosteriorOi,
        hallazgosDiagramaOd: input.hallazgosDiagramaOd,
        hallazgosDiagramaOi: input.hallazgosDiagramaOi,
      }

      if (existing) {
        return ctx.db.ophthoEyeFindings.update({
          where: { id: existing.id },
          data,
        })
      }

      return ctx.db.ophthoEyeFindings.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          ...data,
        },
      })
    }),
})
