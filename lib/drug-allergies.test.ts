import { describe, it, expect } from "vitest"
import {
  normalizeDrugName,
  expandAliases,
  checkAllergyConflict,
  checkAllergyConflicts,
  DRUG_TO_FAMILY,
  FAMILY_TO_DRUGS,
  type DrugAllergy,
  type MedicationForCheck,
} from "./drug-allergies"

// ─── Normalization ─────────────────────────────────────────────────────────

describe("normalizeDrugName", () => {
  it("lowercases and trims", () => {
    expect(normalizeDrugName("  AMOXICILINA  ")).toBe("amoxicilina")
  })
  it("strips accents", () => {
    expect(normalizeDrugName("Amoxicilina")).toBe("amoxicilina")
    expect(normalizeDrugName("Acetilsalicílico")).toBe("acetilsalicilico")
    expect(normalizeDrugName("Hierro")).toBe("hierro")
  })
  it("collapses punctuation to spaces", () => {
    expect(normalizeDrugName("Amoxicilina + Acido Clavulánico")).toBe(
      "amoxicilina acido clavulanico",
    )
  })
  it("collapses multiple spaces", () => {
    expect(normalizeDrugName("trimetoprim   sulfametoxazol")).toBe(
      "trimetoprim sulfametoxazol",
    )
  })
})

describe("expandAliases", () => {
  it("expands aas to aspirina equivalents", () => {
    const out = expandAliases("aas")
    expect(out).toContain("aas")
    expect(out).toContain("acido acetilsalicilico")
    expect(out).toContain("aspirina")
  })
  it("returns just the input when no aliases", () => {
    expect(expandAliases("metformina")).toEqual(["metformina"])
  })
})

// ─── Reverse index sanity ──────────────────────────────────────────────────

describe("DRUG_TO_FAMILY index", () => {
  it("is consistent with FAMILY_TO_DRUGS", () => {
    // Every drug in FAMILY_TO_DRUGS must round-trip back to its family.
    for (const [family, drugs] of Object.entries(FAMILY_TO_DRUGS)) {
      for (const drug of drugs) {
        const normalized = drug // already lowercase
        expect(DRUG_TO_FAMILY[normalized]).toBe(family)
      }
    }
  })
  it("covers the high-traffic families used in MedSysVE", () => {
    // These are the families Carlos cares about most (per request):
    expect(DRUG_TO_FAMILY["amoxicilina"]).toBe("penicilinas")
    expect(DRUG_TO_FAMILY["ampicilina"]).toBe("penicilinas")
    expect(DRUG_TO_FAMILY["penicilina"]).toBe("penicilinas")
    expect(DRUG_TO_FAMILY["cefalexina"]).toBe("cefalosporinas")
    expect(DRUG_TO_FAMILY["ceftriaxona"]).toBe("cefalosporinas")
    expect(DRUG_TO_FAMILY["ibuprofeno"]).toBe("aines")
    expect(DRUG_TO_FAMILY["aspirina"]).toBe("aines")
    expect(DRUG_TO_FAMILY["acido acetilsalicilico"]).toBe("aines")
    expect(DRUG_TO_FAMILY["trimetoprim sulfametoxazol"]).toBe("sulfas")
    expect(DRUG_TO_FAMILY["azitromicina"]).toBe("macrolidos")
    expect(DRUG_TO_FAMILY["ciprofloxacino"]).toBe("quinolonas")
  })
})

// ─── checkAllergyConflict ──────────────────────────────────────────────────

const al = (sustancia: string, gravedad: DrugAllergy["gravedad"] = "MODERADA"): DrugAllergy => ({
  sustancia,
  gravedad,
  activa: true,
})

const med = (nombreGenerico: string, nombresComerciales: string[] = []): MedicationForCheck => ({
  nombreGenerico,
  nombresComerciales,
})

