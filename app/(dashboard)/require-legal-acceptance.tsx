import { db } from "@/lib/db"
import { loadAllLegalDocs } from "@/lib/legal/load-legal"
import { LegalAcceptanceGate } from "./legal-acceptance-gate"

/**
 * Server-side check: if the current doctor hasn't accepted the latest legal
 * version, render the blocking acceptance gate instead of the children.
 *
 * Used by /app/(dashboard)/layout.tsx to enforce LOPDP Art. 25 — explicit
 * consent is required BEFORE the doctor can use the system.
 *
 * Returns the wrapped children if the doctor is up-to-date, or a blocking
 * gate if they need to re-accept.
 */
export async function requireLegalAcceptance(opts: {
  doctorId: string
  workspaceId: string
  currentLegalVersion: string | null
  children: React.ReactNode
}): Promise<React.ReactNode> {
  const { doctorId, workspaceId, currentLegalVersion, children } = opts

  // Fetch latest published versions
  const latestDocs = await loadAllLegalDocs()
  const latestBySlug = new Map(latestDocs.map((d) => [d.slug, d]))
  const currentSignature = latestDocs
    .map((d) => `${d.slug}@${d.version}`)
    .sort()
    .join(";")

  // Pending grandfather states:
  //   - NULL: brand new doctor, never accepted anything
  //   - "pre-1.0.0-pending-reacceptance": grandfathered existing doctor
  //   - any value that doesn't match currentSignature: legal docs changed
  const isPending =
    currentLegalVersion === null ||
    currentLegalVersion.startsWith("pre-") ||
    currentLegalVersion !== currentSignature

  if (!isPending) {
    return children
  }

  // Fetch LegalVersion rows from DB (for the accept mutation's FK)
  const dbVersions = await db.legalVersion.findMany({
    orderBy: { effectiveAt: "desc" },
  })
  const versionIdsBySlug = new Map(dbVersions.map((v) => [v.slug, v.id]))

  // Read legal content (markdown)
  const fs = await import("fs/promises")
  const path = await import("path")
  const docsForRender: Array<{
    slug: string
    version: string
    title: string
    effectiveAt: Date
    required: boolean
    legalVersionId: string | null
    content: string
  }> = []

  for (const slug of ["terminos", "privacidad", "cookies", "lopdp-consentimiento"] as const) {
    const latest = latestBySlug.get(slug)
    if (!latest) continue
    const filePath = path.join(process.cwd(), "content", "legal", `${slug}.md`)
    let content = ""
    try {
      content = await fs.readFile(filePath, "utf8")
    } catch {
      content = `_(no se pudo cargar ${slug}.md — verificar con el administrador)_`
    }
    docsForRender.push({
      slug,
      version: latest.version,
      title: latest.title,
      effectiveAt: latest.effectiveAt,
      required: slug !== "cookies", // cookies is optional
      legalVersionId: versionIdsBySlug.get(slug) ?? null,
      content,
    })
  }

  return (
    <LegalAcceptanceGate
      doctorId={doctorId}
      workspaceId={workspaceId}
      docs={docsForRender}
    />
  )
}