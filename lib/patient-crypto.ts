import { decryptField } from "./field-crypto"
import type { IdentificationType } from "@prisma/client"

/**
 * Helpers for handling Patient.numeroIdentificacion which is stored encrypted
 * (AES-256-GCM, base64 envelope) and queried via hmacCedula (HMAC-SHA-256).
 *
 * Why a helper layer:
 *  - All write paths must encrypt + populate the HMAC index atomically.
 *  - All read paths must decrypt via the same code path so the cipher is
 *    not bypassed by accident.
 *  - Tampered or pre-migration plaintext values should not crash the UI —
 *    return undefined instead and let the caller decide.
 */

export interface EncryptedCedulaInput {
  tipoIdentificacion?: IdentificationType | null
  numeroIdentificacion?: string | null
  sinCedula?: boolean | null
}

/**
 * Build the `data` payload for `patient.create` / `patient.update` so that
 * numeroIdentificacion is stored encrypted and hmacCedula is populated
 * with the searchable index.
 *
 * Callers must NOT pre-encrypt the value — pass the raw cédula string and
 * this helper will do it. Returns undefined hmacCedula for sinCedula /
 * empty / null inputs.
 */
export async function packPatientCedula(input: EncryptedCedulaInput): Promise<{
  tipoIdentificacion?: IdentificationType | null
  numeroIdentificacion?: string | null
  hmacCedula?: string | null
}> {
  const { encryptField, hmacIndex } = await import("./field-crypto")
  const raw = input.numeroIdentificacion?.trim()
  if (!raw || input.sinCedula) {
    return {
      tipoIdentificacion: input.tipoIdentificacion ?? null,
      numeroIdentificacion: null,
      hmacCedula: null,
    }
  }
  return {
    tipoIdentificacion: input.tipoIdentificacion ?? null,
    numeroIdentificacion: encryptField(raw),
    hmacCedula: hmacIndex(raw),
  }
}

/**
 * Safely decrypt numeroIdentificacion for display. Returns undefined if
 * the value is empty, null, or fails the GCM auth-tag check (which would
 * indicate tampering or pre-encryption data that needs the migration
 * script run).
 */
export function readPatientCedula(patient: {
  numeroIdentificacion?: string | null
}): string | undefined {
  if (!patient.numeroIdentificacion) return undefined
  try {
    const decrypted = decryptField(patient.numeroIdentificacion)
    return decrypted ?? undefined
  } catch {
    // Tampered, corrupt, or pre-migration plaintext. Surface as missing
    // rather than 500 — operators can re-run the migration script if many
    // patients show no cédula.
    return undefined
  }
}