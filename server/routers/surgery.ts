import { z } from "zod"
import { router, protectedProcedure } from "../trpc"
import { TRPCError } from "@trpc/server"
import { audit } from "@/lib/audit"

export const surgeryRouter = router({
  // ─── 1. LISTA DE CHEQUEO DE SEGURIDAD QUIRÚRGICA OMS ───
  getChecklist: protectedProcedure
    .input(z.object({ encounterId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return {
          id: "sandbox-surgery-chk-1",
          encounterId: "sandbox-demo",
          patientRegistrationId: "sandbox-demo-pat",
          workspaceId: ctx.session.workspaceId ?? "sandbox",
          signInConfirmado: true,
          timeOutPausaQuirurgica: true,
          signOutConteoCorrecto: true,
          observacionesChecklist: "Chequeo OMS completado sin desviaciones.",
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }

      return ctx.db.surgerySafetyChecklist.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })
    }),

  saveChecklist: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        signInConfirmado: z.boolean().default(false),
        timeOutPausaQuirurgica: z.boolean().default(false),
        signOutConteoCorrecto: z.boolean().default(false),
        observacionesChecklist: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-surgery-chk-1" }
      }

      const existing = await ctx.db.surgerySafetyChecklist.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })

      const data = {
        signInConfirmado: input.signInConfirmado,
        timeOutPausaQuirurgica: input.timeOutPausaQuirurgica,
        signOutConteoCorrecto: input.signOutConteoCorrecto,
        observacionesChecklist: input.observacionesChecklist,
      }

      if (existing) {
        return ctx.db.surgerySafetyChecklist.update({
          where: { id: existing.id },
          data,
        })
      }

      return ctx.db.surgerySafetyChecklist.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          ...data,
        },
      })
    }),

  // ─── 2. PROTOCOLO Y REPORTE QUIRÚRGICO OPERATORIO ───
  listOperativeReports: protectedProcedure
    .input(z.object({ patientRegistrationId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.patientRegistrationId === "sandbox-demo-pat") {
        return [
          {
            id: "sandbox-surgery-report-1",
            encounterId: "sandbox-demo",
            patientRegistrationId: "sandbox-demo-pat",
            workspaceId: ctx.session.workspaceId ?? "sandbox",
            diagnosticoPreoperatorio: "Apendicitis Aguda Flegmonosa",
            diagnosticoPostoperatorio: "Apendicitis Aguda Gangrenosa no perforada",
            cirujanoPrincipal: "Dr. Carlos Pierluissi",
            primerAyudante: "Dr. Roberto Mendoza",
            procedimientoRealizado: "Apendicectomía Laparoscópica",
            hallazgosQuirurgicos: "Apendice cecal subcecal de 10x2cm, edematoso y gangrenoso en tercio distal. Escaso líquido libre claro.",
            perdidaSangreMl: 30,
            conteoGasasCompresasOk: true,
            hallazgosAnatomopatologicos: "Pieza de apendicectomía enviada a biopsia histopatológica en formol al 10%.",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]
      }

      return ctx.db.surgeryOperativeReport.findMany({
        where: { patientRegistrationId: input.patientRegistrationId, workspaceId: ctx.session.workspaceId },
        orderBy: { createdAt: "desc" },
      })
    }),

  saveOperativeReport: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        diagnosticoPreoperatorio: z.string(),
        diagnosticoPostoperatorio: z.string(),
        cirujanoPrincipal: z.string(),
        primerAyudante: z.string().optional().nullable(),
        procedimientoRealizado: z.string(),
        hallazgosQuirurgicos: z.string(),
        perdidaSangreMl: z.number().positive().optional().nullable(),
        conteoGasasCompresasOk: z.boolean().default(true),
        hallazgosAnatomopatologicos: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-surgery-report-1" }
      }

      return ctx.db.surgeryOperativeReport.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          diagnosticoPreoperatorio: input.diagnosticoPreoperatorio,
          diagnosticoPostoperatorio: input.diagnosticoPostoperatorio,
          cirujanoPrincipal: input.cirujanoPrincipal,
          primerAyudante: input.primerAyudante,
          procedimientoRealizado: input.procedimientoRealizado,
          hallazgosQuirurgicos: input.hallazgosQuirurgicos,
          perdidaSangreMl: input.perdidaSangreMl,
          conteoGasasCompresasOk: input.conteoGasasCompresasOk,
          hallazgosAnatomopatologicos: input.hallazgosAnatomopatologicos,
        },
      })
    }),

  // ─── 3. CLASIFICACIÓN CLAVIEN-DINDO DE COMPLICACIONES QUIRÚRGICAS ───
  listComplications: protectedProcedure
    .input(z.object({ patientRegistrationId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.patientRegistrationId === "sandbox-demo-pat") {
        return [
          {
            id: "sandbox-surgery-comp-1",
            encounterId: "sandbox-demo",
            patientRegistrationId: "sandbox-demo-pat",
            workspaceId: ctx.session.workspaceId ?? "sandbox",
            gradeClass: "Grado I (Desviación menor del curso normal sin necesidad de tratamiento farmacológico/quirúrgico)",
            descripcionComplicacion: "Seroma menor en puerto umbilical de 10mm, manejado con drenaje espontáneo en consulta externa.",
            requirioReintervencion: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]
      }

      return ctx.db.surgeryClavienDindo.findMany({
        where: { patientRegistrationId: input.patientRegistrationId, workspaceId: ctx.session.workspaceId },
        orderBy: { createdAt: "desc" },
      })
    }),

  saveComplication: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        gradeClass: z.string(),
        descripcionComplicacion: z.string(),
        requirioReintervencion: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-surgery-comp-1" }
      }

      return ctx.db.surgeryClavienDindo.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          gradeClass: input.gradeClass,
          descripcionComplicacion: input.descripcionComplicacion,
          requirioReintervencion: input.requirioReintervencion,
        },
      })
    }),
})
