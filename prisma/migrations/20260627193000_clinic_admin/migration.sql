-- CreateEnum: ClinicAdminRole
CREATE TYPE "ClinicAdminRole" AS ENUM ('OWNER', 'MANAGER');

-- CreateTable: ClinicAdmin
CREATE TABLE "ClinicAdmin" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "telefono" TEXT,
    "role" "ClinicAdminRole" NOT NULL DEFAULT 'OWNER',
    "clinicId" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClinicAdmin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: unique email
CREATE UNIQUE INDEX "ClinicAdmin_email_key" ON "ClinicAdmin"("email");

-- CreateIndex: clinicId lookup
CREATE INDEX "ClinicAdmin_clinicId_idx" ON "ClinicAdmin"("clinicId");

-- CreateIndex: email lookup
CREATE INDEX "ClinicAdmin_email_idx" ON "ClinicAdmin"("email");

-- AddForeignKey: clinicId -> Clinic.id (cascade delete — if clinic is deleted, its admins go too)
ALTER TABLE "ClinicAdmin" ADD CONSTRAINT "ClinicAdmin_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;