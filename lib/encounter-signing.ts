import crypto from "node:crypto"

/**
 * Compute a non-repudiable signature for a signed encounter. Binds the
 * clinical content (encrypted), signer, and timestamp together so any
 * post-sign tampering is detectable by re-running the same computation.
 *
 * Uses the FIELD_SIGN_KEY as the HMAC secret. This is intentionally
 * separate from FIELD_ENCRYPTION_KEY (used for PHI cipher) so that
 * rotating the encryption key does not invalidate existing encounter
 * signatures. See audit item #23 (FIELD_SIGN_KEY separation).
 *
 * Storing the signature next to the encounter makes it possible to verify
 * integrity without the encryption key (the signature is one-way; it
 * can only be recomputed with FIELD_SIGN_KEY).
 *
 * Migration: on first deploy after this commit, set FIELD_SIGN_KEY to the
 * same value as FIELD_ENCRYPTION_KEY in Coolify env vars. All existing
 * encounters re-signed under the old code will use the same key and
 * remain verifiable. Subsequently, rotating FIELD_ENCRYPTION_KEY
 * (encryption) does NOT invalidate signatures — only FIELD_SIGN_KEY
 * rotation does.
 *
 * Extracted from server/routers/encounter.ts so it can be unit-tested in
 * isolation without dragging in Next.js / tRPC / Prisma imports.
 */
export function signEncounterHash(input: {
  encounterId: string
  signedBy: string
  signedAt: Date
  historiaClinicaCifrada: string | null
  planCifrado: string | null
  vitales: unknown
  examenFisico: unknown
}): string {
  const raw = process.env.FIELD_SIGN_KEY
  if (!raw) {
    throw new Error(
      "FIELD_SIGN_KEY required to sign encounters. Set it in Coolify " +
        "env vars (can match FIELD_ENCRYPTION_KEY on first deploy).",
    )
  }
  const key = Buffer.from(raw, "base64")
  const payload = JSON.stringify({
    id: input.encounterId,
    by: input.signedBy,
    at: input.signedAt.toISOString(),
    a: input.historiaClinicaCifrada ?? "",
    p: input.planCifrado ?? "",
    v: input.vitales ?? null,
    e: input.examenFisico ?? null,
  })
  return crypto.createHmac("sha256", key).update(payload).digest("base64")
}