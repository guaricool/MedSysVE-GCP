/**
 * Medical report (informe) preference shapes.
 *
 * Used by:
 *   - DoctorReportPreferences model in prisma/schema.prisma
 *   - Document.reportOverride JSON column
 *   - tRPC router `report-preferences` in server/routers/report-preferences.ts
 *   - AI prompt builder in lib/ai/generate-report.ts
 *
 * Single source of truth for the report section vocabulary. If you add a
 * section, update:
 *   1. REPORT_SECTION_KEYS (this file)
 *   2. REPORT_SECTION_LABELS (this file)
 *   3. DEFAULT_REPORT_SECCIONES (this file)
 *   4. buildReportPrompt in lib/ai/generate-report.ts (to render the section
 *      when it's enabled)
 */

/**
 * The fixed set of sections the AI can include in a medical report.
 * Order is meaningful: it's the render order in the prompt and the
 * default order in the profile checkboxes.
 */
export const REPORT_SECTION_KEYS = [
  "motivoConsulta",
  "historiaClinica",
  "signosVitales",
  "examenFisico",
  "diagnosticos",
  "tratamientoIndicado",
  "planTratamiento",
  "ordenesLaboratorio",
  "ordenesImagenes",
] as const

export type ReportSectionKey = (typeof REPORT_SECTION_KEYS)[number]

/**
 * Human-readable Spanish labels for the profile UI. Keep in sync with
 * REPORT_SECTION_KEYS — TypeScript will complain if a key is missing.
 */
export const REPORT_SECTION_LABELS: Record<ReportSectionKey, string> = {
  motivoConsulta: "Motivo de consulta",
  historiaClinica: "Enfermedad actual",
  signosVitales: "Signos vitales",
  examenFisico: "Examen físico",
  diagnosticos: "Diagnósticos (CIE-10)",
  tratamientoIndicado: "Tratamiento indicado (receta)",
  planTratamiento: "Plan de tratamiento",
  ordenesLaboratorio: "Órdenes de laboratorio",
  ordenesImagenes: "Órdenes de imágenes",
}

/**
 * Short helper text shown in the profile UI under each checkbox. Tells
 * the doctor what data feeds the section.
 */
export const REPORT_SECTION_DESCRIPTIONS: Record<ReportSectionKey, string> = {
  motivoConsulta: "Lo que el paciente cuenta como razón de la consulta.",
  historiaClinica: "Antecedentes, síntomas referidos, contexto de la enfermedad actual.",
  signosVitales: "TA, FC, FR, T°, SpO₂, peso, talla, IMC.",
  examenFisico: "Hallazgos del examen físico registrados en la consulta.",
  diagnosticos: "Diagnósticos CIE-10 separados en principal y secundarios.",
  tratamientoIndicado: "Medicamentos de la receta con su dosis/frecuencia/duración.",
  planTratamiento: "Indicaciones, próximos pasos, seguimiento, recomendaciones.",
  ordenesLaboratorio: "Órdenes de laboratorio clínico.",
  ordenesImagenes: "Órdenes de imágenes (placas, ecografías, resonancias, etc.).",
}

/**
 * The default section set for a NEW doctor. We turn ON everything except
 * signosVitales (a lot of doctors don't take vitals on every consulta) and
 * historiaClinica (often overlaps with motivoConsulta).
 *
 * If you change the default, the new doctors get the new default; existing
 * doctors keep their own preferences (we never overwrite on read).
 */
export const DEFAULT_REPORT_SECCIONES: Record<ReportSectionKey, boolean> = {
  motivoConsulta: true,
  historiaClinica: false, // off by default — most informes include this
  // implicitly via motivoConsulta; doctors can toggle on
  signosVitales: false, // off by default — many doctors don't record vitals
  examenFisico: true,
  diagnosticos: true,
  tratamientoIndicado: true,
  planTratamiento: true,
  ordenesLaboratorio: true,
  ordenesImagenes: true,
}

