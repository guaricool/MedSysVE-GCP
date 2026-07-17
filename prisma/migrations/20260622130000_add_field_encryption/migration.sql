-- Field-level encryption columns (AES-256-GCM).
-- Existing plaintext columns are kept for back-compat / migration window;
-- application code writes only to the Cifrada columns going forward.

ALTER TABLE "Patient"
  ADD COLUMN IF NOT EXISTS "hmacCedula" TEXT;

CREATE INDEX IF NOT EXISTS "Patient_hmacCedula_idx" ON "Patient"("hmacCedula");

ALTER TABLE "Encounter"
  ADD COLUMN IF NOT EXISTS "anamnesisCifrada" TEXT,
  ADD COLUMN IF NOT EXISTS "planCifrado" TEXT;