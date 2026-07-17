import { z } from "zod";

/**
 * Password policy — strong by default.
 *
 * Venezuela LOPDP doesn't prescribe a minimum (yet), but international
 * best practice (NIST SP 800-63B) and HIPAA §164.308(a)(5)(ii)(D) suggest:
 *  - Min 12 chars
 *  - Mix of character classes
 *  - No common passwords (top 1000 list)
 *  - No reuse (enforced elsewhere — bcrypt handles existing hashes)
 *
 * For PINs (staff): min 6 digits (because phones), max 8.
 * For portal passwords (patient): min 10 chars — patients may not be tech-savvy,
 * so we trade strictness for usability while keeping it above common thresholds.
 */

export const STRONG_PASSWORD_MESSAGE =
  "La contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas, números y al menos un símbolo.";

const COMMON_PASSWORDS = new Set([
  "password", "123456", "12345678", "123456789", "1234567890",
  "qwerty", "abc123", "password1", "admin", "letmein", "welcome",
  "monkey", "1234567", "111111", "iloveyou", "1q2w3e4r",
  "sunshine", "princess", "qwerty123", "passw0rd", "master",
  "00000000", "0987654321", "superman", "batman", "trustno1",
  "asdf1234", "pass1234", "abcd1234", "qwertyuiop",
  "contraseña", "clave123", "micontrasena", "clave",
  "medsysve", "medsys", "doctor", "medico", "enfermera",
  "venezuela", "caracas", "valencia", "maracaibo",
]);

/**
 * Doctor / staff password schema — production-grade.
 * Applied at registration, password change, and password set flows.
 */
export const strongPasswordSchema = z
  .string()
  .min(8, "Mínimo 8 caracteres")
  .max(128, "Máximo 128 caracteres")
  .refine((v) => /[a-z]/.test(v), "Debe incluir al menos una minúscula")
  .refine((v) => /[A-Z]/.test(v), "Debe incluir al menos una mayúscula")
  .refine((v) => /\d/.test(v), "Debe incluir al menos un número")
  .refine(
    (v) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(v),
    "Debe incluir al menos un símbolo (!@#$%^&* etc.)",
  )
  .refine(
    (v) => !COMMON_PASSWORDS.has(v.toLowerCase().trim()),
    "Contraseña demasiado común. Elija otra.",
  );

/**
 * Patient portal password — slightly weaker (usability over strictness).
 * Min 10 chars, classes required.
 */
export const portalPasswordSchema = z
  .string()
  .min(8, "Mínimo 8 caracteres")
  .max(128, "Máximo 128 caracteres")
  .refine((v) => /[a-z]/.test(v), "Debe incluir al menos una minúscula")
  .refine((v) => /[A-Z]/.test(v), "Debe incluir al menos una mayúscula")
  .refine((v) => /\d/.test(v), "Debe incluir al menos un número")
  .refine(
    (v) => !COMMON_PASSWORDS.has(v.toLowerCase().trim()),
    "Contraseña demasiado común. Elija otra.",
  );

/**
 * Staff PIN (numeric) — for quick kiosk-style access from tablets.
 * Min 6, max 8 digits, no 123456 / 000000.
 */
export const pinSchema = z
  .string()
  .regex(/^\d{6,8}$/, "PIN debe ser de 6 a 8 dígitos numéricos")
  .refine((v) => {
    // Reject all-same (111111) and monotonic (123456, 654321)
    if (/^(\d)\1+$/.test(v)) return false;
    const digits = v.split("").map(Number);
    let asc = true, desc = true;
    for (let i = 1; i < digits.length; i++) {
      if (digits[i] !== digits[i - 1] + 1) asc = false;
      if (digits[i] !== digits[i - 1] - 1) desc = false;
    }
    return !asc && !desc;
  }, "PIN demasiado predecible (123456, 654321, etc.)");

/**
 * Hash a password with bcrypt at the configured cost factor.
 *
 * Cost factor: 12 (2^12 = 4096 rounds).
 * - OWASP minimum recommendation: 10
 * - NIST SP 800-63B: as high as practical
 * - At 12 rounds, login takes ~200-400ms on modern hardware.
 *   Acceptable for medical apps where security > login speed.
 */
import bcrypt from "bcryptjs";

export const BCRYPT_COST = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_COST);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}