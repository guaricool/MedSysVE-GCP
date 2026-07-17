-- Tenant isolation: every Patient is now scoped to a Workspace.
--
-- Before this migration:
--   - Patient was a GLOBAL table keyed by (tipoIdentificacion, numeroIdentificacion).
--   - Doctor B could see Doctor A's patient row simply by typing the same cédula.
--   - This is a HIPAA/LOPDP data leak. Patient clinical context MUST be isolated per workspace.
--
-- After this migration:
--   - Patient.workspaceId is NOT NULL.
--   - The same person registered with two doctors exists as two Patients (one per workspace).
--   - PatientRegistration.workspaceId remains the authoritative tenant boundary.
--   - Cross-workspace lookup by cédula (for autofill at registration time) is supported
--     via the hmacCedula index; it does NOT return clinical rows, only personal info.

-- ────────────────────────────────────────────────────────────────────────────
-- Step 1: add workspaceId column (nullable, will be backfilled next).
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE "Patient"
  ADD COLUMN IF NOT EXISTS "workspaceId" TEXT;

-- ────────────────────────────────────────────────────────────────────────────
-- Step 2: backfill workspaceId from PatientRegistration.
--   - Every Patient created via patient.register() always has at least one
--     PatientRegistration, so the inner SELECT is safe.
--   - If a Patient exists without any registration (data anomaly, manual insert,
--     or partial migration), assign them to a sentinel workspace
--     'UNMIGRATED_PATIENTS' so the NOT NULL constraint later can hold.
--     Admins can fix this manually if it ever occurs.
-- ────────────────────────────────────────────────────────────────────────────

-- Ensure the sentinel workspace exists for any orphaned Patient rows.
INSERT INTO "Workspace" (
  "id", "nombre", "doctorId", "createdAt", "updatedAt",
  "recordatorioHoras", "recordatorioEmail"
)
SELECT
  'UNMIGRATED_PATIENTS',
  'Pacientes sin workspace (backfill)',
  (SELECT "id" FROM "Doctor" ORDER BY "createdAt" ASC LIMIT 1),
  NOW(),
  NOW(),
  24,
  TRUE
WHERE EXISTS (
  SELECT 1 FROM "Patient" p
  WHERE p."workspaceId" IS NULL
)
AND NOT EXISTS (
  SELECT 1 FROM "Workspace" WHERE "id" = 'UNMIGRATED_PATIENTS'
);

-- Backfill: pick the workspaceId from the FIRST registration of each Patient.
-- We use a LATERAL join to get the oldest registration per Patient.
UPDATE "Patient" p
SET "workspaceId" = sub.ws
FROM (
  SELECT DISTINCT ON (pr."patientId")
    pr."patientId" AS pid,
    pr."workspaceId" AS ws
  FROM "PatientRegistration" pr
  ORDER BY pr."patientId", pr."createdAt" ASC
) sub
WHERE p."id" = sub.pid
  AND p."workspaceId" IS NULL;

-- Catch any orphans (no registration at all).
UPDATE "Patient"
SET "workspaceId" = 'UNMIGRATED_PATIENTS'
WHERE "workspaceId" IS NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- Step 3: enforce NOT NULL.
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE "Patient"
  ALTER COLUMN "workspaceId" SET NOT NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- Step 4: drop the global uniqueness constraint and replace with workspace-scoped one.
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE "Patient"
  DROP CONSTRAINT IF EXISTS "Patient_tipoIdentificacion_numeroIdentificacion_key";

-- Note: the sinCedula rows have NULL numeroIdentificacion. Postgres treats NULL
-- as distinct in unique indexes, so multiple sinCedula Patients per workspace
-- are allowed. We add a partial unique index to keep the schema intent explicit.
CREATE UNIQUE INDEX IF NOT EXISTS "Patient_workspaceId_tipoIdentificacion_numeroIdentificacion_key"
  ON "Patient"("workspaceId", "tipoIdentificacion", "numeroIdentificacion")
  WHERE "numeroIdentificacion" IS NOT NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- Step 5: tenant index — every Patient query should be filtered by workspaceId.
-- ────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS "Patient_workspaceId_idx" ON "Patient"("workspaceId");

-- Foreign key to Workspace for referential integrity. ON DELETE RESTRICT
-- because deleting a workspace is a major operation that should be explicit.
ALTER TABLE "Patient"
  ADD CONSTRAINT "Patient_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id")
  ON DELETE RESTRICT
  ON UPDATE CASCADE;
