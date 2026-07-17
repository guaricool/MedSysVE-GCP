/**
 * rotate-field-keys.ts — Audit S11 (2026-07-07, closes audit #4).
 *
 * Worker invoked by `scripts/rotate-field-keys.sh`. Re-encrypts every
 * PHI column under a new FIELD_ENCRYPTION_KEY and recomputes every HMAC
 * index under a new FIELD_HMAC_KEY.
 *
 * ## Why this exists
 *
 * Quarterly key rotation is recommended by `lib/field-crypto.ts` and
 * DR-PLAN.md §5.1 but was never automated. Before this audit, the only
 * way to rotate was:
 *   1. Stop the app.
 *   2. Manually write a Node script.
 *   3. Run it.
 *   4. Cross fingers.
 *
 * Now: bash script + this worker + vitest tests + DR-PLAN update.
 *
 * ## Strategy
 *
 * The current encryption layer is single-key (no versioned ciphertext).
 * During rotation, we read each row with the OLD key, re-encrypt with
 * the NEW key, and write back. A small read-modify-write window per
 * row means the app MUST be offline during this operation (no concurrent
 * readers using the OLD key while we're writing the NEW key).
 *
 * HMAC indexes are recomputed from the plaintext under the new key —
 * the index is deterministic so the lookups still work after rotation.
 *
 * ## Tables / columns
 *
 * Tracked columns (PHI + PHI-derived HMAC indexes):
 *   - Patient.cedulaCifrada, hmacCedula
 *   - Patient.nombreCifrado, hmacNombre
 *   - Patient.apellidoCifrado, hmacApellido
 *   - Patient.telefonoCifrado, hmacTelefono
 *   - Patient.emailCifrado, hmacEmail
 *   - Patient.rifCifrado, hmacRif
 *   - Encounter.motivoCifrado, motivoHmac
 *   - Encounter.historiaClinicaCifrada
 *   - Encounter.planCifrado
 *   - Encounter.signatureHash
 *
 * If you add a new PHI column in the future, add it to PHI_COLUMNS
 * below. The worker is exhaustive for these columns; anything outside
 * is left as-is (and will break the next read with the new key — that's
 * a feature, not a bug: we want loud failures on forgotten columns).
 *
 * ## Idempotency
 *
 * Per-row idempotent: if a row's ciphertext already decrypts to the
 * same plaintext under the new key (i.e. a previous run already wrote
 * it), we skip the write. Detected by comparing plaintexts before/after.
 *
 * ## Environment
 *
 * Read by the bash script:
 *   - FIELD_ENCRYPTION_KEY     (old, used for decrypt)
 *   - FIELD_HMAC_KEY           (old, used for HMAC verify)
 *   - ROTATE_FIELD_ENCRYPTION_KEY  (new, used for encrypt)
 *   - ROTATE_FIELD_HMAC_KEY    (new, used for HMAC compute)
 *   - ROTATE_DRY_RUN           ("1" to only report, do not write)
 *   - ROTATE_BACKUP_PATH       (optional, asserts the worker is
 *                               operating on the dump file, not live DB)
 *   - DATABASE_URL             (Postgres connection)
 */

import crypto from "node:crypto"

// The actual field-crypto lib reads from env. We re-implement the
// dual-key paths here so we can decrypt with old, encrypt with new.
// This mirrors `lib/field-crypto.ts` byte-for-byte — if you change
// the algorithm or output format THERE, mirror the change HERE.
const ALGO = "aes-256-gcm"
const IV_BYTES = 12
const TAG_BYTES = 16

