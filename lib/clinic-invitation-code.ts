import crypto from "crypto"

/**
 * Generate a clinic invitation code.
 *
 * Format: `CLINIC-XXXXXX` where X is alphanumeric upper-case (no ambiguous
 * characters like 0/O, 1/I).
 * Length: 6 chars after prefix → ~30^6 = 729M combinations. Collision-resistant
 * for the expected clinic count in MedSysVE (< 10K), and we re-roll on
 * collision in the caller.
 *
 * Why alphanumeric upper-case only: codes get dictated over the phone,
 * handwritten on paper, or pasted into the UI. Mixed case + symbols would
 * introduce transcription errors.
 */
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // no 0/O/1/I/L

export function generateClinicInvitationCode(): string {
  const bytes = crypto.randomBytes(6)
  let code = ""
  for (let i = 0; i < 6; i++) {
    code += CODE_ALPHABET[bytes[i]! % CODE_ALPHABET.length]
  }
  return `CLINIC-${code}`
}

/**
 * Normalize a user-typed code to canonical form: trim whitespace + uppercase.
 */
export function normalizeClinicCode(input: string): string {
  return input.trim().toUpperCase()
}
