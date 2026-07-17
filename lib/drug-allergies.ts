/**
 * MedSysVE — drug–allergy interaction detection.
 *
 * Levels of matching (configurable at the call site via `level`):
 *   - "exact":   medication name == allergy substance (case + accent insensitive)
 *   - "family":  drug and allergy share a pharmacologic family
 *                (e.g. "penicilina" allergy + "amoxicilina" → penicilinas family)
 *   - "synonym": commercial name reverse-lookup (e.g. allergy "amoxicilina" +
 *                commercial "Augmentin" → match)
 *
 * The dataset below is intentionally conservative: only well-established
 * cross-reactivities. For VE, the high-impact ones are penicilinas,
 * cefalosporinas (partial cross-reactivity ~1-10%), AINEs (incl. aspirina),
 * sulfas, and macrólidos. Expand carefully — false positives annoy doctors
 * and erode trust; false negatives can kill patients.
 *
 * No data is fetched from external sources. The dataset is small, static,
 * and lives next to the code that uses it.
 */

// ─── Family → drugs (canonical lowercase, no accents) ──────────────────────

export const FAMILY_TO_DRUGS: Record<string, string[]> = {
  penicilinas: [
    "penicilina",
    "penicilina g",
    "penicilina g benzatinica",
    "penicilina g sodica",
    "penicilina g procainica",
    "penicilina v",
    "amoxicilina",
    "ampicilina",
    "amoxicilina acido clavulanico",
    "ampicilina sulbactam",
    "piperacilina",
    "piperacilina tazobactam",
    // Legacy commercial-name aliases that surface in the seed catálogo.
    "bencilpenicilina",
    "bencilpenicilina sodica",
    "bencilpenicilina procainica",
    "benzatina bencilpenicilina",
    "penicilina g benzatina",
    "penicilina sodica",
    "penicilina sodica procainica",
  ],
  cefalosporinas: [
    "cefalexina",
    "cefadroxilo",
    "cefazolina",
    "cefalotina",
    "cefuroxima",
    "cefaclor",
    "cefprozil",
    "cefpodoxima",
    "cefotaxima",
    "ceftriaxona",
    "ceftazidima",
    "cefepima",
    "ceftarolina",
    "ceftolozano tazobactam",
  ],
  sulfas: [
    "sulfametoxazol",
    "trimetoprim",
    "trimetoprim sulfametoxazol",
    "sulfasalazina",
    "sulfadiazina",
    "sulfadoxina",
    "sulfacetamida",
  ],
  macrolidos: [
    "eritromicina",
    "azitromicina",
    "claritromicina",
    "roxitromicina",
    "espiramicina",
  ],
  quinolonas: [
    "acido nalidixico",
    "ciprofloxacino",
    "levofloxacino",
    "moxifloxacino",
    "norfloxacino",
    "ofloxacino",
    "gatifloxacino",
  ],
  tetraciclinas: [
    "tetraciclina",
    "oxitetraciclina",
    "doxiciclina",
    "minociclina",
    "tigeciclina",
  ],
  aminoglucosidos: [
    "gentamicina",
    "tobramicina",
    "amikacina",
    "estreptomicina",
    "neomicina",
  ],
  aines: [
    // Aspirin-style (COX-1)
    "aspirina",
    "acido acetilsalicilico",
    "aas",
    // Traditional NSAIDs
    "ibuprofeno",
    "naproxeno",
    "diclofenaco",
    "ketoprofeno",
    "ketorolaco",
    "piroxicam",
    "meloxicam",
    "indometacina",
    "sulindaco",
    "tolmetina",
    // Coxibs
    "celecoxib",
    "etoricoxib",
    "parecoxib",
  ],
  opioides: [
    "morfina",
    "codeina",
    "tramadol",
    "fentanilo",
    "oxicodona",
    "hidromorfona",
    "buprenorfina",
    "petidina",
    "meperidina",
    "metadona",
    "tapentadol",
  ],
  ieca: [
    "enalapril",
    "captopril",
    "lisinopril",
    "ramipril",
    "perindopril",
    "benazepril",
    "fosinopril",
    "trandolapril",
    "quinapril",
  ],
  araii: [
    "losartan",
    "valsartan",
    "irbesartan",
    "candesartan",
    "telmisartan",
    "olmesartan",
    "eprosartan",
  ],
  estatinas: [
    "atorvastatina",
    "simvastatina",
    "rosuvastatina",
    "lovastatina",
    "pravastatina",
    "fluvastatina",
    "pitavastatina",
  ],
  biguanidas: ["metformina"],
  sulfonilureas: [
    "glibenclamida",
    "glicazida",
    "glimepirida",
    "glipizida",
    "tolbutamida",
    "clorpropamida",
  ],
  tiazidas: [
    "hidroclorotiazida",
    "clortalidona",
    "indapamida",
    "metolazona",
    "bendroflumetiazida",
  ],
  betabloqueantes: [
    "propranolol",
    "atenolol",
    "metoprolol",
    "bisoprolol",
    "carvedilol",
    "nebivolol",
    "labetalol",
    "nadolol",
    "pindolol",
  ],
  anticoagulantes_cumarínicos: ["warfarina", "acenocumarol"],
  anticoagulantes_directos: [
    "dabigatran",
    "rivaroxaban",
    "apixaban",
    "edoxaban",
  ],
  antitrombocitarios: [
    "clopidogrel",
    "ticagrelor",
    "prasugrel",
    "ticlopidina",
    "dipiridamol",
  ],
  corticoides: [
    "prednisona",
    "prednisolona",
    "dexametasona",
    "betametasona",
    "metilprednisolona",
    "hidrocortisona",
    "triamcinolona",
    "deflazacort",
    "budesonida",
  ],
  antihistaminicos_h1: [
    "difenhidramina",
    "loratadina",
    "cetirizina",
    "fexofenadina",
    "desloratadina",
    "clorfeniramina",
    "hidroxicina",
    "cinarizina",
    "mizolastina",
    "levocetirizina",
  ],
  antidepresivos_triciclicos: [
    "amitriptilina",
    "nortriptilina",
    "imipramina",
    "clomipramina",
    "desipramina",
    "doxepina",
  ],
  isrs: [
    "fluoxetina",
    "sertralina",
    "paroxetina",
    "citalopram",
    "escitalopram",
    "fluvoxamina",
  ],
  irsn: ["venlafaxina", "desvenlafaxina", "duloxetina", "milnacipran"],
  benzodiazepinas: [
    "diazepam",
    "lorazepam",
    "alprazolam",
    "clonazepam",
    "midazolam",
    "temazepam",
    "nitrazepam",
    "flunitrazepam",
    "bromazepam",
    "clobazam",
  ],
  anticonvulsivantes: [
    "carbamazepina",
    "fenitoina",
    "acido valproico",
    "valproato",
    "lamotrigina",
    "levetiracetam",
    "topiramato",
    "gabapentina",
    "pregabalina",
    "fenobarbital",
  ],
  antipaludicos: [
    "cloroquina",
    "hidroxicloroquina",
    "mefloquina",
    "quinina",
    "primaquina",
    "artemeter",
    "artesunato",
  ],
  antihelminticos: [
    "albendazol",
    "mebendazol",
    "ivermectina",
    "praziquantel",
    "nitazoxanida",
  ],
  antifungicos_azoles: [
    "fluconazol",
    "itraconazol",
    "ketoconazol",
    "voriconazol",
    "posaconazol",
  ],
  antituberculosos: [
    "isoniazida",
    "rifampicina",
    "rifabutina",
    "pirazinamida",
    "etambutol",
    // estreptomicina is an aminoglucosido; listed there for allergy
    // purposes. Cross-reactivity is via the aminoglucosido family, not
    // a "TB drug" family. Real-world strep allergy patients react to
    // other aminoglucosidos (gentamicin, tobramycin) too.
  ],
  antirretrovirales_nrti: [
    "zidovudina",
    "lamivudina",
    "tenofovir",
    "emtricitabina",
    "abacavir",
    "didanosina",
    "estavudina",
  ],
  antirretrovirales_nnrti: [
    "efavirenz",
    "nevirapina",
    "rilpivirina",
    "etravirina",
    "doravirina",
  ],
  antirretrovirales_pi: [
    "lopinavir",
    "ritonavir",
    "atazanavir",
    "darunavir",
    "saquinavir",
  ],
  anticonceptivos_hormonales: [
    "etinilestradiol",
    "levonorgestrel",
    "medroxiprogesterona",
    "noretisterona",
    "desogestrel",
    "drospirenona",
    "etonogestrel",
  ],
  medios_contraste_yodados: [
    "iohexol",
    "iopamidol",
    "ioversol",
    "iomeprol",
    "amidotrizoato",
  ],
  medios_contraste_gadolinio: [
    "gadobutrol",
    "gadoteridol",
    "gadodiamida",
    "gadoversetamida",
  ],
  // Paracetamol / acetaminophen is intentionally NOT in aines. It is not
  // an NSAID and does not share the classic COX-1–mediated allergy risk.
  // It is metabolized via CYP2E1 and liver toxicity is a separate concern.
  // Codeine/tramadol/oxycodone are listed under opioides for the same reason
  // (some patients confuse morphine allergy with codeine — that's correct).
};

