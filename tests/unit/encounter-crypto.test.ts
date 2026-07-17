import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { packEncounterMotivo, readEncounterMotivo } from "@/lib/encounter-crypto"
import {
  encryptField,
  decryptField,
  hmacIndex,
} from "@/lib/field-crypto"
import crypto from "crypto"

// ---------------------------------------------------------------------------
// Test setup — provide encryption keys via env. Required by field-crypto.ts
// before any encryption/decryption call.
// ---------------------------------------------------------------------------
const TEST_FIELD_KEY = crypto.randomBytes(32).toString("base64") // 32 bytes
const TEST_HMAC_KEY = crypto.randomBytes(32).toString("base64") // 32 bytes

const ORIGINAL_FIELD_KEY = process.env.FIELD_ENCRYPTION_KEY
const ORIGINAL_HMAC_KEY = process.env.FIELD_HMAC_KEY

beforeAll(() => {
  process.env.FIELD_ENCRYPTION_KEY = TEST_FIELD_KEY
  process.env.FIELD_HMAC_KEY = TEST_HMAC_KEY
})

afterAll(() => {
  // Restore original env so other tests aren't polluted
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
// packEncounterMotivo
// ===========================================================================

describe("packEncounterMotivo", () => {
  it("encrypts a non-empty motivo and produces matching HMAC index", () => {
    const motivo = "Control de hipertensión arterial"
    const result = packEncounterMotivo({ motivo })

    expect(result.motivoCifrado).not.toBeNull()
    expect(result.motivoHmac).not.toBeNull()

    // The HMAC must match the index of the (un-trimmed) motivo
    expect(result.motivoHmac).toBe(hmacIndex(motivo))

    // The cipher must decrypt to the original (pack trims internally)
    expect(decryptField(result.motivoCifrado!)).toBe(motivo.trim())
  })

  it("trims whitespace before encrypting", () => {
    const motivo = "  Diabetes tipo 2  "
    const result = packEncounterMotivo({ motivo })
    expect(decryptField(result.motivoCifrado!)).toBe("Diabetes tipo 2")
  })

  it("returns null/null for empty motivo string", () => {
    const result = packEncounterMotivo({ motivo: "" })
    expect(result.motivoCifrado).toBeNull()
    expect(result.motivoHmac).toBeNull()
  })

  it("returns null/null for null motivo", () => {
    const result = packEncounterMotivo({ motivo: null })
    expect(result.motivoCifrado).toBeNull()
    expect(result.motivoHmac).toBeNull()
  })

  it("returns null/null for undefined motivo", () => {
    const result = packEncounterMotivo({ motivo: undefined })
    expect(result.motivoCifrado).toBeNull()
    expect(result.motivoHmac).toBeNull()
  })

  it("returns null/null for whitespace-only motivo (after trim)", () => {
    const result = packEncounterMotivo({ motivo: "   \t\n  " })
    expect(result.motivoCifrado).toBeNull()
    expect(result.motivoHmac).toBeNull()
  })

  it("produces the same HMAC index for repeated identical motivo", () => {
    const motivo = "Same motivo twice"
    const a = packEncounterMotivo({ motivo })
    const b = packEncounterMotivo({ motivo })
    // HMAC is deterministic — same input → same index
    expect(a.motivoHmac).toBe(b.motivoHmac)
    // Cipher uses random IV, so ciphertext differs even though plaintext is same
    expect(a.motivoCifrado).not.toBe(b.motivoCifrado)
    expect(decryptField(a.motivoCifrado!)).toBe(motivo.trim())
    expect(decryptField(b.motivoCifrado!)).toBe(motivo.trim())
  })

  it("uses random IV per call (different ciphertext for same plaintext)", () => {
    const motivo = "Same motivo twice"
    const a = packEncounterMotivo({ motivo })
    const b = packEncounterMotivo({ motivo })
    expect(a.motivoCifrado).not.toBe(b.motivoCifrado)
  })

  it("produces different HMAC for different motivo", () => {
    const a = packEncounterMotivo({ motivo: "motivo A" })
    const b = packEncounterMotivo({ motivo: "motivo B" })
    expect(a.motivoHmac).not.toBe(b.motivoHmac)
  })

  it("treats motivo that differs only in leading/trailing whitespace as the SAME index (since we trim)", () => {
    const a = packEncounterMotivo({ motivo: "Diabetes" })
    const b = packEncounterMotivo({ motivo: "  Diabetes  " })
    expect(a.motivoHmac).toBe(b.motivoHmac)
  })

  it("preserves unicode (accents, ñ, emoji)", () => {
    const motivo = "Paciente con diagnóstico de gripe — síntomas: fiebre, tos. 🩺"
    const result = packEncounterMotivo({ motivo })
    expect(decryptField(result.motivoCifrado!)).toBe(motivo.trim())
  })

  it("preserves multiline strings (newlines)", () => {
    const motivo = "Línea 1\nLínea 2\nLínea 3"
    const result = packEncounterMotivo({ motivo })
    expect(decryptField(result.motivoCifrado!)).toBe(motivo.trim())
  })

  it("handles long strings (10 KB)", () => {
    const motivo = "x".repeat(10_000)
    const result = packEncounterMotivo({ motivo })
    expect(decryptField(result.motivoCifrado!)).toBe(motivo)
  })

  it("refuses to encrypt without FIELD_ENCRYPTION_KEY set", () => {
    delete process.env.FIELD_ENCRYPTION_KEY
    try {
      expect(() => packEncounterMotivo({ motivo: "test" })).toThrow(
        /FIELD_ENCRYPTION_KEY/,
      )
    } finally {
      process.env.FIELD_ENCRYPTION_KEY = TEST_FIELD_KEY
    }
  })
})

// ===========================================================================
// readEncounterMotivo
//
// Note: motivo is read ONLY from motivoCifrado. The legacy plaintext motivo
// column was dropped in migration 20260703010000_drop_encounter_motivo_legacy.
// All read paths expect motivoCifrado to be present; if absent or corrupt,
// readEncounterMotivo returns undefined (UI shows empty rather than 500).
// ===========================================================================

describe("readEncounterMotivo", () => {
  it("decrypts ciphertext from motivoCifrado", () => {
    const motivo = "Encrypted motivo"
    const packed = packEncounterMotivo({ motivo })
    const result = readEncounterMotivo({
      motivoCifrado: packed.motivoCifrado,
    })
    expect(result).toBe(motivo.trim())
  })

  it("returns undefined when motivoCifrado is null", () => {
    expect(readEncounterMotivo({ motivoCifrado: null })).toBeUndefined()
    expect(readEncounterMotivo({ motivoCifrado: undefined })).toBeUndefined()
  })

  it("returns undefined when motivoCifrado is empty string", () => {
    expect(readEncounterMotivo({ motivoCifrado: "" })).toBeUndefined()
  })

  it("returns undefined when motivoCifrado is corrupt (not valid base64)", () => {
    const result = readEncounterMotivo({
      motivoCifrado: "not-valid-base64-!!!@@",
    })
    // Decryption throws → catch → return undefined (no plaintext fallback)
    expect(result).toBeUndefined()
  })

  it("returns undefined when motivoCifrado is too short for IV+tag", () => {
    // 10 bytes is less than IV(12) + tag(16) = 28 bytes
    const shortB64 = Buffer.from("short").toString("base64")
    const result = readEncounterMotivo({
      motivoCifrado: shortB64,
    })
    expect(result).toBeUndefined()
  })

  it("detects tampered ciphertext (GCM auth tag fails)", () => {
    const motivo = "Honest motivo"
    const packed = packEncounterMotivo({ motivo })
    // Flip a byte in the middle of the ciphertext (skip IV and tag regions)
    const buf = Buffer.from(packed.motivoCifrado!, "base64")
    // buf is: [IV 12 bytes][ciphertext N bytes][tag 16 bytes]
    // Flip a byte in the ciphertext region (byte index 12, i.e. right after IV)
    buf[12] = buf[12] ^ 0x01
    const tampered = buf.toString("base64")

    const result = readEncounterMotivo({
      motivoCifrado: tampered,
    })
    // Tampering is detected → decryption throws → catch → return undefined
    expect(result).toBeUndefined()
  })

  it("detects tampered auth tag (last byte flipped)", () => {
    const motivo = "Honest motivo"
    const packed = packEncounterMotivo({ motivo })
    const buf = Buffer.from(packed.motivoCifrado!, "base64")
    // Flip a byte in the tag region (last byte)
    buf[buf.length - 1] = buf[buf.length - 1] ^ 0x01
    const tampered = buf.toString("base64")

    const result = readEncounterMotivo({
      motivoCifrado: tampered,
    })
    expect(result).toBeUndefined()
  })

  it("detects when decryption uses a different key (key rotation mismatch)", () => {
    const motivo = "Will be encrypted with key A"
    const packed = packEncounterMotivo({ motivo })

    // Swap to a different key
    const otherKey = crypto.randomBytes(32).toString("base64")
    process.env.FIELD_ENCRYPTION_KEY = otherKey
    try {
      const result = readEncounterMotivo({
        motivoCifrado: packed.motivoCifrado,
      })
      // GCM auth tag fails → catch → return undefined
      expect(result).toBeUndefined()
    } finally {
      process.env.FIELD_ENCRYPTION_KEY = TEST_FIELD_KEY
    }
  })

  it("decrypts ciphertext encrypted with a different key when THAT key is in env (key rotation)", () => {
    // Simulates a key rotation: data was encrypted with KEY_OLD, we set KEY_NEW,
    // then we set KEY_OLD back temporarily to read the old data.
    const oldKey = crypto.randomBytes(32).toString("base64")
    process.env.FIELD_ENCRYPTION_KEY = oldKey
    const motivo = "Encrypted under old key"
    const packed = packEncounterMotivo({ motivo })

    // Switch to new key — should fail
    process.env.FIELD_ENCRYPTION_KEY = TEST_FIELD_KEY
    expect(() => readEncounterMotivo({ motivoCifrado: packed.motivoCifrado })).not.toThrow()
    const failedResult = readEncounterMotivo({
      motivoCifrado: packed.motivoCifrado,
    })
    expect(failedResult).toBeUndefined() // wrong key → fail → undefined

    // Restore old key — should succeed
    process.env.FIELD_ENCRYPTION_KEY = oldKey
    const result = readEncounterMotivo({
      motivoCifrado: packed.motivoCifrado,
    })
    expect(result).toBe(motivo.trim())

    // Restore test key for downstream tests
    process.env.FIELD_ENCRYPTION_KEY = TEST_FIELD_KEY
  })
})

// ===========================================================================
// pack → read roundtrip
// ===========================================================================

describe("pack → read roundtrip", () => {
  const samples = [
    "Short",
    "A medium length motivo with multiple words and punctuation, including commas.",
    "Línea con acentos y eñe — caracteres del español.",
    "Multi\nline\nmotivo\nwith\nfive\nlines.",
    "🩺 Paciente con emoji y caracteres unicode variados: 中文 العربية",
    "  Leading and trailing whitespace should be trimmed by pack  ",
    "x".repeat(5_000), // 5 KB
  ]

  for (const motivo of samples) {
    it(`roundtrips: ${motivo.length > 60 ? motivo.slice(0, 60) + "…" : motivo}`, () => {
      const packed = packEncounterMotivo({ motivo })
      const decrypted = readEncounterMotivo({ motivoCifrado: packed.motivoCifrado })

      // The decrypted value should equal the trimmed motivo (because pack trims)
      const expected = motivo.trim()
      expect(decrypted).toBe(expected)
    })
  }

  it("preserves unicode exactly across roundtrip", () => {
    const motivo = "Motivo 中文 — ñáéíóú — 🏥💊📋"
    const packed = packEncounterMotivo({ motivo })
    const decrypted = readEncounterMotivo({ motivoCifrado: packed.motivoCifrado })
    expect(decrypted).toBe(motivo.trim())
  })
})

// ===========================================================================
// HMAC index semantics
// ===========================================================================

describe("HMAC index (motivoHmac)", () => {
  it("is lowercase-normalized so 'Diabetes' and 'diabetes' produce the same index", () => {
    const a = packEncounterMotivo({ motivo: "Diabetes" })
    const b = packEncounterMotivo({ motivo: "diabetes" })
    const c = packEncounterMotivo({ motivo: "DIABETES" })
    expect(a.motivoHmac).toBe(b.motivoHmac)
    expect(b.motivoHmac).toBe(c.motivoHmac)
  })

  it("is whitespace-trimmed for the index (consistent with pack)", () => {
    const a = packEncounterMotivo({ motivo: "Diabetes" })
    const b = packEncounterMotivo({ motivo: "  Diabetes  " })
    expect(a.motivoHmac).toBe(b.motivoHmac)
  })

  it("is base64-shaped (no padding-trimmed base64)", () => {
    const { motivoHmac } = packEncounterMotivo({ motivo: "Test motivo" })
    expect(motivoHmac).toMatch(/^[A-Za-z0-9+/]+=*$/)
  })

  it("is deterministic — same input always produces the same index", () => {
    const a = packEncounterMotivo({ motivo: "Stable input" })
    const b = packEncounterMotivo({ motivo: "Stable input" })
    const c = packEncounterMotivo({ motivo: "Stable input" })
    expect(a.motivoHmac).toBe(b.motivoHmac)
    expect(b.motivoHmac).toBe(c.motivoHmac)
  })
})