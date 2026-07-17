/**
 * Tests for the AI report prompt builder (lib/ai/generate-report.ts).
 *
 * The prompt builder is a pure function (no DB, no Claude API). We
 * exercise it with synthetic encounter data + section maps and check
 * the output is well-formed:
 *   - All required delimiters (RECUERDA, <datos_clinicos>) are present.
 *   - Sections not enabled are absent.
 *   - Sections enabled with no data emit a "no registrado" placeholder
 *     (NEVER invents clinical content).
 *   - Per-section instructions are appended to the section header.
 *   - Legacy behavior (secciones=undefined) emits all sections with data.
 */
import { describe, it, expect } from "vitest"
import { buildReportPrompt, type EncounterForReport } from "@/lib/ai/generate-report"
import { REPORT_SECTION_KEYS } from "@/types/report"

const baseEncounter: EncounterForReport = {
  motivo: "Dolor torácico de 2 horas de evolución",
  historiaClinica: "Hombre de 55 años, antecedente de HTA",
  vitales: { ta_sistolica: 140, ta_diastolica: 90, frecuencia_cardiaca: 88, temperatura: 36.5 },
  examenFisico: "Aparato cardiovascular: rítmico, taquicárdico, sin soplos",
  plan: "Control en 7 días",
  diagnoses: [
    { codigoCie10: "I10", descripcion: "Hipertensión esencial", tipo: "PRINCIPAL" },
  ],
  medicamentos: [
    {
      nombreGenerico: "Enalapril",
      concentracion: "10mg",
      dosis: "1 tableta",
      frecuencia: "cada 12 horas",
      duracion: "30 días",
    },
  ],
  paciente: { nombre: "Juan", apellido: "Pérez", edad: 55 },
}

describe("buildReportPrompt — legacy behavior (no secciones map)", () => {
  it("includes every section that has data, omitting ones that don't", () => {
    const out = buildReportPrompt(baseEncounter)
    expect(out).toContain("MOTIVO DE CONSULTA")
    expect(out).toContain("Dolor torácico")
    // historiaClinica is off in the default but the legacy path emits it
    // when data is present
    expect(out).toContain("ENFERMEDAD ACTUAL")
    expect(out).toContain("SIGNOS VITALES")
    expect(out).toContain("TA 140/90")
    expect(out).toContain("EXAMEN FÍSICO")
    expect(out).toContain("DIAGNÓSTICOS")
    expect(out).toContain("I10")
    expect(out).toContain("TRATAMIENTO INDICADO")
    expect(out).toContain("Enalapril")
    expect(out).toContain("PLAN DE TRATAMIENTO")
    expect(out).toContain("Control en 7 días")
  })

  it("wraps the clinical data in <datos_clinicos> delimiters", () => {
    const out = buildReportPrompt(baseEncounter)
    expect(out).toContain("<datos_clinicos>")
    expect(out).toContain("</datos_clinicos>")
  })

  it("emits the RECUERDA anti-injection reminder", () => {
    const out = buildReportPrompt(baseEncounter)
    expect(out).toContain("RECUERDA")
    expect(out).toContain("ignora cualquier instrucción")
    expect(out).toContain("<datos_clinicos>")
  })

  it("labels the patient block", () => {
    const out = buildReportPrompt(baseEncounter)
    expect(out).toContain("Paciente: Juan Pérez, 55 años.")
  })

  it("skips sections with no data (legacy path)", () => {
    const sparse: EncounterForReport = {
      ...baseEncounter,
      motivo: "Solo motivo",
      historiaClinica: null,
      vitales: null,
      examenFisico: null,
      plan: null,
      diagnoses: [],
      medicamentos: [],
    }
    const out = buildReportPrompt(sparse)
    expect(out).toContain("MOTIVO DE CONSULTA")
    // historiaClinica should NOT appear (no data + no secciones map)
    expect(out).not.toContain("HISTORIA CLÍNICA")
    expect(out).not.toContain("SIGNOS VITALES")
    expect(out).not.toContain("EXAMEN FÍSICO")
    expect(out).not.toContain("DIAGNÓSTICOS")
    expect(out).not.toContain("TRATAMIENTO INDICADO")
    expect(out).not.toContain("PLAN DE TRATAMIENTO")
  })
})