describe("checkAllergyConflict — exact match", () => {
  it("matches generic name (case + accent insensitive)", () => {
    const m = checkAllergyConflict(med("Amoxicilina"), [al("AMOXICILINA", "SEVERA")])
    expect(m).not.toBeNull()
    expect(m?.matchType).toBe("exact")
    expect(m?.severity).toBe("SEVERA")
    expect(m?.warning).toMatch(/CONTRAINDICADO/)
  })

  it("matches a commercial name when present", () => {
    const m = checkAllergyConflict(
      med("Ibuprofeno", ["Advil", "Motrin"]),
      [al("advil")],
    )
    expect(m).not.toBeNull()
    expect(m?.matchType).toBe("exact")
    expect(m?.matchedOn).toBe("nombreComercial")
  })

  it("returns null when no overlap", () => {
    const m = checkAllergyConflict(med("Metformina"), [al("penicilina")])
    expect(m).toBeNull()
  })

  it("ignores inactive allergies", () => {
    const inactive: DrugAllergy = { sustancia: "amoxicilina", gravedad: "SEVERA", activa: false }
    const m = checkAllergyConflict(med("amoxicilina"), [inactive])
    expect(m).toBeNull()
  })

  it("respects aliases (aas ↔ aspirina)", () => {
    const m = checkAllergyConflict(med("Aspirina"), [al("aas")])
    expect(m).not.toBeNull()
    expect(m?.matchType).toBe("exact")
  })
})

describe("checkAllergyConflict — family match (level=synonym)", () => {
  it("amoxicilina matches alergia to penicilina (same family)", () => {
    const m = checkAllergyConflict(med("Amoxicilina"), [al("penicilina", "SEVERA")])
    expect(m).not.toBeNull()
    expect(m?.matchType).toBe("family")
    expect(m?.family).toBe("penicilinas")
    expect(m?.warning).toMatch(/CONTRAINDICADO/)
  })

  it("ceftriaxona does NOT match alergia to penicilina (no modeled cross-reactivity)", () => {
    // We do NOT model cephalosporin ↔ penicillin cross-reactivity as a
    // blanket rule. Real-world cross-reactivity is ~1-10% and depends on
    // side chain similarity, not the family. A future PR can add a
    // CROSS_REACTIVE_FAMILIES table; for now, ceftriaxona + penicilina
    // allergy is a soft signal that the doctor can override.
    const m = checkAllergyConflict(med("Ceftriaxona"), [al("penicilina", "MODERADA")])
    expect(m).toBeNull()
  })

  it("ibuprofeno matches alergia to AINEs (family used as allergy name)", () => {
    const m = checkAllergyConflict(med("Ibuprofeno"), [al("AINEs", "MODERADA")])
    expect(m).not.toBeNull()
    expect(m?.matchType).toBe("synonym")
    expect(m?.family).toBe("aines")
  })

  it("aspirina matches alergia to AINEs", () => {
    const m = checkAllergyConflict(med("Aspirina"), [al("aines")])
    expect(m).not.toBeNull()
    expect(m?.matchType).toBe("synonym")
  })

  it("paracetamol does NOT match alergia to AINEs (paracetamol is not an NSAID)", () => {
    const m = checkAllergyConflict(med("Paracetamol"), [al("aines")])
    expect(m).toBeNull()
  })

  it("amoxicilina does NOT match alergia to AINEs (different family)", () => {
    const m = checkAllergyConflict(med("Amoxicilina"), [al("aines")])
    expect(m).toBeNull()
  })

  it("azitromicina matches alergia to eritromicina (macrólidos)", () => {
    const m = checkAllergyConflict(med("Azitromicina"), [al("eritromicina", "LEVE")])
    expect(m).not.toBeNull()
    expect(m?.matchType).toBe("family")
    expect(m?.family).toBe("macrolidos")
  })

  it("trimetoprim sulfametoxazol matches alergia to sulfametoxazol", () => {
    const m = checkAllergyConflict(med("Trimetoprim Sulfametoxazol"), [al("sulfametoxazol")])
    expect(m).not.toBeNull()
    expect(m?.matchType).toBe("family")
    expect(m?.family).toBe("sulfas")
  })

  it("bactrim (commercial) matches alergia to trimetoprim sulfametoxazol via alias", () => {
    const m = checkAllergyConflict(med("Bactrim"), [al("trimetoprim sulfametoxazol")])
    // 'bactrim' is not in the medication shape here, but in production the
    // nombreComerciales list of the medication row would have it. We use it
    // as the generic name to exercise the alias path.
    // Bactrim normalizes to itself; via the alias map it expands to
    // "trimetoprim sulfametoxazol", which equals the allergy (normalized).
    // So this is an EXACT match (after alias expansion), not family.
    expect(m).not.toBeNull()
    expect(m?.matchType).toBe("exact")
  })
})

