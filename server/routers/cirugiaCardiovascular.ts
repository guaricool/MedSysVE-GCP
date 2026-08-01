import { z } from "zod"
import { router, protectedProcedure } from "../trpc"
import { ensureDbSchema } from "@/lib/db"

export const cirugiaCardiovascularRouter = router({
  // ─── 1. EVALUACIÓN DE CIRUGÍA CARDIOVASCULAR ───
  getEval: protectedProcedure
    .input(z.object({ encounterId: z.string() }))
    .query(async ({ ctx, input }) => {
      await ensureDbSchema().catch(() => {})

      if (input.encounterId === "sandbox-demo") {
        return null
      }

      try {
        return await ctx.db.cirugiaCardiovascularEval.findFirst({
          where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
        })
      } catch (err) {
        console.warn("[cirugiaCardiovascular.getEval] Error fetching eval:", err)
        return null
      }
    }),

  saveEval: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        
        // Escalas de Riesgo
        euroScoreII: z.number().optional().nullable(),
        stsScoreMortality: z.number().optional().nullable(),
        stsScoreMorbidity: z.number().optional().nullable(),
        nyhaClass: z.string().optional().nullable(),
        ccsClass: z.string().optional().nullable(),
        frailtyScore: z.number().optional().nullable(),

        // Cateterismo & Coronarias
        dominanciaCoronaria: z.string().optional().nullable(),
        stenosisTci: z.number().optional().nullable(),
        stenosisDa: z.number().optional().nullable(),
        stenosisCx: z.number().optional().nullable(),
        stenosisCd: z.number().optional().nullable(),
        syntaxScore: z.number().optional().nullable(),

        // Ecocardiograma
        fevi: z.number().optional().nullable(),
        gradienteMedioAortico: z.number().optional().nullable(),
        gradientePicoAortico: z.number().optional().nullable(),
        areaValvularAortica: z.number().optional().nullable(),
        areaValvularMitral: z.number().optional().nullable(),
        psap: z.number().optional().nullable(),
        derramePericardico: z.string().optional().nullable(),

        // AngioTAC
        diametroAortaAscendente: z.number().optional().nullable(),
        diametroArcoAortico: z.number().optional().nullable(),
        diametroAortaDescendente: z.number().optional().nullable(),
        diametroAortaAbdominal: z.number().optional().nullable(),
        diametroIliofemoral: z.number().optional().nullable(),

        // Examen Quirúrgico
        testAllenDerecho: z.string().optional().nullable(),
        testAllenIzquierdo: z.string().optional().nullable(),
        calidadSafena: z.string().optional().nullable(),
        estabilidadEsternal: z.string().optional().nullable(),
        cicatrizEsternotomia: z.string().optional().nullable(),
        escalaAsepsis: z.number().optional().nullable(),

        // Anticoagulación
        inrObjetivoMin: z.number().optional().nullable(),
        inrObjetivoMax: z.number().optional().nullable(),
        inrActual: z.number().optional().nullable(),
        esquemaAnticoagulante: z.string().optional().nullable(),
        diasSuspensionAntiagregantes: z.number().optional().nullable(),
        protocoloTraslapeHeparina: z.string().optional().nullable(),

        // Plan Quirúrgico & CEC
        procedimientoPropuesto: z.string().optional().nullable(),
        tipoCanulacion: z.string().optional().nullable(),
        tipoCardioplejia: z.string().optional().nullable(),
        gradoHipotermia: z.string().optional().nullable(),
        planCellSaver: z.boolean().default(true),

        // Posop & Rehabilitación
        diaPosoperatorio: z.number().optional().nullable(),
        usoFajaEsternal: z.boolean().default(true),
        complicacionesPosop: z.string().optional().nullable(),
        indicacionRehabilitacionCardiaca: z.boolean().default(true),
        observacionesQuirurgicas: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ensureDbSchema().catch(() => {})

      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-cardio-surg-eval-1" }
      }

      const existing = await ctx.db.cirugiaCardiovascularEval.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })

      const { encounterId, patientRegistrationId, ...data } = input

      if (existing) {
        return ctx.db.cirugiaCardiovascularEval.update({
          where: { id: existing.id },
          data,
        })
      }

      return ctx.db.cirugiaCardiovascularEval.create({
        data: {
          encounterId,
          patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          ...data,
        },
      })
    }),

  // ─── 2. MAPA DE PULSOS PERIFÉRICOS ───
  getPulsos: protectedProcedure
    .input(z.object({ encounterId: z.string() }))
    .query(async ({ ctx, input }) => {
      await ensureDbSchema().catch(() => {})

      if (input.encounterId === "sandbox-demo") {
        return null
      }

      try {
        return await ctx.db.cirugiaCardiovascularPulsos.findFirst({
          where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
        })
      } catch (err) {
        console.warn("[cirugiaCardiovascular.getPulsos] Error fetching pulsos:", err)
        return null
      }
    }),

  savePulsos: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        carotideoDer: z.number().default(2),
        carotideoIzquierdo: z.number().default(2),
        subclavioDer: z.number().default(2),
        subclavioIzquierdo: z.number().default(2),
        braquialDer: z.number().default(2),
        braquialIzquierdo: z.number().default(2),
        radialDer: z.number().default(2),
        radialIzquierdo: z.number().default(2),
        femoralDer: z.number().default(2),
        femoralIzquierdo: z.number().default(2),
        popliteoDer: z.number().default(2),
        popliteoIzquierdo: z.number().default(2),
        tibialPosteriorDer: z.number().default(2),
        tibialPosteriorIzquierdo: z.number().default(2),
        pedioDer: z.number().default(2),
        pedioIzquierdo: z.number().default(2),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ensureDbSchema().catch(() => {})

      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-pulsos-1" }
      }

      const existing = await ctx.db.cirugiaCardiovascularPulsos.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })

      const { encounterId, patientRegistrationId, ...data } = input

      if (existing) {
        return ctx.db.cirugiaCardiovascularPulsos.update({
          where: { id: existing.id },
          data,
        })
      }

      return ctx.db.cirugiaCardiovascularPulsos.create({
        data: {
          encounterId,
          patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          ...data,
        },
      })
    }),

  // ─── 3. PRÓTESIS VALVULARES E IMPLANTES AÓRTICOS ───
  listProtesis: protectedProcedure
    .input(z.object({ patientRegistrationId: z.string() }))
    .query(async ({ ctx, input }) => {
      await ensureDbSchema().catch(() => {})

      if (input.patientRegistrationId === "sandbox-demo-pat") {
        return []
      }

      try {
        return await ctx.db.cirugiaCardiovascularProtesis.findMany({
          where: { patientRegistrationId: input.patientRegistrationId, workspaceId: ctx.session.workspaceId },
          orderBy: { createdAt: "desc" },
        })
      } catch (err) {
        console.warn("[cirugiaCardiovascular.listProtesis] Error listing protesis:", err)
        return []
      }
    }),

  saveProtesis: protectedProcedure
    .input(
      z.object({
        id: z.string().optional(),
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        tipo: z.string(),
        posicion: z.string(),
        tipoMaterial: z.string(),
        marcaModelo: z.string(),
        tamanoMm: z.number().optional().nullable(),
        numeroSerieLote: z.string().optional().nullable(),
        fechaImplante: z.string().optional().nullable(),
        estadoProtesis: z.string().optional().default("Normofuncionante"),
        observaciones: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ensureDbSchema().catch(() => {})

      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-protesis-1" }
      }

      const { id, encounterId, patientRegistrationId, fechaImplante, ...rest } = input
      const dateVal = fechaImplante ? new Date(fechaImplante) : null

      if (id) {
        return ctx.db.cirugiaCardiovascularProtesis.update({
          where: { id },
          data: {
            ...rest,
            fechaImplante: dateVal,
          },
        })
      }

      return ctx.db.cirugiaCardiovascularProtesis.create({
        data: {
          encounterId,
          patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          ...rest,
          fechaImplante: dateVal,
        },
      })
    }),

  deleteProtesis: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ensureDbSchema().catch(() => {})

      if (input.id.startsWith("sandbox-")) {
        return { ok: true }
      }

      return ctx.db.cirugiaCardiovascularProtesis.delete({
        where: { id: input.id },
      })
    }),
})