/**
 * What the DoctorReportPreferences.secciones JSON column stores. Subset
 * of ReportSectionKey (only FALSE is interesting — TRUE is the implicit
 * default), but we accept any shape for forward-compat.
 */
export type ReportSeccionesMap = Partial<Record<ReportSectionKey, boolean>>

/**
 * What DoctorReportPreferences.instruccionesDefault stores. Free text per
 * section, up to 500 chars each (enforced in the tRPC router).
 */
export type ReportInstruccionesMap = Partial<Record<ReportSectionKey, string>>

/**
 * The shape stored on Document.reportOverride. This is a DELTA, not a
 * full copy of the doctor's preferences. We merge it with the doctor's
 * default prefs at generation time:
 *
 *   - seccionesExtra: sections the doctor wants for THIS consulta that
 *     are NOT in their default set (always added).
 *   - seccionesQuitadas: sections the doctor wants to DROP for this
 *     consulta that ARE in their default set (always removed).
 *   - instrucciones: per-section instructions for this consulta, which
 *     override the doctor's default instructions.
 */
export interface ReportOverride {
  seccionesExtra?: ReportSectionKey[]
  seccionesQuitadas?: ReportSectionKey[]
  instrucciones?: ReportInstruccionesMap
}

/**
 * Type guard: cheap runtime check for the JSON shape. Doesn't validate
 * every key — that's done at the tRPC layer with zod. This just makes
 * sure we're not dealing with a totally malformed object.
 */
export function isReportOverride(value: unknown): value is ReportOverride {
  // null/undefined = no override (valid: column NULL in DB means "use defaults")
  if (value === null || value === undefined) return true
  // Reject non-objects (string, number, boolean)
  if (typeof value !== "object") return false
  // Arrays aren't a valid ReportOverride
  if (Array.isArray(value)) return false
  const v = value as Record<string, unknown>
  if (v.seccionesExtra !== undefined && !Array.isArray(v.seccionesExtra)) return false
  if (v.seccionesQuitadas !== undefined && !Array.isArray(v.seccionesQuitadas)) return false
  if (v.instrucciones !== undefined) {
    if (typeof v.instrucciones !== "object" || v.instrucciones === null) {
      return false
    }
    if (Array.isArray(v.instrucciones)) return false
  }
  return true
}

/**
 * Resolve the final section list for a consulta by merging the doctor's
 * default prefs with the per-consulta override.
 *
 * Returns a Map (preserving order) of section → instruction (or empty
 * string if no instruction). The order matches REPORT_SECTION_KEYS.
 */
export function resolveReportSections(
  defaultSecciones: ReportSeccionesMap | null | undefined,
  defaultInstrucciones: ReportInstruccionesMap | null | undefined,
  override: ReportOverride | null | undefined,
): Map<ReportSectionKey, string> {
  // Start with the doctor's defaults. Missing keys default to TRUE
  // (we treat absence as "I want this section").
  const effective: Record<ReportSectionKey, boolean> = { ...DEFAULT_REPORT_SECCIONES }
  if (defaultSecciones) {
    for (const k of REPORT_SECTION_KEYS) {
      const v = defaultSecciones[k]
      if (typeof v === "boolean") effective[k] = v
    }
  }

  // Apply override deltas
  if (override?.seccionesExtra) {
    for (const k of override.seccionesExtra) effective[k] = true
  }
  if (override?.seccionesQuitadas) {
    for (const k of override.seccionesQuitadas) effective[k] = false
  }

  // Resolve instructions: override wins over default
  const instrucciones: ReportInstruccionesMap = { ...(defaultInstrucciones ?? {}) }
  if (override?.instrucciones) {
    Object.assign(instrucciones, override.instrucciones)
  }

  // Build the ordered map of enabled sections
  const out = new Map<ReportSectionKey, string>()
  for (const k of REPORT_SECTION_KEYS) {
    if (effective[k]) {
      out.set(k, instrucciones[k] ?? "")
    }
  }
  return out
}
