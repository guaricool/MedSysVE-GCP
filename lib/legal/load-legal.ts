import { readFile } from "fs/promises"
import { join } from "path"
import { createHash } from "crypto"

export type LegalSlug = "terminos" | "privacidad" | "cookies" | "lopdp-consentimiento"

const FILE_MAP: Record<LegalSlug, string> = {
  "terminos": "terminos.md",
  "privacidad": "privacidad.md",
  "cookies": "cookies.md",
  "lopdp-consentimiento": "lopdp-consentimiento.md",
}

interface LegalDocMeta {
  slug: LegalSlug
  version: string
  title: string
  contentHash: string
  effectiveAt: Date
}

/**
 * Read a legal doc from disk and extract its version metadata from the
 * front-matter. The first lines of each .md file are expected to look like:
 *
 *   # <title>
 *
 *   > **AVISO IMPORTANTE — NO ES ASESORÍA LEGAL**
 *   > ...
 *   > Versión del documento: 1.0.0 — vigente desde el 1 de julio de 2026.
 *
 * We parse the version + effective date from that pattern.
 */
export async function loadLegalDoc(slug: LegalSlug): Promise<{ meta: LegalDocMeta; source: string }> {
  const path = join(process.cwd(), "content", "legal", FILE_MAP[slug])
  const source = await readFile(path, "utf8")

  const versionMatch = /Versión del documento:\s*([\d.]+)/i.exec(source)
  const dateMatch = /vigente desde el (\d{1,2} de [a-zéúíóáñ]+ de \d{4})/i.exec(source)

  const version = versionMatch?.[1] ?? "0.0.0"
  const effectiveAt = dateMatch?.[1] ? parseSpanishDate(dateMatch[1]) : new Date("1970-01-01")

  const titleMatch = /^#\s+(.+)$/m.exec(source)
  const title = titleMatch?.[1]?.trim() ?? slug

  const contentHash = createHash("sha256").update(source).digest("hex")

  return {
    meta: { slug, version, title, contentHash, effectiveAt },
    source,
  }
}

const SPANISH_MONTHS: Record<string, number> = {
  enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
  julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11,
}

function parseSpanishDate(s: string): Date {
  // "1 de julio de 2026"
  const m = /(\d{1,2})\s+de\s+([a-zéúíóáñ]+)\s+de\s+(\d{4})/i.exec(s)
  if (!m) return new Date("1970-01-01")
  const day = parseInt(m[1], 10)
  const month = SPANISH_MONTHS[m[2].toLowerCase()] ?? 0
  const year = parseInt(m[3], 10)
  return new Date(Date.UTC(year, month, day))
}

/**
 * Return the metadata for every published legal document.
 * Order matches the consent flow: terminos → privacidad → cookies → lopdp.
 */
export async function loadAllLegalDocs(): Promise<LegalDocMeta[]> {
  const slugs: LegalSlug[] = ["terminos", "privacidad", "cookies", "lopdp-consentimiento"]
  const out: LegalDocMeta[] = []
  for (const s of slugs) {
    try {
      const { meta } = await loadLegalDoc(s)
      out.push(meta)
    } catch {
      // skip on error
    }
  }
  return out
}