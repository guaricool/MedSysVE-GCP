import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join, resolve } from "path"
import { auth } from "@/lib/auth"

/**
 * Persist logo uploads outside the Next.js build output.
 *
 * Why not just `public/uploads/`?
 *   Next.js `output: "standalone"` only serves files from `public/` that
 *   existed at BUILD time. Uploads written at runtime silently 404.
 *   The companion route `app/api/uploads/[...path]/route.ts` reads from
 *   the same directory this writes to — so the upload→display path stays
 *   consistent across dev (where UPLOADS_DIR falls back to public/uploads)
 *   and prod (where Coolify mounts /data/uploads as a persistent volume).
 *
 * Mount point on the VPS:
 *   /etc/coolify/compose/<service>.yaml mounts the host's
 *   /data/coolify/<service>/uploads → /data/uploads inside the container.
 *   Set UPLOADS_DIR=/data/uploads in the service's env vars.
 */

const ALLOWED = ["image/jpeg", "image/jpg", "image/png", "image/webp"]

function uploadsRoot(): string {
  return process.env.UPLOADS_DIR?.trim() || resolve(process.cwd(), "public", "uploads")
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== "DOCTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 })
  }

  const file = form.get("file") as File | null
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 })

  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: "Tipo no soportado. Use JPG, PNG o WebP." }, { status: 400 })
  }
  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: "El archivo no puede superar 2 MB." }, { status: 400 })
  }

  const ext = file.type.includes("png") ? "png" : "jpg"
  const wsId = session.user.workspaceId ?? "logo"
  // Timestamp in milliseconds + 6-char random suffix so two simultaneous
  // uploads from the same workspace can't collide on filename.
  const suffix = Math.random().toString(36).slice(2, 8)
  const filename = `${wsId}-${Date.now()}-${suffix}.${ext}`
  const dir = join(uploadsRoot(), "logos")
  await mkdir(dir, { recursive: true })
  const bytes = await file.arrayBuffer()
  await writeFile(join(dir, filename), Buffer.from(bytes))

  // Return a URL that goes through our persistent-files handler instead
  // of Next.js' static middleware (which can't see runtime uploads in
  // standalone mode).
  return NextResponse.json({ url: `/api/uploads/logos/${filename}` })
}