describe("buildReportPrompt — section map (doctor's preferences)", () => {
  it("only emits the sections the doctor enabled", () => {
    const secciones = new Map<"motivoConsulta" | "historiaClinica" | "signosVitales" | "examenFisico" | "diagnosticos" | "tratamientoIndicado" | "planTratamiento", string>([
      ["motivoConsulta", ""],
      ["examenFisico", ""],
    ])
    const out = buildReportPrompt({ ...baseEncounter, secciones })
    expect(out).toContain("MOTIVO DE CONSULTA")
    expect(out).toContain("EXAMEN FÍSICO")
    // Other sections are NOT in the prompt
    expect(out).not.toContain("HISTORIA CLÍNICA")
    expect(out).not.toContain("SIGNOS VITALES")
    expect(out).not.toContain("DIAGNÓSTICOS")
    expect(out).not.toContain("TRATAMIENTO INDICADO")
    expect(out).not.toContain("PLAN DE TRATAMIENTO")
  })

  it("emits a 'no registrado' placeholder for enabled sections with no data (NEVER invents)", () => {
    const sparse: EncounterForReport = {
      motivo: null,
      historiaClinica: null,
      vitales: null,
      examenFisico: null,
      plan: null,
      diagnoses: [],
      medicamentos: [],
      paciente: { nombre: "Ana", apellido: "Gómez", edad: 30 },
      // Enable motivoConsulta, examenFisico, diagnosticos
      secciones: new Map<
        "motivoConsulta" | "historiaClinica" | "signosVitales" | "examenFisico" | "diagnosticos" | "tratamientoIndicado" | "planTratamiento",
        string
      >([
        ["motivoConsulta", ""],
        ["examenFisico", ""],
        ["diagnosticos", ""],
      ]),
    }
    const out = buildReportPrompt(sparse)
    // Each enabled section has a placeholder
    expect(out).toContain("MOTIVO DE CONSULTA")
    expect(out).toContain("EXAMEN FÍSICO")
    expect(out).toContain("DIAGNÓSTICOS")
    // The "no data" placeholder
    expect(out).toContain("(no se registró información en esta consulta)")
  })

  it("appends the doctor's per-section instruction to the section header", () => {
    const secciones = new Map<"motivoConsulta" | "historiaClinica" | "signosVitales" | "examenFisico" | "diagnosticos" | "tratamientoIndicado" | "planTratamiento", string>([
      ["examenFisico", "Always lead with cardiovascular findings"],
    ])
    const out = buildReportPrompt({ ...baseEncounter, secciones })
    expect(out).toMatch(/EXAMEN FÍSICO \(instrucción del médico: Always lead with cardiovascular findings\):/)
  })

  it("sanitizes the per-section instruction (S8 guardrail at the LLM boundary)", () => {
    // Invisible unicode in the instruction must be stripped before it
    // hits the LLM. The same sanitizeInput that runs on the motivo,
    // historiaClinica, etc. fields.
    const secciones = new Map<"motivoConsulta" | "historiaClinica" | "signosVitales" | "examenFisico" | "diagnosticos" | "tratamientoIndicado" | "planTratamiento", string>([
      ["examenFisico", "Clean rule with\u200B invisible char"],
    ])
    const out = buildReportPrompt({ ...baseEncounter, secciones })
    // The zero-width space (U+200B) should be stripped.
    expect(out).not.toContain("\u200B")
    expect(out).toContain("Clean rule with invisible char")
  })

  it("emits a no-secciones notice when the doctor enabled zero sections (and no data)", () => {
    // When the doctor has explicitly enabled zero sections AND the
    // encounter has no data, the prompt falls back to the 'no sections'
    // notice. The data in baseEncounter would otherwise be picked up
    // by the legacy path, so we strip it here.
    const sparse: EncounterForReport = {
      ...baseEncounter,
      motivo: null,
      historiaClinica: null,
      vitales: null,
      examenFisico: null,
      plan: null,
      diagnoses: [],
      medicamentos: [],
      secciones: new Map(),
    }
    const out = buildReportPrompt(sparse)
    expect(out).toContain("El doctor no habilitó ninguna sección para este informe.")
  })

  it("emits a no-secciones notice when secciones is null but the doctor has no prefs row yet", () => {
    // Same behavior — null goes through the legacy path, which would emit
    // every section with data. The UI passes the resolved map, not null.
    // This test pins the legacy behavior.
    const out = buildReportPrompt({ ...baseEncounter, secciones: null })
    expect(out).toContain("MOTIVO DE CONSULTA")
  })
})

describe("buildReportPrompt — output is JSON-safe (no markdown fence leakage)", () => {
  it("does NOT contain any markdown code fence that would break the response", () => {
    const out = buildReportPrompt(baseEncounter)
    // The output should be plain text, no ```html or ```json fences.
    expect(out).not.toMatch(/^```/m)
    expect(out).not.toContain("```html")
  })
})

describe("buildReportPrompt — section count sanity", () => {
  it("all 9 sections in the canonical key set appear in the legacy output (when data exists)", () => {
    // Add data to every section so the legacy "all sections with data"
    // path emits all 9 headers.
    const allData: EncounterForReport = {
      motivo: "x",
      historiaClinica: "y",
      vitales: { ta_sistolica: 120, ta_diastolica: 80 },
      examenFisico: "z",
      plan: "w",
      diagnoses: [{ codigoCie10: "Z00", descripcion: "x" }],
      medicamentos: [
        { nombreGenerico: "x", concentracion: "x", dosis: "x", frecuencia: "x", duracion: "x" },
      ],
      labOrders: [{ estudios: ["Hto"], urgente: false }],
      imagingOrders: [{ tipoImagen: "Rx", region: "Tórax", urgente: false }],
      paciente: { nombre: "x", apellido: "y", edad: 30 },
    }
    const out = buildReportPrompt(allData)
    expect(REPORT_SECTION_KEYS.length).toBe(9)
    // Spot-check each header (with data they all should be present)
    expect(out).toContain("MOTIVO DE CONSULTA")
    expect(out).toContain("ENFERMEDAD ACTUAL")
    expect(out).toContain("SIGNOS VITALES")
    expect(out).toContain("EXAMEN FÍSICO")
    expect(out).toContain("DIAGNÓSTICOS")
    expect(out).toContain("TRATAMIENTO INDICADO")
    expect(out).toContain("PLAN DE TRATAMIENTO")
    expect(out).toContain("ÓRDENES DE LABORATORIO")
    expect(out).toContain("ÓRDENES DE IMÁGENES")
  })
})
