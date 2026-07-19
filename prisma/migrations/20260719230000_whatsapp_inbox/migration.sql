-- CreateEnum
CREATE TYPE "MensajeCanal" AS ENUM ('PORTAL', 'WHATSAPP');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'WHATSAPP_MESSAGE';

-- AlterTable
ALTER TABLE "Mensaje" ADD COLUMN "canal" "MensajeCanal" NOT NULL DEFAULT 'PORTAL';
