-- Add DoctorReportPreferences + Document.reportOverride for the
-- customizable medical report (informe) feature.
--
-- Motivation (2026-07-11):
-- The current `document.generateAIDraft` always emits every SOAP section
-- the encounter has data for. Doctors want control:
--   1. Per-doctor default section set + per-section instructions (profile).
--   2. Per-consulta override for special cases (stored on the Document).
--
-- The hard rule: NEVER invent clinical data. The AI prompt only emits
-- sections the doctor has explicitly enabled; if a section is enabled
-- but empty in the consulta, the prompt emits a "no data" placeholder
-- (see lib/ai/generate-report.ts).

-- CreateTable
CREATE TABLE "DoctorReportPreferences" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "secciones" JSONB NOT NULL,
    "instruccionesDefault" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DoctorReportPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DoctorReportPreferences_doctorId_key" ON "DoctorReportPreferences"("doctorId");

-- AddForeignKey
ALTER TABLE "DoctorReportPreferences" ADD CONSTRAINT "DoctorReportPreferences_doctorId_fkey"
    FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: per-consulta override (delta vs. doctor's default prefs)
ALTER TABLE "Document" ADD COLUMN "reportOverride" JSONB;