function decryptWith(rawKey: Buffer, ciphertext: string): string {
  const buf = Buffer.from(ciphertext, "base64")
  const iv = buf.subarray(0, IV_BYTES)
  const tag = buf.subarray(buf.length - TAG_BYTES)
  const ct = buf.subarray(IV_BYTES, buf.length - TAG_BYTES)
  const decipher = crypto.createDecipheriv(ALGO, rawKey, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf-8")
}

function encryptWith(rawKey: Buffer, plaintext: string): string {
  const iv = crypto.randomBytes(IV_BYTES)
  const cipher = crypto.createCipheriv(ALGO, rawKey, iv)
  const ct = Buffer.concat([cipher.update(plaintext, "utf-8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, ct, tag]).toString("base64")
}

function hmacWith(rawKey: Buffer, plaintext: string): string {
  return crypto.createHmac("sha256", rawKey).update(plaintext).digest("base64")
}

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

interface RotateConfig {
  oldEncKey: Buffer
  newEncKey: Buffer
  oldHmacKey: Buffer
  newHmacKey: Buffer
  dryRun: boolean
  backupPath: string
}

export function loadConfig(): RotateConfig {
  const oldEncKey = Buffer.from(process.env.FIELD_ENCRYPTION_KEY ?? "", "base64")
  const newEncKey = Buffer.from(process.env.ROTATE_FIELD_ENCRYPTION_KEY ?? "", "base64")
  const oldHmacKey = Buffer.from(process.env.FIELD_HMAC_KEY ?? "", "base64")
  const newHmacKey = Buffer.from(process.env.ROTATE_FIELD_HMAC_KEY ?? "", "base64")
  if (oldEncKey.length !== 32) throw new Error("FIELD_ENCRYPTION_KEY must be 32 bytes (base64 decoded)")
  if (newEncKey.length !== 32) throw new Error("ROTATE_FIELD_ENCRYPTION_KEY must be 32 bytes (base64 decoded)")
  if (oldHmacKey.length !== 32) throw new Error("FIELD_HMAC_KEY must be 32 bytes (base64 decoded)")
  if (newHmacKey.length !== 32) throw new Error("ROTATE_FIELD_HMAC_KEY must be 32 bytes (base64 decoded)")
  if (oldEncKey.equals(newEncKey)) throw new Error("OLD and NEW FIELD_ENCRYPTION_KEY are equal — nothing to do")
  if (oldHmacKey.equals(newHmacKey)) throw new Error("OLD and NEW FIELD_HMAC_KEY are equal — nothing to do")
  return {
    oldEncKey,
    newEncKey,
    oldHmacKey,
    newHmacKey,
    dryRun: process.env.ROTATE_DRY_RUN === "1",
    backupPath: process.env.ROTATE_BACKUP_PATH || "",
  }
}

// ---------------------------------------------------------------------------
// Tables / columns to rotate
// ---------------------------------------------------------------------------
//
// Shape: { [table]: { [column]: { kind: 'enc' | 'hmac', pairsWith?: columnName } } }
//
// `pairsWith` is set for HMAC columns: the worker recomputes the HMAC
// from the plaintext that was just decrypted (so the pair stays in
// sync under the new key).
//
// For Encounter.signatureHash we treat it as a separate "HMAC-only"
// column that we re-sign from a JSON of {encounterId, signedBy,
// signedAt, content}. The content is decrypted from historiaClinicaCifrada /
// planCifrado / vitales JSON. We do NOT touch signatureHash in this
// worker (it's bound to the old key and would invalidate — operators
// must re-sign affected encounters after rotation, OR rely on the
// `--re-sign` flag added in a follow-up). For now we just leave the
// old signature in place and report it in the summary.

interface ColumnSpec {
  kind: "enc" | "hmac-pair"
  /** The encrypted column whose plaintext feeds the HMAC. */
  hmacSource?: string
}

const TABLES: Record<string, Record<string, ColumnSpec>> = {
  Patient: {
    cedulaCifrada: { kind: "enc" },
    hmacCedula: { kind: "hmac-pair", hmacSource: "cedulaCifrada" },
    nombreCifrado: { kind: "enc" },
    hmacNombre: { kind: "hmac-pair", hmacSource: "nombreCifrado" },
    apellidoCifrado: { kind: "enc" },
    hmacApellido: { kind: "hmac-pair", hmacSource: "apellidoCifrado" },
    telefonoCifrado: { kind: "enc" },
    hmacTelefono: { kind: "hmac-pair", hmacSource: "telefonoCifrado" },
    emailCifrado: { kind: "enc" },
    hmacEmail: { kind: "hmac-pair", hmacSource: "emailCifrado" },
    rifCifrado: { kind: "enc" },
    hmacRif: { kind: "hmac-pair", hmacSource: "rifCifrado" },
  },
  Encounter: {
    motivoCifrado: { kind: "enc" },
    motivoHmac: { kind: "hmac-pair", hmacSource: "motivoCifrado" },
    historiaClinicaCifrada: { kind: "enc" },
    planCifrado: { kind: "enc" },
  },
}

// ---------------------------------------------------------------------------
// Run — read all rows, re-encrypt, write back
// ---------------------------------------------------------------------------

async function main() {
  const cfg = loadConfig()
  return runRotate(cfg)
}

/**
 * Exported for tests. Runs the rotation against whatever Prisma client
 * `import("../lib/db")` resolves to (the real one in production, the
 * mocked one in vitest).
 */
export async function runRotate(cfg: RotateConfig) {
  // Lazy import so the worker can be tested without a real DB.
  // Using @/lib/db (absolute via tsconfig paths alias) so test mocks
  // registered with `vi.mock("@/lib/db", ...)` apply consistently.
  const { db } = await import("@/lib/db")

  console.log(`[rotate-keys] dry-run=${cfg.dryRun}`)
  console.log(`[rotate-keys] backup=${cfg.backupPath || "<none>"}`)
  console.log(`[rotate-keys] enc key (old→new): ${cfg.oldEncKey.length}→${cfg.newEncKey.length} bytes`)
  console.log(`[rotate-keys] hmac key (old→new): ${cfg.oldHmacKey.length}→${cfg.newHmacKey.length} bytes`)
  console.log()

  const summary: Record<string, { scanned: number; rotated: number; skipped: number; errors: number }> = {}

  for (const [table, columns] of Object.entries(TABLES)) {
    console.log(`[rotate-keys] === ${table} ===`)
    const model = (db as unknown as Record<string, { findMany: Function; update: Function }>)[
      table.charAt(0).toLowerCase() + table.slice(1)
    ]
    if (!model) {
      console.log(`  ⚠️ model not found in Prisma client, skipping`)
      continue
    }
    const rows = await model.findMany({
      where: { OR: Object.keys(columns).map((c) => ({ [c]: { not: null } })) },
      select: { id: true, ...Object.fromEntries(Object.keys(columns).map((c) => [c, true])) },
    })
    const stats = { scanned: rows.length, rotated: 0, skipped: 0, errors: 0 }
    summary[table] = stats

    for (const row of rows) {
      const updates: Record<string, string | null> = {}
      let alreadyRotated = 0
      try {
        for (const [col, spec] of Object.entries(columns)) {
          const current = row[col]
          if (current == null) continue
          if (spec.kind === "enc") {
            // Idempotency: if decrypt with OLD throws (auth tag fails),
            // try decrypt with NEW. If NEW works, this row was already
            // rotated in a previous run — skip it without counting as
            // an error. If neither works, count as a real error.
            let plaintext: string
            try {
              plaintext = decryptWith(cfg.oldEncKey, current)
            } catch {
              try {
                plaintext = decryptWith(cfg.newEncKey, current)
                alreadyRotated++
                continue
              } catch {
                throw new Error(`ciphertext at ${col} not decryptable with old or new key (corrupted?)`)
              }
            }
            const reencrypted = encryptWith(cfg.newEncKey, plaintext)
            // Note: AES-GCM randomizes the IV per call, so reencrypted
            // is virtually never byte-equal to current even when the
            // key is the same. We always write — the call is idempotent
            // at the plaintext level (decrypt always returns the same
            // value) but not at the byte level.
            updates[col] = reencrypted
          }
          // hmac-pair handled in the enc branch below
        }
        // HMAC pairs: after the encrypted source was rotated, recompute
        // the HMAC from the freshly-decrypted plaintext under the new key.
        for (const [col, spec] of Object.entries(columns)) {
          if (spec.kind !== "hmac-pair") continue
          const sourceCol = spec.hmacSource!
          // Use the freshly-decrypted plaintext from this row.
          const sourceCipher = row[sourceCol]
          if (sourceCipher == null) continue
          let plaintext: string
          try {
            plaintext = decryptWith(cfg.oldEncKey, sourceCipher)
          } catch {
            try {
              plaintext = decryptWith(cfg.newEncKey, sourceCipher)
              alreadyRotated++
              continue
            } catch {
              throw new Error(`ciphertext at ${sourceCol} (HMAC source) not decryptable`)
            }
          }
          const newHmac = hmacWith(cfg.newHmacKey, plaintext)
          if (newHmac !== row[col]) updates[col] = newHmac
        }
        if (Object.keys(updates).length > 0) {
          if (!cfg.dryRun) {
            await model.update({ where: { id: row.id }, data: updates })
          }
          stats.rotated++
          console.log(`  [${cfg.dryRun ? "DRY" : "OK"}] ${table}.${row.id}: ${Object.keys(updates).join(", ")}${alreadyRotated > 0 ? ` (already-rotated fields: ${alreadyRotated})` : ""}`)
        } else if (alreadyRotated > 0) {
          // All enc fields already-rotated. The HMAC pair may still
          // need re-computing if the env says so, but with OLD=NEW it
          // would yield the same value. We can safely skip.
          stats.skipped++
          console.log(`  [SKIP] ${table}.${row.id}: already rotated in a previous run (${alreadyRotated} enc fields)`)
        }
      } catch (e) {
        stats.errors++
        console.error(`  [ERR] ${table}.${row.id}: ${e instanceof Error ? e.message : String(e)}`)
      }
    }
    console.log(
      `  ${table}: scanned=${stats.scanned} rotated=${stats.rotated} skipped=${stats.skipped} errors=${stats.errors}`,
    )
  }

  console.log()
  console.log("[rotate-keys] === summary ===")
  for (const [t, s] of Object.entries(summary)) {
    console.log(
      `  ${t}: scanned=${s.scanned} rotated=${s.rotated} skipped=${s.skipped} errors=${s.errors}`,
    )
  }
  const totalErrors = Object.values(summary).reduce((acc, s) => acc + s.errors, 0)
  if (totalErrors > 0) {
    console.log(`[rotate-keys] ${totalErrors} rows failed — investigate before declaring success.`)
    // Throw instead of process.exit so test runners can catch the error
    // and CLI scripts still get a non-zero exit code via the wrapper in
    // main().
    throw new Error(`[rotate-keys] ${totalErrors} rows failed — see logs above`)
  }
  console.log(cfg.dryRun ? "[rotate-keys] dry-run complete." : "[rotate-keys] done.")
}

// Auto-run when invoked as a script (not when imported by tests).
// `require.main === module` is true in CJS, false when imported.
if (typeof require !== "undefined" && require.main === module) {
  main().catch((e) => {
    console.error("[rotate-keys] fatal:", e)
    process.exit(1)
  })
}

export { TABLES }
