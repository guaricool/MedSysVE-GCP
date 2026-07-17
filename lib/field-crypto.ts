import crypto from "crypto";

/**
 * Field-level encryption with AES-256-GCM.
 *
 * Why this matters:
 *  - Defense-in-depth on top of database-level encryption at rest.
 *  - Even if the DB is compromised (e.g. stolen backup), an attacker without
 *    the FIELD_ENCRYPTION_KEY cannot read patient cédulas, RIFs, diagnoses,
 *    etc.
 *  - HIPAA Security Rule §164.312(a)(2)(iv): "Implement encryption and
 *    decryption of electronic protected health information."
 *  - LOPDP Art. 19: medidas técnicas apropiadas para protección de datos.
 *
 * Algorithm: AES-256-GCM
 *  - 256-bit key from FIELD_ENCRYPTION_KEY env var.
 *  - 96-bit random IV per encryption (stored with ciphertext).
 *  - 128-bit auth tag (prevents tampering).
 *  - Output format: base64(iv || ciphertext || tag).
 *
 * Key management:
 *  - Set FIELD_ENCRYPTION_KEY in env (32 bytes base64).
 *  - Rotate quarterly. To rotate: add new key, decrypt with old, re-encrypt
 *    with new, swap.
 *  - Production: store in Coolify secrets, never commit.
 *
 * Limitations / known gaps:
 *  - Deterministic encryption is NOT used (would enable equality queries).
 *    For "find by cédula" we use HMAC index (see hmacIndex).
 *  - Searchable encryption is an unsolved problem in general — we accept
 *    that exact-match-by-cédula requires the HMAC index lookup.
 */

const ALGO = "aes-256-gcm";
const IV_BYTES = 12; // 96 bits, recommended for GCM
const TAG_BYTES = 16;

function getKey(): Buffer {
  const raw = process.env.FIELD_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "FIELD_ENCRYPTION_KEY not set — refusing to encrypt/decrypt PHI. " +
        "Generate with: openssl rand -base64 32",
    );
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error(
      `FIELD_ENCRYPTION_KEY must decode to 32 bytes, got ${key.length}`,
    );
  }
  return key;
}

/**
 * Encrypt a string. Returns base64-encoded blob, or null for empty input.
 *
 * Output format: base64(IV[12] || ciphertext || authTag[16])
 */
export function encryptField(plaintext: string | null | undefined): string | null {
  if (plaintext == null || plaintext === "") return null;
  const key = getKey();
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf-8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, ct, tag]).toString("base64");
}

/**
 * Decrypt a previously-encrypted string. Returns null for null/empty input.
 * Throws if the ciphertext is tampered (GCM auth tag fails).
 */
export function decryptField(ciphertext: string | null | undefined): string | null {
  if (ciphertext == null || ciphertext === "") return null;
  const key = getKey();
  const buf = Buffer.from(ciphertext, "base64");
  if (buf.length < IV_BYTES + TAG_BYTES) {
    throw new Error("Ciphertext too short — corrupt or wrong format");
  }
  const iv = buf.subarray(0, IV_BYTES);
  const tag = buf.subarray(buf.length - TAG_BYTES);
  const ct = buf.subarray(IV_BYTES, buf.length - TAG_BYTES);
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
  return pt.toString("utf-8");
}

/**
 * HMAC index for searchable fields (cédula, RIF).
 *
 * Allows `WHERE hmacCedula = ?` to find a record without storing the
 * plaintext. We compute HMAC-SHA-256 with a separate key (FIELD_HMAC_KEY)
 * so the index can't be used to decrypt even if the encryption key leaks.
 *
 * Search flow:
 *   1. User types "V-12345678" in search box.
 *   2. Compute hmacCedula = hmacIndex("V-12345678").
 *   3. SELECT * FROM "Patient" WHERE "hmacCedula" = ?.
 *   4. Decrypt the matching row's cedulaCifrada for display.
 */
export function hmacIndex(plaintext: string): string {
  const raw = process.env.FIELD_HMAC_KEY;
  if (!raw) {
    throw new Error("FIELD_HMAC_KEY not set");
  }
  const key = Buffer.from(raw, "base64");
  if (key.length < 16) {
    throw new Error("FIELD_HMAC_KEY must be at least 16 bytes");
  }
  return crypto
    .createHmac("sha256", key)
    .update(plaintext.toLowerCase().trim(), "utf-8")
    .digest("base64");
}

/**
 * Validate that encryption is configured. Called at app startup to fail
 * fast if the key is missing or wrong length.
 */
export function assertEncryptionConfigured(): void {
  getKey();
  // HMAC key is optional but recommended
  if (!process.env.FIELD_HMAC_KEY) {
    // Warn but don't fail
    console.warn(
      "[encryption] FIELD_HMAC_KEY not set — searchable encryption disabled",
    );
  }
}

/**
 * Sanitize a value for use in logs or error messages. Strips content that
 * might leak PHI even if encryption is bypassed.
 */
export function safePreview(value: string | null | undefined, maxLen = 4): string {
  if (!value) return "—";
  return value.length <= maxLen
    ? "•".repeat(value.length)
    : "•".repeat(maxLen) + "…";
}