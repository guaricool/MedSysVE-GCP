-- ============================================================================
-- Migration: Location-aware doctor/clinic referrals (2026-06-27)
--
-- Carlos pidió que el sistema escale multi-ciudad:
--   - Clinic.estado + Clinic.ciudad donde opera la clínica.
--   - Workspace.estado + Workspace.ciudad donde trabaja el doctor.
--   - Doctor picker de referidos filtra por estado+ciudad exactos (no fuzzy),
--     así no se mezclan doctores de un extremo a otro del país
--     (ej: Maracaibo/Zulia NO aparece en Ciudad Bolívar/Bolívar).
--   - Clinic.invitationCode: código que el admin de la clínica comparte con
--     doctores externos para que se unan a la clínica con
--     workspace.joinClinicByCode (la clínica se crea PRIMERO, después los
--     doctores se unen).
--
-- Nullable en columnas existentes para no romper filas pre-feature. El gate
-- UI pide completar antes de habilitar el doctor picker de referidos.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Clinic
-- ---------------------------------------------------------------------------
ALTER TABLE "Clinic" ADD COLUMN IF NOT EXISTS "estado"           TEXT;
ALTER TABLE "Clinic" ADD COLUMN IF NOT EXISTS "ciudad"           TEXT;
ALTER TABLE "Clinic" ADD COLUMN IF NOT EXISTS "invitationCode"   TEXT;
ALTER TABLE "Clinic" ADD COLUMN IF NOT EXISTS "invitationCodeCreatedAt" TIMESTAMP(3);

-- Idempotent unique index for invitationCode (allows multiple NULL rows).
CREATE UNIQUE INDEX IF NOT EXISTS "Clinic_invitationCode_key" ON "Clinic" ("invitationCode");
-- Composite index for doctor picker "doctores en esta ciudad".
CREATE INDEX IF NOT EXISTS "Clinic_estado_ciudad_idx" ON "Clinic" ("estado", "ciudad");

-- ---------------------------------------------------------------------------
-- Workspace
-- ---------------------------------------------------------------------------
ALTER TABLE "Workspace" ADD COLUMN IF NOT EXISTS "estado" TEXT;
ALTER TABLE "Workspace" ADD COLUMN IF NOT EXISTS "ciudad" TEXT;

-- Composite index for doctor picker "workspaces en esta ciudad".
CREATE INDEX IF NOT EXISTS "Workspace_estado_ciudad_idx" ON "Workspace" ("estado", "ciudad");
