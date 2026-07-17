import * as otplib from "otplib";
import qrcode from "qrcode";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

/**
 * 2FA TOTP (RFC 6238) module for doctors.
 *
 * - Algorithm: SHA-1, 6 digits, 30-second period (industry standard, compatible
 *   with Google Authenticator, Authy, 1Password, Bitwarden, etc.).
 * - QR enrollment: otpauth:// URI encoded as a QR code.
 * - Backup codes: 10 codes, 8 hex chars each, bcrypt-hashed.
 *
 * Compliance:
 *  - NIST SP 800-63B §5.1.2: "Multi-factor authenticators SHALL use approved
 *    cryptography."
 *  - HIPAA §164.312(d): Person or entity authentication.
 */

const ISSUER = process.env.TOTP_ISSUER || "MedSysVE";

/** Generate a new random base32 secret. */
export function generateTotpSecret(): string {
  return otplib.generateSecret();
}

/** Build the otpauth:// URI for QR enrollment. */
export function buildOtpAuthUri(email: string, secret: string): string {
  return otplib.generateURI({ issuer: ISSUER, label: email, secret });
}

/** Generate a QR code PNG data-URL for the otpauth URI. */
export async function generateQrDataUrl(otpauthUri: string): Promise<string> {
  return qrcode.toDataURL(otpauthUri, { errorCorrectionLevel: "M", width: 240 });
}

/** Verify a 6-digit TOTP code against the user's secret. */
export function verifyTotp(code: string, secret: string): boolean {
  if (!/^\d{6}$/.test(code)) return false;
  try {
    // otplib.verify can return a Promise or a value depending on plugin.
    const result = otplib.verify({ token: code, secret });
    if (result && typeof (result as any).then === "function") {
      // Async — shouldn't normally happen with sync plugins, defensive only.
      return false;
    }
    return Boolean(result);
  } catch {
    return false;
  }
}

/**
 * Generate N one-time backup codes.
 * Returns array of plaintext codes (shown to user ONCE).
 * Caller must bcrypt-hash and persist them.
 */
export function generateBackupCodes(count = 10): string[] {
  const codes: string[] = [];
  const seen = new Set<string>();
  while (codes.length < count) {
    const code = randomBytes(4).toString("hex"); // 8 hex chars
    if (!seen.has(code)) {
      seen.add(code);
      codes.push(code);
    }
  }
  return codes;
}

/** Hash a backup code with bcrypt. */
export async function hashBackupCode(code: string): Promise<string> {
  return bcrypt.hash(code.toLowerCase(), 10);
}

/** Verify a backup code against a stored bcrypt hash. */
export async function verifyBackupCode(code: string, hash: string): Promise<boolean> {
  return bcrypt.compare(code.toLowerCase().trim(), hash);
}