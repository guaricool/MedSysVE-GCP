import { describe, it, expect, beforeAll, afterAll, vi } from "vitest"
import {
  encryptField,
  decryptField,
  hmacIndex,
  assertEncryptionConfigured,
  safePreview,
} from "@/lib/field-crypto"
import crypto from "crypto"

// ---------------------------------------------------------------------------
// Test setup — provide encryption keys via env. Required before any
// encryptField/decryptField/hmacIndex call.
// ---------------------------------------------------------------------------
const TEST_FIELD_KEY = crypto.randomBytes(32).toString("base64")
const TEST_HMAC_KEY = crypto.randomBytes(32).toString("base64")

const ORIGINAL_FIELD_KEY = process.env.FIELD_ENCRYPTION_KEY
const ORIGINAL_HMAC_KEY = process.env.FIELD_HMAC_KEY

beforeAll(() => {
  process.env.FIELD_ENCRYPTION_KEY = TEST_FIELD_KEY
  process.env.FIELD_HMAC_KEY = TEST_HMAC_KEY
})

afterAll(() => {
  if (ORIGINAL_FIELD_KEY !== undefined) {
    process.env.FIELD_ENCRYPTION_KEY = ORIGINAL_FIELD_KEY
  } else {
    delete process.env.FIELD_ENCRYPTION_KEY
  }
  if (ORIGINAL_HMAC_KEY !== undefined) {
    process.env.FIELD_HMAC_KEY = ORIGINAL_HMAC_KEY
  } else {
    delete process.env.FIELD_HMAC_KEY
  }
})

// ===========================================================================
// encryptField
// ===========================================================================

describe("encryptField", () => {
  it("returns null for null input", () => {
    expect(encryptField(null)).toBeNull()
  })

  it("returns null for undefined input", () => {
    expect(encryptField(undefined)).toBeNull()
  })

  it("returns null for empty string input", () => {
    expect(encryptField("")).toBeNull()
  })

  it("encrypts a non-empty plaintext to a non-empty base64 string", () => {
    const ct = encryptField("hello world")
    expect(ct).not.toBeNull()
    expect(ct).not.toBe("")
    // base64 chars only
    expect(ct).toMatch(/^[A-Za-z0-9+/]+=*$/)
  })

  it("produces different ciphertext on each call (random IV)", () => {
    const a = encryptField("same plaintext")
    const b = encryptField("same plaintext")
    expect(a).not.toBe(b)
    expect(decryptField(a!)).toBe("same plaintext")
    expect(decryptField(b!)).toBe("same plaintext")
  })

  it("throws when FIELD_ENCRYPTION_KEY is missing", () => {
    delete process.env.FIELD_ENCRYPTION_KEY
    try {
      expect(() => encryptField("test")).toThrow(/FIELD_ENCRYPTION_KEY/)
    } finally {
      process.env.FIELD_ENCRYPTION_KEY = TEST_FIELD_KEY
    }
  })

  it("throws when FIELD_ENCRYPTION_KEY is not 32 bytes after base64 decode", () => {
    process.env.FIELD_ENCRYPTION_KEY = crypto.randomBytes(16).toString("base64") // 16 bytes
    try {
      expect(() => encryptField("test")).toThrow(/must decode to 32 bytes/)
    } finally {
      process.env.FIELD_ENCRYPTION_KEY = TEST_FIELD_KEY
    }
  })

  it("handles unicode (accents, ñ, emojis)", () => {
    const pt = "Paciente中文 — ñáéíóú — 🩺"
    expect(decryptField(encryptField(pt)!)).toBe(pt)
  })

  it("handles multiline strings", () => {
    const pt = "línea1\nlínea2\nlínea3"
    expect(decryptField(encryptField(pt)!)).toBe(pt)
  })

  it("handles long strings (10 KB)", () => {
    const pt = "x".repeat(10_000)
    expect(decryptField(encryptField(pt)!)).toBe(pt)
  })

  it("ciphertext is at least IV(12) + tag(16) = 28 bytes when base64-decoded", () => {
    const ct = encryptField("test")!
    const buf = Buffer.from(ct, "base64")
    expect(buf.length).toBeGreaterThanOrEqual(28)
    // First 12 bytes are IV, last 16 are auth tag
    expect(buf.length).toBe(12 + Buffer.byteLength("test", "utf-8") + 16)
  })
})

