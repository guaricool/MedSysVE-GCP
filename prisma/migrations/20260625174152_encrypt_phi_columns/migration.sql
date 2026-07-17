-- ============================================================================
-- Migration: Encrypt PHI/PII columns (LOPDP Art. 5 — Datos Sensibles)
--
-- Strategy: ADDITIVE migration. New *Cifrado columns sit beside the plaintext
-- columns. Readers fall back to plaintext when *Cifrado is NULL (legacy rows).
-- Backfill script (`scripts/encrypt-existing-phi.ts`) populates the new columns
-- in batches, idempotently. Plaintext columns are NOT dropped in this migration
-- — that requires a separate audit + zero-data-loss gate, planned for after all
-- readers have been migrated.
--
-- Idempotent: every ALTER uses IF NOT EXISTS so this migration can be re-applied
-- safely against a DB that already has the columns (e.g. after a partial deploy).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Doctor — nombre, apellido, telefono (email stays plaintext: login key)
-- ---------------------------------------------------------------------------
ALTER TABLE "Doctor" ADD COLUMN IF NOT EXISTS "nombreCifrado"   TEXT;
ALTER TABLE "Doctor" ADD COLUMN IF NOT EXISTS "apellidoCifrado" TEXT;
ALTER TABLE "Doctor" ADD COLUMN IF NOT EXISTS "telefonoCifrado" TEXT;

-- ---------------------------------------------------------------------------
-- Clinic — nombre, razonSocial, direccion, telefono, email
-- ---------------------------------------------------------------------------
ALTER TABLE "Clinic" ADD COLUMN IF NOT EXISTS "nombreCifrado"       TEXT;
ALTER TABLE "Clinic" ADD COLUMN IF NOT EXISTS "razonSocialCifrada"  TEXT;
ALTER TABLE "Clinic" ADD COLUMN IF NOT EXISTS "direccionCifrada"    TEXT;
ALTER TABLE "Clinic" ADD COLUMN IF NOT EXISTS "telefonoCifrado"     TEXT;
ALTER TABLE "Clinic" ADD COLUMN IF NOT EXISTS "emailCifrado"        TEXT;

-- ---------------------------------------------------------------------------
-- Workspace — nombre, direccion, telefono, razonSocial, direccionFiscal
-- ---------------------------------------------------------------------------
ALTER TABLE "Workspace" ADD COLUMN IF NOT EXISTS "nombreCifrado"          TEXT;
ALTER TABLE "Workspace" ADD COLUMN IF NOT EXISTS "direccionCifrada"       TEXT;
ALTER TABLE "Workspace" ADD COLUMN IF NOT EXISTS "telefonoCifrado"        TEXT;
ALTER TABLE "Workspace" ADD COLUMN IF NOT EXISTS "razonSocialCifrada"     TEXT;
ALTER TABLE "Workspace" ADD COLUMN IF NOT EXISTS "direccionFiscalCifrada" TEXT;

-- ---------------------------------------------------------------------------
-- Patient — nombre, apellido, telefono, email (encrypted + HMAC index)
-- cedula is already encrypted (numeroIdentificacion + hmacCedula, separate
-- migration). Patient.fechaNacimiento stays plaintext: not PHI under LOPDP.
-- ---------------------------------------------------------------------------
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "nombreCifrado"   TEXT;
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "hmacNombre"      TEXT;
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "apellidoCifrado" TEXT;
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "hmacApellido"    TEXT;
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "telefonoCifrado" TEXT;
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "hmacTelefono"    TEXT;
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "emailCifrado"    TEXT;
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "hmacEmail"       TEXT;

CREATE INDEX IF NOT EXISTS "Patient_hmacNombre_idx"   ON "Patient" ("hmacNombre");
CREATE INDEX IF NOT EXISTS "Patient_hmacApellido_idx" ON "Patient" ("hmacApellido");
CREATE INDEX IF NOT EXISTS "Patient_hmacTelefono_idx" ON "Patient" ("hmacTelefono");
CREATE INDEX IF NOT EXISTS "Patient_hmacEmail_idx"    ON "Patient" ("hmacEmail");

-- ---------------------------------------------------------------------------
-- Document — contenidoHtml, aiDraft
-- ---------------------------------------------------------------------------
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "contenidoHtmlCifrado" TEXT;
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "aiDraftCifrado"       TEXT;

-- ---------------------------------------------------------------------------
-- LabResult — notas
-- ---------------------------------------------------------------------------
ALTER TABLE "LabResult" ADD COLUMN IF NOT EXISTS "notasCifradas" TEXT;

-- ---------------------------------------------------------------------------
-- Invoice — descripcion
-- ---------------------------------------------------------------------------
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "descripcionCifrada" TEXT;

-- ---------------------------------------------------------------------------
-- Mensaje — texto (doctor↔patient portal messages)
-- ---------------------------------------------------------------------------
ALTER TABLE "Mensaje" ADD COLUMN IF NOT EXISTS "textoCifrado" TEXT;

-- ---------------------------------------------------------------------------
-- AuditEvent — metadata (JSON serialized → encrypted text)
-- ---------------------------------------------------------------------------
ALTER TABLE "AuditEvent" ADD COLUMN IF NOT EXISTS "metadataCifrado" TEXT;

-- ============================================================================
-- Notes for Carlos:
-- 1. Backfill: `npx tsx scripts/encrypt-existing-phi.ts` (creates rows).
-- 2. Verify: `SELECT COUNT(*) FROM "Patient" WHERE "nombreCifrado" IS NULL;`
--    should return 0 after backfill.
-- 3. Field-level encryption is AES-256-GCM via lib/field-crypto.ts.
--    Requires env: FIELD_ENCRYPTION_KEY + FIELD_HMAC_KEY (already in Coolify).
-- ============================================================================