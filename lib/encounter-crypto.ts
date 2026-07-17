import { encryptField, decryptField, hmacIndex } from "./field-crypto"

/**
 * Helpers for handling Encounter.motivo which is stored encrypted
 * (AES-256-GCM, base64 envelope) and queried via motivoHmac (HMAC-SHA-256).
 *
 * Pattern mirrors lib/patient-crypto.ts (used for Patient.numeroIdentificacion)
 * so all PHI write paths consistently produce ciphertext + HMAC index,
 * and all read paths decrypt via the same code path.
 *
 * Why a helper layer:
 *  - All write paths must encrypt + populate the HMAC index atomically.
 *  - All read paths must decrypt via the same code path so the cipher is
 *    not bypassed by accident.
 *  - Tampered or pre-migration plaintext values should not crash the UI —
 *    return undefined instead and let the caller decide.
 */

export interface EncryptedMotivoInput {
  motivo?: string | null
}

/**
 * Build the `data` payload for `encounter.create` / `encounter.update` so
 * that motivo is stored encrypted (motivoCifrado) and the searchable
 * HMAC index is populated (motivoHmac).
 *
 * Callers must NOT pre-encrypt the value — pass the raw motivo string and
 * this helper will do it. Returns null motivoCifrado / motivoHmac for
 * empty / null inputs.
 *
 * NOTE: does NOT write to the legacy plaintext `motivo` column. Existing
 * rows are migrated by an operator-run migration script (see
 * scripts/migrations/<ts>_encrypt_motivo.ts) per the same policy used for
 * historiaClinica/plan.
 */
export function packEncounterMotivo(input: EncryptedMotivoInput): {
  motivoCifrado: string | null
  motivoHmac: string | null
} {
  const raw = input.motivo?.trim()
  if (!raw) {
    return { motivoCifrado: null, motivoHmac: null }
  }
  return {
    motivoCifrado: encryptField(raw),
    motivoHmac: hmacIndex(raw),
  }
}

/**
 * Safely decrypt motivo for display. Returns undefined if the value is
 * empty, null, or fails the GCM auth-tag check (which would indicate
 * tampering or pre-encryption data that needs the migration script run).
 *
 * Motivo is stored only in motivoCifrado (AES-256-GCM). The legacy plaintext
 * motivo column was dropped in 20260703010000_drop_encounter_motivo_legacy.
 *
 * Failure modes (all return undefined — UI shows empty rather than 500):
 *  - motivoCifrado is null/undefined/empty
 *  - Decryption throws (tampered auth tag, wrong key, corrupt base64)
 *  - Decrypted value is empty after trim
 */
export function readEncounterMotivo(encounter: {
  motivoCifrado?: string | null
}): string | undefined {
  if (!encounter.motivoCifrado) return undefined
  try {
    const decrypted = decryptField(encounter.motivoCifrado)
    return decrypted ?? undefined
  } catch {
    // Tampered, corrupt, or wrong key. Surface as missing rather than 500.
    return undefined
  }
}