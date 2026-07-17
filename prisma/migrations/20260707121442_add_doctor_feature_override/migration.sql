-- Audit S10 (2026-07-07): per-doctor feature-flag override (closes audit #15).
--
-- Adds DoctorFeatureOverride. One row per (doctorId, flagKey) combo.
-- TTL via expiresAt; admin who set it is tracked for audit.

CREATE TABLE "DoctorFeatureOverride" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "flagKey" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "reason" TEXT,
    "expiresAt" TIMESTAMP(3),
    "setByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DoctorFeatureOverride_pkey" PRIMARY KEY ("id")
);

-- One override per (doctor, flagKey). Re-setting the same key upserts the
-- existing row instead of creating duplicates.
CREATE UNIQUE INDEX "DoctorFeatureOverride_doctorId_flagKey_key"
    ON "DoctorFeatureOverride"("doctorId", "flagKey");

-- Quick lookup "is there an active override for flag X?"
CREATE INDEX "DoctorFeatureOverride_flagKey_idx"
    ON "DoctorFeatureOverride"("flagKey");

-- Cron-friendly: a future cleanup job can `DELETE WHERE expiresAt < now()`
-- in bulk without a table scan.
CREATE INDEX "DoctorFeatureOverride_expiresAt_idx"
    ON "DoctorFeatureOverride"("expiresAt");

-- Foreign keys. setByUserId uses NoAction (we don't want to cascade-delete
-- audit trail when an admin is removed — historical overrides stay).
ALTER TABLE "DoctorFeatureOverride"
    ADD CONSTRAINT "DoctorFeatureOverride_doctorId_fkey"
    FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE CASCADE
    ON UPDATE CASCADE;

ALTER TABLE "DoctorFeatureOverride"
    ADD CONSTRAINT "DoctorFeatureOverride_setByUserId_fkey"
    FOREIGN KEY ("setByUserId") REFERENCES "Doctor"("id") ON DELETE NO ACTION
    ON UPDATE CASCADE;
