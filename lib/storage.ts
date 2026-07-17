import { writeFile, mkdir } from "fs/promises"
import { join, resolve } from "path"

/**
 * Persistent PDF storage (signed prescriptions, informes, reposo, referidos).
 *
 * PDFs survive container rebuilds because they live under `UPLOADS_DIR`
 * which Coolify mounts as a persistent volume in production. In dev the
 * fallback path keeps the existing `public/uploads/` behaviour.
 */
function uploadsRoot(): string {
  return process.env.UPLOADS_DIR?.trim() || resolve(process.cwd(), "public", "uploads")
}

export async function uploadPdf(filename: string, buffer: Buffer): Promise<string> {
  // Caller passes a logical path like "prescriptions/<encounterId>-rx.pdf".
  const uploadsDir = join(uploadsRoot(), filename.split("/").slice(0, -1).join("/"))
  await mkdir(uploadsDir, { recursive: true })
  const filePath = join(uploadsRoot(), filename)
  await writeFile(filePath, buffer)
  // Serve via /api/uploads so Next.js' standalone build can find the file
  // at runtime. PDFs (and any binary) are listed in the route handler's
  // MIME map.
  return `/api/uploads/${filename}`
}
