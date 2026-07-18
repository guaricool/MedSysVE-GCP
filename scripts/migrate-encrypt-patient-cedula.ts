/**
 * Migration: encrypt existing Patient.numeroIdentificacion values that
 * were written in plaintext before the encryption pipeline was wired up.
 *
 * Run with: npx tsx scripts/migrate-encrypt-patient-cedula.ts
 *
 * Strategy:
 *  1. Find all patients where numeroIdentificacion is non-null AND does not
 *     look like base64 ciphertext (heuristic: short, contains letters only
 *     from a cédula charset, no IV leading pattern).
 *  2. For each, encrypt the value, compute hmacCedula, update the row.
 *  3. Same for Encounter.historiaClinica / plan plaintext columns (legacy).
 *
 * Idempotent: rows already encrypted (e.g. historiaClinicaCifrada non-null)
 * are skipped. Logs a count of migrated rows at the end.
 *
 * Requirements: FIELD_ENCRYPTION_KEY and FIELD_HMAC_KEY must be set in env.
 */

import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { encryptField, hmacIndex } from "../lib/field-crypto"

// Prisma 7 requires an explicit adapter — same pattern as lib/db.ts.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

/**
 * Heuristic: plaintext cédulas contain digits, dashes, and uppercase letters.
 * AES-GCM ciphertext is base64 (charset [A-Za-z0-9+/=]). A 12-byte IV
 * produces 16 base64 chars at the start (e.g. "Zq7Vt9k3pL2w=="). We treat
 * values containing '=' or '/' or length >= 20 as already-encrypted.
 */
function looksLikeCiphertext(value: string): boolean {
  if (value.length < 20) return false
  if (value.includes("=") || value.includes("/") || value.includes("+")) return true
  // 16+ contiguous base64 chars from a wider alphabet
  const base64ish = /^[A-Za-z0-9+/=]+$/.test(value)
  return base64ish && value.length >= 28
}

async function migratePatients() {
  let migrated = 0
  let skipped = 0
  let failed = 0
  const patients = await prisma.patient.findMany({
    where: { numeroIdentificacion: { not: null } },
    select: { id: true, numeroIdentificacion: true, hmacCedula: true, tipoIdentificacion: true },
  })

  for (const pat of patients) {
    const raw = pat.numeroIdentificacion
    if (!raw) continue

    if (looksLikeCiphertext(raw)) {
      skipped++
      continue
    }

    // Treat as plaintext cédula
    try {
      const encrypted = encryptField(raw)
      const hmac = hmacIndex(raw)
      await prisma.patient.update({
        where: { id: pat.id },
        data: {
          numeroIdentificacion: encrypted,
          hmacCedula: hmac,
        },
      })
      migrated++
    } catch (err) {
      failed++
      console.error(`patient ${pat.id}:`, err instanceof Error ? err.message : err)
    }
  }

  console.log(`Patients: ${migrated} migrated, ${skipped} already encrypted, ${failed} failed`)
}

async function migrateEncounters() {
  let migrated = 0
  let failed = 0
  const encounters = await prisma.encounter.findMany({
    where: {
      OR: [
        { historiaClinica: { not: null }, historiaClinicaCifrada: null },
        { plan: { not: null }, planCifrado: null },
      ],
    },
    select: { id: true, historiaClinica: true, plan: true },
  })

  for (const enc of encounters) {
    try {
      const data: { historiaClinicaCifrada?: string; planCifrado?: string } = {}
      if (enc.historiaClinica) data.historiaClinicaCifrada = encryptField(enc.historiaClinica) ?? undefined
      if (enc.plan) data.planCifrado = encryptField(enc.plan) ?? undefined
      await prisma.encounter.update({
        where: { id: enc.id },
        data,
      })
      migrated++
    } catch (err) {
      failed++
      console.error(`encounter ${enc.id}:`, err instanceof Error ? err.message : err)
    }
  }
  console.log(`Encounters: ${migrated} migrated, ${failed} failed`)
}

async function main() {
  if (!process.env.FIELD_ENCRYPTION_KEY || !process.env.FIELD_HMAC_KEY) {
    console.error("FIELD_ENCRYPTION_KEY and FIELD_HMAC_KEY must be set")
    process.exit(1)
  }
  console.log("Starting patient encryption migration...")
  await migratePatients()
  console.log("Starting encounter encryption migration...")
  await migrateEncounters()
  console.log("Done.")
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
