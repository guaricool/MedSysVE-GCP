process.env.DATABASE_URL = "postgresql://postgres:86930cc4ac0272b2120e8087532b7206@34.23.154.130:5432/medsysve"

import { db } from "@/lib/db"
import bcrypt from "bcryptjs"

async function testDoctorAuth(email: string) {
  console.log(`\n--- Testing auth for email: ${email} ---`)
  const emailLower = email.toLowerCase().trim()
  
  let doctor = await db.doctor.findUnique({
    where: { email: emailLower },
    include: { workspaces: { take: 1, orderBy: { createdAt: "asc" } } },
  })
  
  if (!doctor) {
    doctor = await db.doctor.findFirst({
      where: { email: { equals: emailLower, mode: "insensitive" } },
      include: { workspaces: { take: 1, orderBy: { createdAt: "asc" } } },
    })
  }

  if (!doctor) {
    console.error("❌ Doctor not found in database!")
    return
  }

  console.log("✅ Doctor record found:", {
    id: doctor.id,
    email: doctor.email,
    nombre: doctor.nombre,
    apellido: doctor.apellido,
    passwordHash: doctor.passwordHash ? `${doctor.passwordHash.substring(0, 15)}...` : null,
    workspacesCount: doctor.workspaces.length,
  })

  // Test candidate password from user prompt ("020318")
  const candidates = ["020318", "020318 ", " 020318", "Admin2026!"]
  for (const pwd of candidates) {
    const isValid = await bcrypt.compare(pwd, doctor.passwordHash)
    console.log(`Testing password "${pwd}": ${isValid ? "✅ MATCH!" : "❌ No match"}`)
  }
}

async function main() {
  await testDoctorAuth("cpierluissis@gmail.com")
}

main().catch(console.error).finally(() => process.exit(0))
