import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join, resolve } from "path"
import { auth } from "@/lib/auth"

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
  // Sello belongs to Doctor, so we use doctorId (session.user.doctorId) instead of workspaceId
  const docId = session.user.doctorId ?? "sello"
  
  const suffix = Math.random().toString(36).slice(2, 8)
  const filename = `${docId}-${Date.now()}-${suffix}.${ext}`
  const dir = join(uploadsRoot(), "sellos")
  await mkdir(dir, { recursive: true })
  const bytes = await file.arrayBuffer()
  await writeFile(join(dir, filename), Buffer.from(bytes))

  return NextResponse.json({ url: `/api/uploads/sellos/${filename}` })
}
