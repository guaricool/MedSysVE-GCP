process.env.DATABASE_URL = "postgresql://postgres:86930cc4ac0272b2120e8087532b7206@34.23.154.130:5432/medsysve"

import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
import { z } from "zod"

const credentialsSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(128),
})

async function simulateAuthorize(raw: any) {
  console.log("=== Simulating authorize() ===")
  const parsed = credentialsSchema.safeParse(raw)
  if (!parsed.success) {
    console.error("❌ Zod parse failed:", parsed.error)
    return null
  }
  const { email, password } = parsed.data
  const emailLower = email.toLowerCase().trim()

  console.log("Searching for doctor email:", emailLower)
  let doctor = await db.doctor.findUnique({
    where: { email: emailLower },
    include: { workspaces: { take: 1, orderBy: { createdAt: "asc" } } },
  })

  if (!doctor) {
    console.log("Doctor not found via findUnique, trying findFirst insensitive...")
    doctor = await db.doctor.findFirst({
      where: { email: { equals: emailLower, mode: "insensitive" } },
      include: { workspaces: { take: 1, orderBy: { createdAt: "asc" } } },
    })
  }

  if (!doctor) {
    console.error("❌ Doctor record not found!")
    return null
  }

  console.log("Found doctor:", doctor.email, "Hash:", doctor.passwordHash ? `${doctor.passwordHash.substring(0, 15)}...` : null)
  const doctorValid = await bcrypt.compare(password, doctor.passwordHash)
  console.log("bcrypt.compare result:", doctorValid)

  if (doctor && doctorValid) {
    let ws = doctor.workspaces[0]
    if (!ws) {
      console.log("No workspace found, looking up or creating...")
      ws = (await db.workspace.findFirst({
        where: { doctorId: doctor.id },
      })) as any
    }
    console.log("✅ authorize SUCCESS! Session User object:", {
      id: doctor.id,
      email: doctor.email,
      nombre: doctor.nombre,
      role: "DOCTOR",
      workspaceId: ws?.id,
      doctorId: doctor.id,
    })
    return {
      id: doctor.id,
      email: doctor.email,
      nombre: doctor.nombre,
      apellido: doctor.apellido,
      role: "DOCTOR",
      workspaceId: ws?.id,
      doctorId: doctor.id,
    }
  }

  console.error("❌ Password match failed!")
  return null
}

async function main() {
  await simulateAuthorize({ email: "cpierluissis@gmail.com", password: "020318" })
}

main().catch(console.error).finally(() => process.exit(0))
