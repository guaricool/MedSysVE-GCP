/**
 * Tests for the report sections resolver + types/report.ts shapes.
 *
 * Pure-function tests, no DB or AI required. These verify the merge
 * logic that the doctor-facing UI relies on:
 *   - default prefs + per-consulta override → resolved section set
 *   - delta computation: extra / quitadas / instrucciones delta
 *   - type guards and shape validation
 */
import { describe, it, expect } from "vitest"
import {
  DEFAULT_REPORT_SECCIONES,
  REPORT_SECTION_KEYS,
  isReportOverride,
  resolveReportSections,
  type ReportOverride,
  type ReportSectionKey,
  type ReportSeccionesMap,
} from "@/types/report"

describe("DEFAULT_REPORT_SECCIONES", () => {
  it("has a default for every key in REPORT_SECTION_KEYS", () => {
    // TypeScript compile-time check: every ReportSectionKey has a default.
    // Runtime check: the count matches.
    for (const key of REPORT_SECTION_KEYS) {
      expect(DEFAULT_REPORT_SECCIONES).toHaveProperty(key)
      expect(typeof DEFAULT_REPORT_SECCIONES[key]).toBe("boolean")
    }
  })

  it("turns signosVitales off by default (most doctors don't take vitals every consulta)", () => {
    expect(DEFAULT_REPORT_SECCIONES.signosVitales).toBe(false)
  })

  it("turns historiaClinica off by default (often overlaps with motivoConsulta)", () => {
    expect(DEFAULT_REPORT_SECCIONES.historiaClinica).toBe(false)
  })

  it("turns diagnosticos / examenFisico / planTratamiento on by default", () => {
    expect(DEFAULT_REPORT_SECCIONES.diagnosticos).toBe(true)
    expect(DEFAULT_REPORT_SECCIONES.examenFisico).toBe(true)
    expect(DEFAULT_REPORT_SECCIONES.planTratamiento).toBe(true)
  })
})

