-- AlterTable: per-encounter report override (selected SOAP sections)
ALTER TABLE "Encounter" ADD COLUMN "reportOverride" JSONB;
