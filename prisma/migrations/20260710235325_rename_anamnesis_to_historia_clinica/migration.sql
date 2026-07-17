-- Rename anamnesis to historiaClinica across the schema.
-- Spanish-language terminology consistency: "historia clínica" is the
-- standard term used in Venezuelan medical practice and in the UI;
-- "anamnesis" is a legacy code name. UI strings and the AI prompt in
-- lib/ai/generate-report.ts were already updated in earlier commits —
-- this migration closes the gap at the DB layer.
--
-- Affected tables:
--   - Encounter.anamnesis (legacy plaintext)
--   - Encounter.anamnesisCifrada (AES-256-GCM ciphertext)
--   - EncounterTemplate.anamnesis (consultation template text)
--
-- RENAME COLUMN preserves data — the encrypted ciphertext in
-- `anamnesisCifrada` is decrypted using the same key, the new column
-- name does not affect the field-crypto layer.
--
-- The Prisma client regenerates automatically on `prisma generate` /
-- `next build`. No app code change is needed beyond the corresponding
-- TypeScript rename (already in this commit).

-- AlterTable
ALTER TABLE "Encounter" RENAME COLUMN "anamnesis" TO "historiaClinica";

-- AlterTable
ALTER TABLE "Encounter" RENAME COLUMN "anamnesisCifrada" TO "historiaClinicaCifrada";

-- AlterTable
ALTER TABLE "EncounterTemplate" RENAME COLUMN "anamnesis" TO "historiaClinica";