describe("resolveReportSections", () => {
  it("returns DEFAULT_REPORT_SECCIONES when prefs are null (first-time doctor)", () => {
    // A new doctor who hasn't visited /doctor/preferencias-informe yet
    // has no row in DoctorReportPreferences. The resolver falls back to
    // the global default section set (5 active, 2 off).
    const result = resolveReportSections(null, null, null)
    const expectedActive = REPORT_SECTION_KEYS.filter(
      (k) => DEFAULT_REPORT_SECCIONES[k],
    )
    expect(result.size).toBe(expectedActive.length)
    for (const k of expectedActive) {
      expect(result.has(k)).toBe(true)
    }
    // Every default-OFF section is NOT in the result
    for (const k of REPORT_SECTION_KEYS) {
      if (!DEFAULT_REPORT_SECCIONES[k]) {
        expect(result.has(k)).toBe(false)
      }
    }
  })

  it("uses the doctor's prefs over the defaults", () => {
    const defaultSecciones: ReportSeccionesMap = {
      motivoConsulta: true,
      historiaClinica: true,
      signosVitales: true,
      examenFisico: false,
      diagnosticos: true,
      tratamientoIndicado: true,
      planTratamiento: true,
    }
    const result = resolveReportSections(defaultSecciones, null, null)
    expect(result.has("historiaClinica")).toBe(true)
    expect(result.has("examenFisico")).toBe(false)
    expect(result.has("signosVitales")).toBe(true)
  })

  it("applies override.seccionesExtra (adds sections not in the default set)", () => {
    const defaultSecciones: ReportSeccionesMap = {
      motivoConsulta: true,
      historiaClinica: false,
      signosVitales: false,
      examenFisico: true,
      diagnosticos: true,
      tratamientoIndicado: true,
      planTratamiento: true,
    }
    const override: ReportOverride = {
      seccionesExtra: ["historiaClinica", "signosVitales"],
    }
    const result = resolveReportSections(defaultSecciones, null, override)
    expect(result.has("historiaClinica")).toBe(true)
    expect(result.has("signosVitales")).toBe(true)
    // The other sections are unchanged
    expect(result.has("examenFisico")).toBe(true)
  })

  it("applies override.seccionesQuitadas (removes sections from the default set)", () => {
    const defaultSecciones: ReportSeccionesMap = {
      motivoConsulta: true,
      examenFisico: true,
      diagnosticos: true,
    }
    const override: ReportOverride = {
      seccionesQuitadas: ["examenFisico"],
    }
    const result = resolveReportSections(defaultSecciones, null, override)
    expect(result.has("examenFisico")).toBe(false)
    expect(result.has("motivoConsulta")).toBe(true)
    expect(result.has("diagnosticos")).toBe(true)
  })

  it("extra + quitadas in the same override compose correctly", () => {
    const defaultSecciones: ReportSeccionesMap = {
      motivoConsulta: true,
      examenFisico: true,
    }
    const override: ReportOverride = {
      seccionesExtra: ["diagnosticos"],
      seccionesQuitadas: ["examenFisico"],
    }
    const result = resolveReportSections(defaultSecciones, null, override)
    expect(result.has("examenFisico")).toBe(false)
    expect(result.has("diagnosticos")).toBe(true)
  })

  it("override.instrucciones win over defaultInstrucciones", () => {
    const defaultInstr = {
      examenFisico: "Default rule: lead with cardiovascular",
    }
    const override: ReportOverride = {
      instrucciones: {
        examenFisico: "Per-consulta override: this patient had surgery",
      },
    }
    const result = resolveReportSections(null, defaultInstr, override)
    expect(result.get("examenFisico")).toBe("Per-consulta override: this patient had surgery")
  })

  it("missing keys in defaultSecciones fall back to the global default (true)", () => {
    // Doctor's stored prefs only have motivoConsulta + examenFisico; the
    // other 5 should fall back to the global default (true for most).
    const partial: ReportSeccionesMap = {
      motivoConsulta: false,
    }
    const result = resolveReportSections(partial, null, null)
    expect(result.has("motivoConsulta")).toBe(false)
    // The other 6 should be present (because the global default is true for them)
    expect(result.has("examenFisico")).toBe(true)
    expect(result.has("diagnosticos")).toBe(true)
  })

  it("preserves the canonical section order from REPORT_SECTION_KEYS", () => {
    const result = resolveReportSections(null, null, null)
    const resultKeys = Array.from(result.keys())
    // Sections that are TRUE in the default should be in the result, in
    // the same order as REPORT_SECTION_KEYS.
    const expectedOrder = REPORT_SECTION_KEYS.filter(
      (k) => DEFAULT_REPORT_SECCIONES[k],
    )
    expect(resultKeys).toEqual(expectedOrder)
  })

  it("empty Map from explicit override is treated as 'no override' (uses defaults)", () => {
    // Edge case: caller passes an explicitly empty Map (size 0). The
    // resolver treats this the same as no override — defaults apply.
    // (The 'no sections' notice lives in buildReportPrompt, not here.)
    const result = resolveReportSections(null, null, {
      instrucciones: {},
    })
    // Default is 7 sections, all with empty instructions
    expect(result.size).toBe(7)
    for (const [, v] of result) {
      expect(v).toBe("")
    }
  })
})

describe("isReportOverride", () => {
  it("accepts null", () => {
    expect(isReportOverride(null)).toBe(true)
  })

  it("accepts undefined", () => {
    expect(isReportOverride(undefined)).toBe(true)
  })

  it("accepts an empty object", () => {
    expect(isReportOverride({})).toBe(true)
  })

  it("accepts a fully-populated override", () => {
    expect(
      isReportOverride({
        seccionesExtra: ["historiaClinica"],
        seccionesQuitadas: ["examenFisico"],
        instrucciones: { examenFisico: "special case" },
      }),
    ).toBe(true)
  })

  it("rejects non-objects (string, number, boolean)", () => {
    expect(isReportOverride("hello")).toBe(false)
    expect(isReportOverride(42)).toBe(false)
    expect(isReportOverride(true)).toBe(false)
  })

  it("rejects an object with non-array seccionesExtra", () => {
    expect(isReportOverride({ seccionesExtra: "not an array" })).toBe(false)
  })

  it("rejects an object with non-object instrucciones", () => {
    expect(isReportOverride({ instrucciones: "not an object" })).toBe(false)
    expect(isReportOverride({ instrucciones: ["a", "b"] })).toBe(false)
  })
})

describe("ReportSectionKey type", () => {
  it("REPORT_SECTION_KEYS has 9 keys (canonical SOAP-derived set)", () => {
    expect(REPORT_SECTION_KEYS.length).toBe(9)
  })

  it("REPORT_SECTION_KEYS contains the expected section names", () => {
    const expected: ReportSectionKey[] = [
      "motivoConsulta",
      "historiaClinica",
      "signosVitales",
      "examenFisico",
      "diagnosticos",
      "tratamientoIndicado",
      "planTratamiento",
      "ordenesLaboratorio",
      "ordenesImagenes",
    ]
    for (const k of expected) {
      expect(REPORT_SECTION_KEYS).toContain(k)
    }
  })
})
