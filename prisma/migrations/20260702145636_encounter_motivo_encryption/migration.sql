-- Add encrypted motivo columns to Encounter (item #1 audit)
--
-- Pattern matches existing anamnesisCifrada / planCifrado:
--   motivoCifrado: AES-256-GCM ciphertext (base64 envelope)
--   motivoHmac:    HMAC-SHA-256 index for searchable encryption
--   motivo (legacy plaintext) is kept as fallback during the
--   transition window, then dropped after backfill verification.
--
-- The migration script that follows (`scripts/migrations/<ts>_encrypt_motivo.ts`)
-- encrypts existing plaintext motivo rows into motivoCifrado and
-- populates motivoHmac. Until that script runs, motivoCifrado is NULL
-- and reads fall back to the legacy plaintext via readEncounterMotivo.

ALTER TABLE "Encounter" ADD COLUMN "motivoCifrado" TEXT;
ALTER TABLE "Encounter" ADD COLUMN "motivoHmac"   TEXT;