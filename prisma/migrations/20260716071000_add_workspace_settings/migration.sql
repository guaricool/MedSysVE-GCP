-- AlterTable
ALTER TABLE "Workspace" ADD COLUMN "autoCreateHistoryOnEncounter" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "emailAppointmentReminders" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "allowedIps" TEXT;
