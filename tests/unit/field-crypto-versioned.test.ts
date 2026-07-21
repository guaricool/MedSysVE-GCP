import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { encryptField, decryptField } from "../../lib/field-crypto";

describe("Versioned Cryptography Keyring", () => {
  const originalKey = process.env.FIELD_ENCRYPTION_KEY;
  const originalKeyring = process.env.FIELD_ENCRYPTION_KEYS_KEYRING;

  beforeEach(() => {
    // Generate valid 32-byte key
    process.env.FIELD_ENCRYPTION_KEY = "YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXoxMjM0NTY=";
    delete process.env.FIELD_ENCRYPTION_KEYS_KEYRING;
  });

  afterEach(() => {
    process.env.FIELD_ENCRYPTION_KEY = originalKey;
    if (originalKeyring) {
      process.env.FIELD_ENCRYPTION_KEYS_KEYRING = originalKeyring;
    } else {
      delete process.env.FIELD_ENCRYPTION_KEYS_KEYRING;
    }
  });

  it("should encrypt and decrypt using legacy single key", () => {
    const rawText = "Hello HIPAA World";
    const encrypted = encryptField(rawText);
    expect(encrypted).not.toBeNull();
    expect(encrypted?.startsWith("v1:")).toBe(true);

    const decrypted = decryptField(encrypted);
    expect(decrypted).toBe(rawText);
  });

  it("should decrypt legacy ciphertexts without v1: prefix (backward compatibility)", () => {
    // Encrypt with v1 prefix
    const rawText = "Legacy Data Test";
    const encryptedWithPrefix = encryptField(rawText);
    
    // Strip the prefix to simulate a legacy DB row
    const rawCiphertext = encryptedWithPrefix?.split(":")[1];
    
    // Decrypting raw ciphertext should automatically fallback to v1 key
    const decrypted = decryptField(rawCiphertext);
    expect(decrypted).toBe(rawText);
  });

  it("should encrypt and decrypt using keyring with active v2 key", () => {
    // 1. Encrypt with v1 key active
    process.env.FIELD_ENCRYPTION_KEYS_KEYRING = JSON.stringify({
      active: "v1",
      keys: {
        v1: "YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXoxMjM0NTY=",
        v2: "YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXoxMjM0NTU="
      }
    });
    const rawText = "Top Secret PHI";
    const encryptedV1 = encryptField(rawText);
    expect(encryptedV1?.startsWith("v1:")).toBe(true);

    // 2. Change active key to v2
    process.env.FIELD_ENCRYPTION_KEYS_KEYRING = JSON.stringify({
      active: "v2",
      keys: {
        v1: "YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXoxMjM0NTY=",
        v2: "YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXoxMjM0NTU="
      }
    });

    // 3. Encrypt with v2 active
    const encryptedV2 = encryptField(rawText);
    expect(encryptedV2?.startsWith("v2:")).toBe(true);

    // 4. Decrypt both v1 and v2 ciphertexts while v2 is active
    expect(decryptField(encryptedV2)).toBe(rawText);
    expect(decryptField(encryptedV1)).toBe(rawText);
  });
});
