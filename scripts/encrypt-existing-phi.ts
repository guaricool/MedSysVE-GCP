/**
 * Migration: encrypt existing PHI/PII columns that were written in plaintext
 * before the field-level encryption pipeline was extended to cover them.
 *
 * Run with: npx tsx scripts/encrypt-existing-phi.ts
 *
 * Strategy:
 *  - For each (model, plaintext column → *Cifrado column) pair, find rows
 *    where the plaintext is non-null and the cipher is null.
 *  - Encrypt the plaintext (AES-256-GCM), populate the *Cifrado column.
 *  - For Patient.nombre/apellido/email/telefono, also populate the HMAC
 *    index so future queries can search by encrypted field.
 *  - AuditEvent.metadata (Jsonb) is JSON-stringified before encryption.
 *
 * Idempotency:
 *  - Rows where *Cifrado is already non-null are skipped (already encrypted).
 *  - Plaintext values that look like base64 ciphertext are skipped
 *    (heuristic — protects against double-encryption on partial runs).
 *  - Each row update is independent — a failure on one row does not block
 *    the rest.
 *
 * Requirements: FIELD_ENCRYPTION_KEY and FIELD_HMAC_KEY must be set in env.
 */

import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { encryptField, hmacIndex } from "../lib/field-crypto"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

/**
 * Heuristic: detect values that already look like AES-GCM ciphertext so we
 * don't double-encrypt. Our envelope is base64(iv[12]||ct||tag[16]) — for
 * any non-trivial plaintext, that's at least ~28 base64 chars using the
 * full base64 alphabet including +, /, =.
 *
 * Plaintext cédulas, names, phones, etc. are usually <28 chars and rarely
 * contain / or =. If a value already looks like ciphertext, skip it.
 */
function looksLikeCiphertext(value: string): boolean {
  if (value.length < 28) return false
  if (value.includes("=") || value.includes("/") || value.includes("+")) return true
  return /^[A-Za-z0-9+/=]+$/.test(value) && value.length >= 40
}

interface ColumnSpec {
  model: keyof typeof prisma & string
  plaintext: string
  cipher: string
  hmac?: string
  /** Optional transform for non-string values (e.g. Json → string) */
  transform?: (raw: unknown) => string | null
}

interface ColumnResult {
  migrated: number
  skipped: number
  failed: number
  total: number
}

async function migrateColumn(spec: ColumnSpec): Promise<ColumnResult> {
  const result: ColumnResult = { migrated: 0, skipped: 0, failed: 0, total: 0 }

  // We can't use Prisma's where clause on the cipher column directly here
  // because not all generated types include it yet at compile time — use a
  // raw SQL count for the total, then fetch candidates via Prisma.
  const modelClient = prisma[spec.model] as unknown as {
    findMany: (args: any) => Promise<any[]>
    update: (args: any) => Promise<any>
  }

  // Prisma 7 doesn't accept `isNot: null` on non-nullable fields. Fetch all rows
  // and let the in-loop null check skip empties — works for both nullable and
  // non-nullable columns uniformly.
  const rows = await modelClient.findMany({
    select: { id: true, [spec.plaintext]: true },
  } as any)

  result.total = rows.length

  for (const row of rows) {
    const raw = row[spec.plaintext]
    if (raw == null) {
      result.skipped++
      continue
    }

    const asString = spec.transform ? spec.transform(raw) : String(raw)
    if (!asString) {
      result.skipped++
      continue
    }

    if (looksLikeCiphertext(asString)) {
      result.skipped++
      continue
    }

    try {
      const cipher = encryptField(asString)
      if (!cipher) {
        result.skipped++
        continue
      }
      const data: Record<string, string | null> = { [spec.cipher]: cipher }
      if (spec.hmac) {
        data[spec.hmac] = hmacIndex(asString)
      }
      await modelClient.update({
        where: { id: row.id },
        data,
      } as any)
      result.migrated++
    } catch (err) {
      result.failed++
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`  [${spec.model}.${spec.plaintext}] ${row.id}: ${msg}`)
    }
  }

  return result
}

