-- Migration: legal compliance foundation (Fase 35)
--
-- Adds the five tables needed for:
--   * LOPDP Art. 25 — Consentimiento expreso del profesional (al registrarse)
--   * LOPDP Art. 32 — Trazabilidad de la prueba del consentimiento
--   * LOPDP Art. 60 — Derecho de acceso / portabilidad (solicitudes del paciente)
--   * LOPDP Art. 61 — Derecho de cancelación (anonimización, no destrucción)
--   * LOPDP Art. 64 — Deber de notificación de incidentes (BreachIncident)
--
-- Plus: a per-doctor `currentLegalVersion` cursor so we can force re-acceptance
--       when ToS/Privacy/Cookies change.
--
-- Idempotent: every CREATE / ADD uses IF NOT EXISTS so the migration is safe
-- to re-apply after a partial failure (P3009). Foreign-key constraints are
-- dropped-and-recreated to avoid "constraint already exists" errors.

-- ---------------------------------------------------------------------------
-- 1. Doctor.currentLegalVersion cursor
-- ---------------------------------------------------------------------------

ALTER TABLE "Doctor" ADD COLUMN IF NOT EXISTS "currentLegalVersion" TEXT;

-- ---------------------------------------------------------------------------
-- 2. LegalVersion (versioned snapshot of each legal document)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "LegalVersion" (
    "id"            TEXT NOT NULL,
    "slug"          TEXT NOT NULL,
    "version"       TEXT NOT NULL,
    "title"         TEXT NOT NULL,
    "contentHash"   TEXT NOT NULL,
    "effectiveAt"   TIMESTAMP(3) NOT NULL,
    "publishedBy"   TEXT,
    "notes"         TEXT,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LegalVersion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "LegalVersion_slug_version_key" ON "LegalVersion"("slug", "version");
CREATE INDEX IF NOT EXISTS "LegalVersion_slug_effectiveAt_idx" ON "LegalVersion"("slug", "effectiveAt");

-- ---------------------------------------------------------------------------
-- 3. ConsentAcceptance (proof of consent per legal doc)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "ConsentAcceptance" (
    "id"              TEXT NOT NULL,
    "doctorId"        TEXT NOT NULL,
    "legalVersionId"  TEXT NOT NULL,
    "slug"            TEXT NOT NULL,
    "version"         TEXT NOT NULL,
    "ip"              TEXT,
    "userAgent"       TEXT,
    "explicit"        BOOLEAN NOT NULL DEFAULT true,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsentAcceptance_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ConsentAcceptance_doctorId_createdAt_idx" ON "ConsentAcceptance"("doctorId", "createdAt");
CREATE INDEX IF NOT EXISTS "ConsentAcceptance_legalVersionId_idx" ON "ConsentAcceptance"("legalVersionId");
CREATE INDEX IF NOT EXISTS "ConsentAcceptance_slug_version_idx" ON "ConsentAcceptance"("slug", "version");

-- Drop-then-create FKs so this migration is idempotent against partial state.
ALTER TABLE "ConsentAcceptance" DROP CONSTRAINT IF EXISTS "ConsentAcceptance_doctorId_fkey";
ALTER TABLE "ConsentAcceptance" DROP CONSTRAINT IF EXISTS "ConsentAcceptance_legalVersionId_fkey";

ALTER TABLE "ConsentAcceptance"
    ADD CONSTRAINT "ConsentAcceptance_doctorId_fkey"
    FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ConsentAcceptance"
    ADD CONSTRAINT "ConsentAcceptance_legalVersionId_fkey"
    FOREIGN KEY ("legalVersionId") REFERENCES "LegalVersion"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- 4. DataExportRequest (LOPDP Art. 60 — Acceso / Portabilidad)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "DataExportRequest" (
    "id"                TEXT NOT NULL,
    "doctorId"          TEXT NOT NULL,
    "patientCedulaHMAC" TEXT,
    "scope"             TEXT NOT NULL,
    "status"            TEXT NOT NULL DEFAULT 'REQUESTED',
    "downloadToken"     TEXT,
    "downloadUrl"       TEXT,
    "expiresAt"         TIMESTAMP(3),
    "requestedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readyAt"           TIMESTAMP(3),
    "downloadedAt"      TIMESTAMP(3),
    "closedAt"          TIMESTAMP(3),
    "ip"                TEXT,
    "notes"             TEXT,

    CONSTRAINT "DataExportRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "DataExportRequest_downloadToken_key" ON "DataExportRequest"("downloadToken");
CREATE INDEX IF NOT EXISTS "DataExportRequest_doctorId_requestedAt_idx" ON "DataExportRequest"("doctorId", "requestedAt");
CREATE INDEX IF NOT EXISTS "DataExportRequest_status_expiresAt_idx" ON "DataExportRequest"("status", "expiresAt");

ALTER TABLE "DataExportRequest" DROP CONSTRAINT IF EXISTS "DataExportRequest_doctorId_fkey";

ALTER TABLE "DataExportRequest"
    ADD CONSTRAINT "DataExportRequest_doctorId_fkey"
    FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- 5. DataDeletionRequest (LOPDP Art. 61 — Cancelación / Anonimización)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "DataDeletionRequest" (
    "id"                TEXT NOT NULL,
    "doctorId"          TEXT NOT NULL,
    "patientCedulaHMAC" TEXT,
    "status"            TEXT NOT NULL DEFAULT 'REQUESTED',
    "reason"            TEXT,
    "approvedAt"        TIMESTAMP(3),
    "appliedAt"         TIMESTAMP(3),
    "tombstoneId"       TEXT,
    "ip"                TEXT,
    "requestedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataDeletionRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "DataDeletionRequest_doctorId_requestedAt_idx" ON "DataDeletionRequest"("doctorId", "requestedAt");
CREATE INDEX IF NOT EXISTS "DataDeletionRequest_status_idx" ON "DataDeletionRequest"("status");

ALTER TABLE "DataDeletionRequest" DROP CONSTRAINT IF EXISTS "DataDeletionRequest_doctorId_fkey";

ALTER TABLE "DataDeletionRequest"
    ADD CONSTRAINT "DataDeletionRequest_doctorId_fkey"
    FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- 6. BreachIncident (LOPDP Art. 64 — Notificación de incidentes)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "BreachIncident" (
    "id"                TEXT NOT NULL,
    "slug"              TEXT NOT NULL,
    "title"             TEXT NOT NULL,
    "severity"          TEXT NOT NULL,
    "status"            TEXT NOT NULL DEFAULT 'INVESTIGATING',
    "detectedAt"        TIMESTAMP(3) NOT NULL,
    "containedAt"       TIMESTAMP(3),
    "notifiedAt"        TIMESTAMP(3),
    "closedAt"          TIMESTAMP(3),
    "affectedUsers"     INTEGER NOT NULL DEFAULT 0,
    "affectedWorkspaces" INTEGER NOT NULL DEFAULT 0,
    "dataCategories"    TEXT[],
    "description"       TEXT NOT NULL,
    "rootCause"         TEXT,
    "remediation"       TEXT,
    "reportedBy"        TEXT,
    "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"         TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BreachIncident_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "BreachIncident_slug_key" ON "BreachIncident"("slug");
CREATE INDEX IF NOT EXISTS "BreachIncident_status_detectedAt_idx" ON "BreachIncident"("status", "detectedAt");
CREATE INDEX IF NOT EXISTS "BreachIncident_severity_detectedAt_idx" ON "BreachIncident"("severity", "detectedAt");