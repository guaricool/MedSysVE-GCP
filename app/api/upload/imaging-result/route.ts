import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import path, { resolve } from "path"

/**
 * Persist imaging-result uploads outside the Next.js build output.
 * See app/api/upload/logo/route.ts for the full rationale.
 */
function uploadsRoot(): string {
  return process.env.UPLOADS_DIR?.trim() || resolve(process.cwd(), "public", "uploads")
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  const imagingOrderId = formData.get("imagingOrderId") as string | null

  if (!file || !imagingOrderId) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 })
  }

  const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp"]
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: "Tipo de archivo no permitido" }, { status: 415 })
  }

  const maxBytes = 10 * 1024 * 1024
  if (file.size > maxBytes) {
    return NextResponse.json({ error: "Archivo demasiado grande (máx 10 MB)" }, { status: 413 })
  }

  const ext = file.name.split(".").pop() ?? "bin"
  const suffix = Math.random().toString(36).slice(2, 8)
  const filename = `${imagingOrderId}-result-${suffix}.${ext}`
  const dir = path.join(uploadsRoot(), "imaging-results")
  await mkdir(dir, { recursive: true })
  const filePath = path.join(dir, filename)

  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(filePath, buffer)

  const url = `/api/uploads/imaging-results/${filename}`
  return NextResponse.json({ url })
}
