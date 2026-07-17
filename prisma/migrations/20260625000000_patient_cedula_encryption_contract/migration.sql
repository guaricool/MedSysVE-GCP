-- Migration: ensure Patient.numeroIdentificacion is interpreted as encrypted
-- storage and that the hmacCedula index is properly populated.
--
-- The column type does NOT change (still TEXT); the contract is that all
-- writes go through lib/patient-crypto.ts and all reads decrypt via
-- readPatientCedula(). This migration is a no-op at the SQL level but
-- documents the contract for future schema reviewers.
--
-- The actual encryption of any pre-existing plaintext rows is handled by
-- scripts/migrate-encrypt-patient-cedula.ts which must be run separately.

-- Confirm the hmacCedula index exists (it was added in a previous migration;
-- this is a safety net for environments where it may have been missed).
CREATE INDEX IF NOT EXISTS "Patient_hmacCedula_idx" ON "Patient"("hmacCedula");

-- Backfill hmacCedula for rows where it is NULL but numeroIdentificacion is
-- not NULL. Done in application code by the migrate script — SQL cannot
-- call Node crypto. This is a marker comment only.