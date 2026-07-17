-- 2FA / TOTP support for doctors.
ALTER TABLE "Doctor"
  ADD COLUMN IF NOT EXISTS "cedulaCifrada" TEXT,
  ADD COLUMN IF NOT EXISTS "rifCifrado" TEXT,
  ADD COLUMN IF NOT EXISTS "totpSecret" TEXT,
  ADD COLUMN IF NOT EXISTS "totpEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "totpEnabledAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "totpLastUsed" TIMESTAMP(3);

CREATE TABLE "TwoFactorBackupCode" (
  "id"        TEXT NOT NULL,
  "doctorId"  TEXT NOT NULL,
  "codeHash"  TEXT NOT NULL,
  "usedAt"    TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "TwoFactorBackupCode_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TwoFactorBackupCode_doctorId_idx" ON "TwoFactorBackupCode"("doctorId");

ALTER TABLE "TwoFactorBackupCode"
  ADD CONSTRAINT "TwoFactorBackupCode_doctorId_fkey"
  FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;