// ─── Reverse index: drug → family (built once) ─────────────────────────────

export const DRUG_TO_FAMILY: Readonly<Record<string, string>> = Object.freeze(
  (() => {
    const out: Record<string, string> = {}
    for (const [family, drugs] of Object.entries(FAMILY_TO_DRUGS)) {
      for (const drug of drugs) {
        // If a drug is listed in two families, last write wins. This shouldn't
        // happen with the current dataset; if it does, surface a warning in CI.
        if (out[drug] && out[drug] !== family) {
          // eslint-disable-next-line no-console
          console.warn(
            `[drug-allergies] drug "${drug}" appears in both "${out[drug]}" and "${family}"; last wins`,
          )
        }
        out[drug] = family
      }
    }
    return out
  })(),
)

// ─── Normalization helpers ─────────────────────────────────────────────────

/** Lowercase, trim, strip accents, collapse spaces, drop punctuation. */
export function normalizeDrugName(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/[.,;:()\[\]/\\+]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Try a few obvious synonyms a doctor might use:
 * "aas" ↔ "acido acetilsalicilico" ↔ "aspirina"
 * "amoxi clav" / "amoxiclav" ↔ "amoxicilina acido clavulanico"
 *
 * Returns a list of normalized candidate names to look up. The list starts
 * with the input, then expands with known aliases. This is intentionally
 * short — we only add aliases that have been seen in the MedSysVE
 * medications-ve seed or reported by doctors.
 */
const ALIASES: Record<string, string[]> = {
  aas: ["acido acetilsalicilico", "aspirina"],
  aspirina: ["acido acetilsalicilico", "aas"],
  "acido acetilsalicilico": ["aspirina", "aas"],
  amoxiclav: ["amoxicilina acido clavulanico"],
  "amoxi clav": ["amoxicilina acido clavulanico"],
  "amoxicilina clavulanico": ["amoxicilina acido clavulanico"],
  "amoxicilina acido clavulanico": ["amoxicilina clavulanico", "amoxiclav"],
  "ampi sulbactam": ["ampicilina sulbactam"],
  "pip tazo": ["piperacilina tazobactam"],
  "tmp smx": ["trimetoprim sulfametoxazol"],
  cotrimoxazol: ["trimetoprim sulfametoxazol"],
  bactrim: ["trimetoprim sulfametoxazol"],
  septra: ["trimetoprim sulfametoxazol"],
}

export function expandAliases(normalized: string): string[] {
  const out = new Set<string>([normalized])
  for (const [key, values] of Object.entries(ALIASES)) {
    if (normalizeDrugName(key) === normalized) {
      for (const v of values) out.add(normalizeDrugName(v))
    }
  }
  return [...out]
}

// ─── Types ─────────────────────────────────────────────────────────────────

export type AllergyGravedad = "LEVE" | "MODERADA" | "SEVERA"

export interface DrugAllergy {
  sustancia: string
  reaccion?: string | null
  gravedad?: AllergyGravedad | null
  activa?: boolean
}

export interface MedicationForCheck {
  nombreGenerico: string
  nombresComerciales?: readonly string[] | null
}

export type AllergyMatchType = "exact" | "family" | "synonym"

export interface AllergyMatch {
  /** The allergy row that triggered the match (as supplied by caller). */
  allergy: DrugAllergy
  /** The medication token that matched. Useful for UI display. */
  matchedDrug: string
  /** Which token of the medication matched. */
  matchedOn: "nombreGenerico" | "nombreComercial"
  matchType: AllergyMatchType
  /** When matchType === "family", which family both sides share. */
  family?: string
  /** Severity inherited from the allergy record. */
  severity: AllergyGravedad
  /** Human-readable warning, ready to display. */
  warning: string
}

// ─── Core check ────────────────────────────────────────────────────────────

/**
 * Build the AllergyMatch payload for a family-level hit. Centralised so the
 * direct-lookup path and the token-fallback path produce identical warning
 * copy / severity mapping. Pass `tokensHit` to annotate the warning with
 * which sub-tokens triggered the fallback match (e.g. for composite products
 * like "Penicilina G Benzatina G Sodica G Procaina").
 */
function makeFamilyMatch(
  medication: MedicationForCheck,
  allergy: DrugAllergy,
  matchedDrug: string,
  family: string,
  severity: AllergyGravedad,
  tokensHit?: string[],
): AllergyMatch {
  const tokenNote = tokensHit && tokensHit.length > 0
    ? ` (componentes: ${tokensHit.slice(0, 3).join(", ")})`
    : ""
  return {
    allergy,
    matchedDrug,
    matchedOn: matchedDrug === normalizeDrugName(medication.nombreGenerico) ? "nombreGenerico" : "nombreComercial",
    matchType: "family",
    family,
    severity,
    warning:
      severity === "SEVERA"
        ? `CONTRAINDICADO: alergia SEVERA a "${allergy.sustancia}" (familia ${family}). ${medication.nombreGenerico} es de la misma familia${tokenNote}.`
        : severity === "MODERADA"
          ? `Precaución: alergia MODERADA a "${allergy.sustancia}" (familia ${family}). ${medication.nombreGenerico} es de la misma familia${tokenNote}.`
          : `Alergia LEVE a "${allergy.sustancia}" (familia ${family}). ${medication.nombreGenerico} es de la misma familia${tokenNote}.`,
  }
}

/**
 * Check whether a medication would trigger any of the patient's active
 * allergies. Returns the FIRST match (most specific first by level) or null.
 *
 * Iteration order across allergies is the caller's order. Within one allergy,
 * we try exact → synonym → family. We do NOT short-circuit by severity;
 * the doctor sees every match and decides.
 */
export function checkAllergyConflict(
  medication: MedicationForCheck,
  allergies: readonly DrugAllergy[],
  options: { level?: "exact" | "family" | "synonym" } = {},
): AllergyMatch | null {
  const level = options.level ?? "synonym"

  const normalizedGeneric = normalizeDrugName(medication.nombreGenerico)
  const commercialNames = (medication.nombresComerciales ?? [])
    .map((c) => normalizeDrugName(c))
    .filter((c) => c.length > 0)
  const allMedTokens = [normalizedGeneric, ...commercialNames].filter((t) => t.length > 0)
  if (allMedTokens.length === 0) return null

  for (const allergy of allergies) {
    if (allergy.activa === false) continue
    const allergyNorm = normalizeDrugName(allergy.sustancia)
    if (!allergyNorm) continue
    const severity: AllergyGravedad = allergy.gravedad ?? "LEVE"

    // ── 1. Exact match (incl. aliases) ──────────────────────────────────
    for (const token of allMedTokens) {
      const candidates = expandAliases(token)
      if (candidates.includes(allergyNorm)) {
        return {
          allergy,
          matchedDrug: token,
          matchedOn: token === normalizedGeneric ? "nombreGenerico" : "nombreComercial",
          matchType: "exact",
          severity,
          warning:
            severity === "SEVERA"
              ? `CONTRAINDICADO: alergia SEVERA registrada a "${allergy.sustancia}". No se debe prescribir ${medication.nombreGenerico}.`
              : severity === "MODERADA"
                ? `Precaución: alergia MODERADA registrada a "${allergy.sustancia}". Reacción previa: ${allergy.reaccion ?? "(no especificada)"}.`
                : `Alergia LEVE registrada a "${allergy.sustancia}". Reacción: ${allergy.reaccion ?? "(no especificada)"}.`,
        }
      }
    }

    // ── 2. Synonym match: allergy is the family name ────────────────────
    if (level === "synonym" || level === "family") {
      const drugsInAllergyFamily = FAMILY_TO_DRUGS[allergyNorm]
      if (drugsInAllergyFamily) {
        for (const token of allMedTokens) {
          const candidates = expandAliases(token)
          if (candidates.some((c) => drugsInAllergyFamily.includes(c))) {
            return {
              allergy,
              matchedDrug: token,
              matchedOn: token === normalizedGeneric ? "nombreGenerico" : "nombreComercial",
              matchType: "synonym",
              family: allergyNorm,
              severity,
              warning:
                severity === "SEVERA"
                  ? `CONTRAINDICADO: alergia SEVERA a la familia "${allergy.sustancia}" — ${medication.nombreGenerico} pertenece a esta familia. No se debe prescribir.`
                  : severity === "MODERADA"
                    ? `Precaución: alergia MODERADA a la familia "${allergy.sustancia}" — ${medication.nombreGenerico} pertenece a esta familia.`
                    : `Alergia LEVE a la familia "${allergy.sustancia}" — ${medication.nombreGenerico} pertenece a esta familia.`,
            }
          }
        }
      }
    }

    // ── 3. Family match: both share a family via DRUG_TO_FAMILY ─────────
    if (level === "synonym" || level === "family") {
      // The allergy might be a single drug (e.g. "penicilina"); check the
      // family of the drug. If the medication is in that same family,
      // that's a family-level match.
      const allergyFamily = DRUG_TO_FAMILY[allergyNorm]
      if (allergyFamily) {
        // First try: direct lookup (works for canonical names like
        // "amoxicilina" that are in DRUG_TO_FAMILY verbatim).
        for (const token of allMedTokens) {
          const medFamily = DRUG_TO_FAMILY[token]
          if (medFamily && medFamily === allergyFamily) {
            return makeFamilyMatch(medication, allergy, token, allergyFamily, severity)
          }
        }
        // Fallback: token-based family detection for composite
        // product names that aren't listed in DRUG_TO_FAMILY.
        // Example: "Penicilina G Benzatina G Sodica G Procaina" is a
        // classic triple combo — neither the combo nor its full
        // name is in DRUG_TO_FAMILY, but "penicilina" IS. Split
        // the medication name into ≥4-char tokens and check each
        // one against the family membership. A single hit is enough
        // because the family list is already conservative (only
        // canonical names land there) and the token would have to
        // match exactly to count.
        const allergyFamilyDrugs = FAMILY_TO_DRUGS[allergyFamily] ?? []
        const allergyFamilyNorm = new Set(allergyFamilyDrugs.map((d) => normalizeDrugName(d)))
        for (const token of allMedTokens) {
          if (allergyFamilyNorm.has(token)) continue
          const subTokens = token.split(/\s+/).filter((t) => t.length >= 4)
          const hits = subTokens.filter((t) => allergyFamilyNorm.has(t))
          if (hits.length >= 1) {
            return makeFamilyMatch(medication, allergy, token, allergyFamily, severity, hits)
          }
        }
      }
    }
  }

  return null
}

/**
 * Returns ALL matches, not just the first. Useful for displaying every
 * conflicting allergy in the UI (so the doctor can see "patient is
 * allergic to BOTH amoxicilina AND aspirina" at once).
 */
export function checkAllergyConflicts(
  medication: MedicationForCheck,
  allergies: readonly DrugAllergy[],
  options: { level?: "exact" | "family" | "synonym" } = {},
): AllergyMatch[] {
  const out: AllergyMatch[] = []
  const seen = new Set<string>()
  for (const allergy of allergies) {
    const m = checkAllergyConflict(medication, [allergy], options)
    if (!m) continue
    // Dedupe by normalized sustancia + matchType. Without the
    // normalization step, "amoxicilina" and "Amoxicilina" would be treated
    // as distinct, which is wrong.
    const key = `${normalizeDrugName(m.allergy.sustancia)}|${m.matchType}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(m)
  }
  return out
}