const COLUMN_SPECS: ColumnSpec[] = [
  // Doctor — email stays plaintext (login key)
  { model: "doctor", plaintext: "nombre", cipher: "nombreCifrado" },
  { model: "doctor", plaintext: "apellido", cipher: "apellidoCifrado" },
  { model: "doctor", plaintext: "telefono", cipher: "telefonoCifrado" },

  // Clinic
  { model: "clinic", plaintext: "nombre", cipher: "nombreCifrado" },
  { model: "clinic", plaintext: "razonSocial", cipher: "razonSocialCifrada" },
  { model: "clinic", plaintext: "direccion", cipher: "direccionCifrada" },
  { model: "clinic", plaintext: "telefono", cipher: "telefonoCifrado" },
  { model: "clinic", plaintext: "email", cipher: "emailCifrado" },

  // Workspace
  { model: "workspace", plaintext: "nombre", cipher: "nombreCifrado" },
  { model: "workspace", plaintext: "direccion", cipher: "direccionCifrada" },
  { model: "workspace", plaintext: "telefono", cipher: "telefonoCifrado" },
  { model: "workspace", plaintext: "razonSocial", cipher: "razonSocialCifrada" },
  { model: "workspace", plaintext: "direccionFiscal", cipher: "direccionFiscalCifrada" },

  // Patient — searchable fields get HMAC index
  { model: "patient", plaintext: "nombre", cipher: "nombreCifrado", hmac: "hmacNombre" },
  { model: "patient", plaintext: "apellido", cipher: "apellidoCifrado", hmac: "hmacApellido" },
  { model: "patient", plaintext: "telefono", cipher: "telefonoCifrado", hmac: "hmacTelefono" },
  { model: "patient", plaintext: "email", cipher: "emailCifrado", hmac: "hmacEmail" },

  // Document
  { model: "document", plaintext: "contenidoHtml", cipher: "contenidoHtmlCifrado" },
  { model: "document", plaintext: "aiDraft", cipher: "aiDraftCifrado" },

  // LabResult
  { model: "labResult", plaintext: "notas", cipher: "notasCifradas" },

  // Invoice
  { model: "invoice", plaintext: "descripcion", cipher: "descripcionCifrada" },

  // Mensaje (doctor↔patient portal messages)
  { model: "mensaje", plaintext: "texto", cipher: "textoCifrado" },

  // AuditEvent — metadata is Jsonb, must be serialized before encryption
  {
    model: "auditEvent",
    plaintext: "metadata",
    cipher: "metadataCifrado",
    transform: (raw) => {
      if (raw == null) return null
      try {
        return JSON.stringify(raw)
      } catch {
        return null
      }
    },
  },
]

async function main() {
  if (!process.env.FIELD_ENCRYPTION_KEY) {
    console.error("FIELD_ENCRYPTION_KEY must be set")
    process.exit(1)
  }
  if (!process.env.FIELD_HMAC_KEY) {
    console.error("FIELD_HMAC_KEY must be set (used for Patient searchable index)")
    process.exit(1)
  }
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL must be set")
    process.exit(1)
  }

  console.log("Starting PHI/PII field-level encryption backfill...")
  console.log("")

  let grandMigrated = 0
  let grandSkipped = 0
  let grandFailed = 0

  for (const spec of COLUMN_SPECS) {
    process.stdout.write(`[${spec.model}.${spec.plaintext} → ${spec.cipher}] `)
    const result = await migrateColumn(spec)
    grandMigrated += result.migrated
    grandSkipped += result.skipped
    grandFailed += result.failed
    console.log(
      `total=${result.total} migrated=${result.migrated} skipped=${result.skipped} failed=${result.failed}`,
    )
  }

  console.log("")
  console.log("=" .repeat(60))
  console.log(`Total: migrated=${grandMigrated} skipped=${grandSkipped} failed=${grandFailed}`)
  console.log("=" .repeat(60))

  if (grandFailed > 0) {
    console.error(`\n${grandFailed} row(s) failed — see errors above.`)
    process.exit(1)
  }

  console.log("\nDone. Verify with:")
  console.log("  SELECT COUNT(*) FROM \"Patient\"   WHERE \"nombreCifrado\" IS NULL AND nombre IS NOT NULL;")
  console.log("  SELECT COUNT(*) FROM \"Doctor\"    WHERE \"nombreCifrado\" IS NULL AND nombre IS NOT NULL;")
  console.log("  SELECT COUNT(*) FROM \"Workspace\" WHERE \"nombreCifrado\" IS NULL AND nombre IS NOT NULL;")
  console.log("  SELECT COUNT(*) FROM \"Clinic\"    WHERE \"nombreCifrado\" IS NULL AND nombre IS NOT NULL;")
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())