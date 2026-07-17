import { z } from "zod"
import { Prisma } from "@prisma/client"
import { TRPCError } from "@trpc/server"
import { router, doctorProcedure } from "../trpc"
import {
  DEFAULT_REPORT_SECCIONES,
  REPORT_SECTION_KEYS,
  type ReportInstruccionesMap,
  type ReportSeccionesMap,
} from "@/types/report"

/**
 * tRPC router for per-doctor customizable medical report preferences.
 *
 * One row per doctor in DoctorReportPreferences. Doctors visit
 * /dashboard/preferencias-informe to configure the section set + default
 * per-section instructions. At informe-generation time the encounter's
 * Document.reportOverride is merged with these defaults.
 *
 * The "get" procedure returns DEFAULT_REPORT_SECCIONES merged with the
 * doctor's row (so the UI has a complete picture even before the doctor
 * saves anything).
 */
export const reportPreferencesRouter = router({
  /**
   * Fetch the doctor's report preferences. Returns a complete object
   * (defaults + doctor overrides merged) so the UI never has to deal
   * with missing keys.
   */
  get: doctorProcedure.query(async ({ ctx }) => {
    const prefs = await ctx.db.doctorReportPreferences.findUnique({
      where: { doctorId: ctx.session.doctorId },
    })

    if (!prefs) {
      return {
        secciones: { ...DEFAULT_REPORT_SECCIONES },
        instruccionesDefault: {} as ReportInstruccionesMap,
        isDefault: true,
      }
    }

    // Merge stored secciones over the defaults so missing keys still
    // get a value (the AI prompt builder needs every key).
    const secciones: ReportSeccionesMap = { ...DEFAULT_REPORT_SECCIONES }
    const stored = (prefs.secciones as ReportSeccionesMap) ?? {}
    for (const k of REPORT_SECTION_KEYS) {
      if (typeof stored[k] === "boolean") secciones[k] = stored[k]
    }

    return {
      secciones,
      instruccionesDefault: (prefs.instruccionesDefault as ReportInstruccionesMap) ?? {},
      isDefault: false,
    }
  }),

  /**
   * Create or update the doctor's report preferences. Replaces the entire
   * secciones and instruccionesDefault object (PATCH semantics would
   * require complex merge logic for nested objects; full replace is
   * simpler and the form is small).
   */
  upsert: doctorProcedure
    .input(
      z.object({
        secciones: z.preprocess(
          (val) => {
            if (typeof val === "string") {
              try { return JSON.parse(val) } catch { return val }
            }
            return val
          },
          z.record(z.string(), z.boolean())
        ),
        instruccionesDefault: z.preprocess(
          (val) => {
            if (typeof val === "string") {
              try { return JSON.parse(val) } catch { return val }
            }
            return val
          },
          z.record(z.string(), z.string().max(500)).optional()
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Sanitize instructions: drop empty strings so the JSON stays clean
      const instruccionesSanitized: ReportInstruccionesMap = {}
      if (input.instruccionesDefault) {
        for (const [k, v] of Object.entries(input.instruccionesDefault)) {
          if (v && v.trim()) {
            instruccionesSanitized[k as keyof typeof instruccionesSanitized] = v.trim()
          }
        }
      }

      const hasInstructions = Object.keys(instruccionesSanitized).length > 0

      const updated = await ctx.db.doctorReportPreferences.upsert({
        where: { doctorId: ctx.session.doctorId },
        create: {
          doctorId: ctx.session.doctorId,
          secciones: input.secciones,
          instruccionesDefault: hasInstructions
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ? (instruccionesSanitized as any)
            : Prisma.JsonNull,
        },
        update: {
          secciones: input.secciones,
          instruccionesDefault: hasInstructions
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ? (instruccionesSanitized as any)
            : Prisma.JsonNull,
        },
      })

      return { id: updated.id, isDefault: false }
    }),
})
