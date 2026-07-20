-- AlterTable
ALTER TABLE "VerificationIntent" ALTER COLUMN "portalUserId" DROP NOT NULL;
ALTER TABLE "VerificationIntent" ADD COLUMN "registrationData" TEXT;