// ===========================================================================
// decryptField
// ===========================================================================

describe("decryptField", () => {
  it("returns null for null input", () => {
    expect(decryptField(null)).toBeNull()
  })

  it("returns null for undefined input", () => {
    expect(decryptField(undefined)).toBeNull()
  })

  it("returns null for empty string input", () => {
    expect(decryptField("")).toBeNull()
  })

  it("decrypts a previously-encrypted value", () => {
    const ct = encryptField("my secret")!
    expect(decryptField(ct)).toBe("my secret")
  })

  it("throws when ciphertext is too short (< IV + tag)", () => {
    // 10 bytes < 28 minimum
    const shortB64 = Buffer.from("short").toString("base64")
    expect(() => decryptField(shortB64)).toThrow(/too short|Ciphertext too short/)
  })

  it("throws when ciphertext is not valid base64 (deformed)", () => {
    // Bad base64 (not all chars in alphabet)
    expect(() => decryptField("!!!not-base64@@@")).toThrow()
  })

  it("detects tampered ciphertext (GCM auth tag fails)", () => {
    const ct = encryptField("honest value")!
    const buf = Buffer.from(ct, "base64")
    // Flip a byte in the middle (ciphertext region)
    buf[15] = buf[15] ^ 0x01
    const tampered = buf.toString("base64")
    expect(() => decryptField(tampered)).toThrow()
  })

  it("detects tampered auth tag (last byte flipped)", () => {
    const ct = encryptField("honest value")!
    const buf = Buffer.from(ct, "base64")
    buf[buf.length - 1] = buf[buf.length - 1] ^ 0xff
    const tampered = buf.toString("base64")
    expect(() => decryptField(tampered)).toThrow()
  })

  it("detects tampered IV (first byte flipped)", () => {
    const ct = encryptField("honest value")!
    const buf = Buffer.from(ct, "base64")
    buf[0] = buf[0] ^ 0x01
    const tampered = buf.toString("base64")
    expect(() => decryptField(tampered)).toThrow()
  })

  it("rejects ciphertext encrypted with a different key", () => {
    const ct = encryptField("encrypted with key A")!
    const otherKey = crypto.randomBytes(32).toString("base64")
    process.env.FIELD_ENCRYPTION_KEY = otherKey
    try {
      expect(() => decryptField(ct)).toThrow()
    } finally {
      process.env.FIELD_ENCRYPTION_KEY = TEST_FIELD_KEY
    }
  })

  it("throws when FIELD_ENCRYPTION_KEY is missing", () => {
    delete process.env.FIELD_ENCRYPTION_KEY
    try {
      expect(() => decryptField(encryptField("x")!)).toThrow(/FIELD_ENCRYPTION_KEY/)
    } finally {
      process.env.FIELD_ENCRYPTION_KEY = TEST_FIELD_KEY
    }
  })
})

// ===========================================================================
// hmacIndex
// ===========================================================================

