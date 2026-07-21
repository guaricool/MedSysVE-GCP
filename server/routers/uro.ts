import { z } from "zod"
import { router, protectedProcedure } from "../trpc"
import { TRPCError } from "@trpc/server"
import { audit } from "@/lib/audit"

export const uroRouter = router({
  // ─── 1. PUNTUACIÓN IPSS DE SÍNTOMAS PROSTÁTICOS & QoL ───
  getIpssScore: protectedProcedure
    .input(z.object({ encounterId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return {
          id: "sandbox-uro-ipss-1",
          encounterId: "sandbox-demo",
          patientRegistrationId: "sandbox-demo-pat",
          workspaceId: ctx.session.workspaceId ?? "sandbox",
          vaciadoIncompleto: 3,
          frecuenciaUrinaria: 3,
          intermitencia: 2,
          urgenciaUrinaria: 4,
          chorroDebil: 4,
          esfuerzoUrinario: 2,
          nicturia: 3,
          ipssTotalScore: 21,
          qolScore: 4,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }

      return ctx.db.uroIpssScore.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })
    }),

  saveIpssScore: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        vaciadoIncompleto: z.number().int().min(0).max(5),
        frecuenciaUrinaria: z.number().int().min(0).max(5),
        intermitencia: z.number().int().min(0).max(5),
        urgenciaUrinaria: z.number().int().min(0).max(5),
        chorroDebil: z.number().int().min(0).max(5),
        esfuerzoUrinario: z.number().int().min(0).max(5),
        nicturia: z.number().int().min(0).max(5),
        ipssTotalScore: z.number().int().min(0).max(35),
        qolScore: z.number().int().min(0).max(6),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-uro-ipss-1" }
      }

      const existing = await ctx.db.uroIpssScore.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })

      const data = {
        vaciadoIncompleto: input.vaciadoIncompleto,
        frecuenciaUrinaria: input.frecuenciaUrinaria,
        intermitencia: input.intermitencia,
        urgenciaUrinaria: input.urgenciaUrinaria,
        chorroDebil: input.chorroDebil,
        esfuerzoUrinario: input.esfuerzoUrinario,
        nicturia: input.nicturia,
        ipssTotalScore: input.ipssTotalScore,
        qolScore: input.qolScore,
      }

      if (existing) {
        return ctx.db.uroIpssScore.update({
          where: { id: existing.id },
          data,
        })
      }

      return ctx.db.uroIpssScore.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          ...data,
        },
      })
    }),

  // ─── 2. CALCULADORA DE PSA & DENSIDAD PROSTÁTICA ───
  getPsaCalculator: protectedProcedure
    .input(z.object({ encounterId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return {
          id: "sandbox-uro-psa-1",
          encounterId: "sandbox-demo",
          patientRegistrationId: "sandbox-demo-pat",
          workspaceId: ctx.session.workspaceId ?? "sandbox",
          psaTotal: 6.8,
          psaLibre: 0.95,
          ratioPsaLibreTotal: 13.97,
          volumenProstaticoCc: 45.0,
          densidadPsa: 0.151,
          interpretacionPsa: "PSA Total elevado en 'Zona Gris' (4-10 ng/mL). Ratio Libre/Total <15% sugiere mayor riesgo. Indicada Biopsia Prostática Dirigida por US Eco/RM.",
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }

      return ctx.db.uroPsaCalculator.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })
    }),

  savePsaCalculator: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        psaTotal: z.number().positive(),
        psaLibre: z.number().positive().optional().nullable(),
        ratioPsaLibreTotal: z.number().positive().optional().nullable(),
        volumenProstaticoCc: z.number().positive().optional().nullable(),
        densidadPsa: z.number().positive().optional().nullable(),
        interpretacionPsa: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-uro-psa-1" }
      }

      const existing = await ctx.db.uroPsaCalculator.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })

      const data = {
        psaTotal: input.psaTotal,
        psaLibre: input.psaLibre,
        ratioPsaLibreTotal: input.ratioPsaLibreTotal,
        volumenProstaticoCc: input.volumenProstaticoCc,
        densidadPsa: input.densidadPsa,
        interpretacionPsa: input.interpretacionPsa,
      }

      if (existing) {
        return ctx.db.uroPsaCalculator.update({
          where: { id: existing.id },
          data,
        })
      }

      return ctx.db.uroPsaCalculator.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          ...data,
        },
      })
    }),

  // ─── 3. UROFLUJOMETRÍA & RESIDUO POST-MICCIONAL (RPM) ───
  getUroflowmetry: protectedProcedure
    .input(z.object({ encounterId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return {
          id: "sandbox-uro-flow-1",
          encounterId: "sandbox-demo",
          patientRegistrationId: "sandbox-demo-pat",
          workspaceId: ctx.session.workspaceId ?? "sandbox",
          qmaxMlSec: 9.5,
          qavgMlSec: 4.8,
          volumenEmitidoMl: 220.0,
          residuoPostMiccionalMl: 85.0,
          interpretacionUroflujo: "Uroflujometría con Flujo Máximo disminuido (Qmax < 10 mL/s) y curva aplanada compatible con Obstrucción del Salida Vesical (STUI/HPB). Residuo Post-Miccional significativo (85 mL).",
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }

      return ctx.db.uroUroflowmetry.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })
    }),

  saveUroflowmetry: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        qmaxMlSec: z.number().positive(),
        qavgMlSec: z.number().positive().optional().nullable(),
        volumenEmitidoMl: z.number().positive(),
        residuoPostMiccionalMl: z.number().min(0),
        interpretacionUroflujo: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-uro-flow-1" }
      }

      const existing = await ctx.db.uroUroflowmetry.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })

      const data = {
        qmaxMlSec: input.qmaxMlSec,
        qavgMlSec: input.qavgMlSec,
        volumenEmitidoMl: input.volumenEmitidoMl,
        residuoPostMiccionalMl: input.residuoPostMiccionalMl,
        interpretacionUroflujo: input.interpretacionUroflujo,
      }

      if (existing) {
        return ctx.db.uroUroflowmetry.update({
          where: { id: existing.id },
          data,
        })
      }

      return ctx.db.uroUroflowmetry.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          ...data,
        },
      })
    }),
})
