-- AlterTable
ALTER TABLE "Encounter" ADD COLUMN "datosEspecialidad" JSONB;

-- AlterTable
ALTER TABLE "EncounterTemplate" ADD COLUMN "especialidad" TEXT;

-- AlterTable
ALTER TABLE "DocumentTemplate" ADD COLUMN "especialidad" TEXT;