describe("checkAllergyConflict — level filter", () => {
  it("level=exact only returns exact matches, never family", () => {
    const m = checkAllergyConflict(med("Amoxicilina"), [al("penicilina", "MODERADA")], {
      level: "exact",
    })
    expect(m).toBeNull()
  })

  it("level=family returns family matches but also synonym", () => {
    const m = checkAllergyConflict(med("Amoxicilina"), [al("penicilina")], { level: "family" })
    expect(m).not.toBeNull()
  })
})

describe("checkAllergyConflict — severity formatting", () => {
  it("SEVERA → CONTRAINDICADO in warning", () => {
    const m = checkAllergyConflict(med("amoxicilina"), [al("amoxicilina", "SEVERA")])
    expect(m?.warning).toMatch(/CONTRAINDICADO/)
  })
  it("MODERADA → Precaución in warning", () => {
    const m = checkAllergyConflict(med("amoxicilina"), [al("amoxicilina", "MODERADA")])
    expect(m?.warning).toMatch(/Precaución/)
  })
  it("LEVE → 'Alergia LEVE' in warning", () => {
    const m = checkAllergyConflict(med("amoxicilina"), [al("amoxicilina", "LEVE")])
    expect(m?.warning).toMatch(/Alergia LEVE/)
  })
  it("default severity when none provided is LEVE (matches Prisma @default(LEVE))", () => {
    const m = checkAllergyConflict(med("amoxicilina"), [{ sustancia: "amoxicilina", activa: true }])
    expect(m?.severity).toBe("LEVE")
  })
})

// ─── Composite penicilina names ───────────────────────────────────────────
// Bug 2026-07-15: the seed catálogo has composite names like
// "Penicilina G Benzatina G Sodica G Procaina" (the classic triple combo).
// The family `penicilinas` only had "penicilina" + "penicilina g" in it, so
// `DRUG_TO_FAMILY[name]` returned null and the family match never fired.
// Carlos pointed out that an allergy to "Penicilina" MUST block a triple
// combo prescription. These tests pin the token-based fallback that
// detects "penicilina" inside "penicilina g benzatina g sodica g procaina".

describe("checkAllergyConflict — composite penicilina names", () => {
  it("blocks Penicilina G Benzatina (combo) when allergy is Penicilina", () => {
    const m = checkAllergyConflict(
      med("Penicilina G Benzatina G Sodica G Procaina"),
      [al("Penicilina", "MODERADA")],
    )
    expect(m).not.toBeNull()
    expect(m?.matchType).toBe("family")
    expect(m?.family).toBe("penicilinas")
  })
  it("blocks Amoxicilina + Acido Clavulanico (combo) when allergy is Penicilina", () => {
    const m = checkAllergyConflict(
      med("Amoxicilina + Acido Clavulanico"),
      [al("penicilina", "SEVERA")],
    )
    expect(m).not.toBeNull()
    expect(m?.severity).toBe("SEVERA")
  })
  it("does NOT block unrelated drug (e.g. paracetamol) when allergy is Penicilina", () => {
    const m = checkAllergyConflict(med("Paracetamol 500 mg"), [al("penicilina")])
    expect(m).toBeNull()
  })
})

describe("checkAllergyConflicts — multi-allergy", () => {
  it("returns the single applicable match for amoxicilina (penicilina family)", () => {
    const allergies = [
      al("penicilina", "SEVERA"),
      al("aines", "MODERADA"),
      al("trimetoprim", "LEVE"),
    ]
    const out = checkAllergyConflicts(med("Amoxicilina"), allergies)
    // Only penicilina allergy applies (amoxi is in penicilinas family,
    // AINEs and trimetoprim don't match amoxicilina).
    expect(out).toHaveLength(1)
    expect(out[0].family).toBe("penicilinas")
  })

  it("returns multiple matches for a drug that hits multiple families", () => {
    // Trimetoprim sulfametoxazol hits both 'sulfas' (family) and any
    // specific allergy to its components. Patient is allergic to sulfa
    // and to TMP — both should fire.
    const allergies = [al("sulfas", "SEVERA"), al("trimetoprim", "LEVE")]
    const out = checkAllergyConflicts(med("Trimetoprim Sulfametoxazol"), allergies)
    expect(out.length).toBeGreaterThanOrEqual(2)
  })

  it("deduplicates same allergy after normalize (amoxicilina ≡ Amoxicilina)", () => {
    const allergies = [al("amoxicilina", "MODERADA"), al("Amoxicilina", "MODERADA")]
    const out = checkAllergyConflicts(med("amoxicilina"), allergies)
    expect(out).toHaveLength(1)
  })
})