describe("hmacIndex", () => {
  it("returns deterministic HMAC for same input", () => {
    const a = hmacIndex("V-12345678")
    const b = hmacIndex("V-12345678")
    expect(a).toBe(b)
  })

  it("returns different HMAC for different inputs", () => {
    expect(hmacIndex("V-12345678")).not.toBe(hmacIndex("V-87654321"))
  })

  it("is case-insensitive (lowercases input before hashing)", () => {
    expect(hmacIndex("DIABETES")).toBe(hmacIndex("diabetes"))
    expect(hmacIndex("Diabetes")).toBe(hmacIndex("diabetes"))
  })

  it("trims whitespace before hashing", () => {
    expect(hmacIndex("  hello  ")).toBe(hmacIndex("hello"))
  })

  it("returns base64 string of expected length (HMAC-SHA-256 = 44 chars with padding)", () => {
    const result = hmacIndex("test")
    expect(result).toMatch(/^[A-Za-z0-9+/]+=*$/)
    expect(result.length).toBe(44) // 32 bytes base64-encoded
  })

  it("uses a DIFFERENT key from FIELD_ENCRYPTION_KEY (key separation)", () => {
    // Two HMACs of same input with two different HMAC keys should differ
    const a = hmacIndex("test")
    process.env.FIELD_HMAC_KEY = crypto.randomBytes(32).toString("base64")
    const b = hmacIndex("test")
    expect(a).not.toBe(b)
    process.env.FIELD_HMAC_KEY = TEST_HMAC_KEY
  })

  it("throws when FIELD_HMAC_KEY is missing", () => {
    delete process.env.FIELD_HMAC_KEY
    try {
      expect(() => hmacIndex("test")).toThrow(/FIELD_HMAC_KEY/)
    } finally {
      process.env.FIELD_HMAC_KEY = TEST_HMAC_KEY
    }
  })

  it("throws when FIELD_HMAC_KEY is less than 16 bytes", () => {
    process.env.FIELD_HMAC_KEY = crypto.randomBytes(8).toString("base64") // 8 bytes
    try {
      expect(() => hmacIndex("test")).toThrow(/at least 16 bytes/)
    } finally {
      process.env.FIELD_HMAC_KEY = TEST_HMAC_KEY
    }
  })
})

// ===========================================================================
// assertEncryptionConfigured
// ===========================================================================

describe("assertEncryptionConfigured", () => {
  it("does not throw when FIELD_ENCRYPTION_KEY is set and 32 bytes", () => {
    expect(() => assertEncryptionConfigured()).not.toThrow()
  })

  it("throws when FIELD_ENCRYPTION_KEY is missing", () => {
    delete process.env.FIELD_ENCRYPTION_KEY
    try {
      expect(() => assertEncryptionConfigured()).toThrow(/FIELD_ENCRYPTION_KEY/)
    } finally {
      process.env.FIELD_ENCRYPTION_KEY = TEST_FIELD_KEY
    }
  })

  it("warns but does NOT throw when FIELD_HMAC_KEY is missing", () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
    delete process.env.FIELD_HMAC_KEY
    try {
      expect(() => assertEncryptionConfigured()).not.toThrow()
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("FIELD_HMAC_KEY"),
      )
    } finally {
      process.env.FIELD_HMAC_KEY = TEST_HMAC_KEY
      consoleSpy.mockRestore()
    }
  })
})

// ===========================================================================
// safePreview
// ===========================================================================

describe("safePreview", () => {
  it("returns em-dash for null", () => {
    expect(safePreview(null)).toBe("—")
  })

  it("returns em-dash for undefined", () => {
    expect(safePreview(undefined)).toBe("—")
  })

  it("returns em-dash for empty string", () => {
    expect(safePreview("")).toBe("—")
  })

  it("redacts short values entirely (length <= maxLen)", () => {
    expect(safePreview("ab")).toBe("••")
    expect(safePreview("abc")).toBe("•••")
    expect(safePreview("abcd")).toBe("••••")
  })

  it("redacts long values to maxLen bullets + ellipsis", () => {
    expect(safePreview("hello world", 4)).toBe("••••…")
    expect(safePreview("V-12345678", 4)).toBe("••••…")
  })

  it("uses default maxLen of 4", () => {
    expect(safePreview("V-12345678")).toBe("••••…")
  })

  it("never leaks plaintext content", () => {
    const preview = safePreview("confidential-PHI")
    expect(preview).not.toContain("confidential")
    expect(preview).not.toContain("PHI")
  })

  it("handles unicode without breaking", () => {
    // unicode chars still count as 1 each for length comparison
    const preview = safePreview("中文测试")
    expect(preview).not.toContain("中文")
    expect(preview).not.toContain("测试")
  })
})
