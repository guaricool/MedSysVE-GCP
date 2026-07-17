-- DropIndex
DROP INDEX "Clinic_invitationCode_key";

-- AlterTable
ALTER TABLE "Clinic" DROP COLUMN "invitationCode",
DROP COLUMN "invitationCodeCreatedAt";

-- CreateTable
CREATE TABLE "ClinicInvitationCode" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "usedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClinicInvitationCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClinicInvitationCode_code_key" ON "ClinicInvitationCode"("code");

-- CreateIndex
CREATE INDEX "ClinicInvitationCode_clinicId_idx" ON "ClinicInvitationCode"("clinicId");

-- AddForeignKey
ALTER TABLE "ClinicInvitationCode" ADD CONSTRAINT "ClinicInvitationCode_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicInvitationCode" ADD CONSTRAINT "ClinicInvitationCode_usedById_fkey" FOREIGN KEY ("usedById") REFERENCES "Doctor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
