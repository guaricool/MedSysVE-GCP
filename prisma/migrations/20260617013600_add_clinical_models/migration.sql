-- CreateEnum
CREATE TYPE "EncounterStatus" AS ENUM ('DRAFT', 'SIGNED', 'AMENDED');

-- CreateEnum
CREATE TYPE "DiagnosisTipo" AS ENUM ('PRINCIPAL', 'SECUNDARIO');

-- CreateEnum
CREATE TYPE "DocumentTipo" AS ENUM ('INFORME', 'REPOSO', 'REFERIDO', 'CERTIFICADO', 'RECETA');

-- CreateTable
CREATE TABLE "Encounter" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "patientRegistrationId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "motivo" TEXT,
    "anamnesis" TEXT,
    "vitales" JSONB,
    "examenFisico" JSONB,
    "status" "EncounterStatus" NOT NULL DEFAULT 'DRAFT',
    "signedAt" TIMESTAMP(3),
    "signedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Encounter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Diagnosis" (
    "id" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "codigoCie10" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "tipo" "DiagnosisTipo" NOT NULL DEFAULT 'PRINCIPAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Diagnosis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Medication" (
    "id" TEXT NOT NULL,
    "nombreGenerico" TEXT NOT NULL,
    "nombresComerciales" TEXT[],
    "concentraciones" TEXT[],
    "formaFarmaceutica" TEXT NOT NULL,
    "viaAdministracion" TEXT NOT NULL,
    "dosisDefaults" JSONB,
    "categoria" TEXT NOT NULL,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "workspaceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Medication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prescription" (
    "id" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "pdfUrl" TEXT,
    "impresa" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Prescription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrescriptionItem" (
    "id" TEXT NOT NULL,
    "prescriptionId" TEXT NOT NULL,
    "medicationId" TEXT NOT NULL,
    "concentracion" TEXT NOT NULL,
    "dosis" TEXT NOT NULL,
    "frecuencia" TEXT NOT NULL,
    "duracion" TEXT NOT NULL,
    "indicacionesEspeciales" TEXT,
    "overrideAlerta" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PrescriptionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabOrder" (
    "id" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "estudios" TEXT[],
    "indicacionesClinicas" TEXT,
    "urgente" BOOLEAN NOT NULL DEFAULT false,
    "pdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LabOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImagingOrder" (
    "id" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "tipoImagen" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "indicacionesClinicas" TEXT,
    "urgente" BOOLEAN NOT NULL DEFAULT false,
    "pdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImagingOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "encounterId" TEXT,
    "patientRegistrationId" TEXT NOT NULL,
    "tipo" "DocumentTipo" NOT NULL,
    "contenidoHtml" TEXT NOT NULL,
    "aiDraft" TEXT,
    "pdfUrl" TEXT,
    "firmadoAt" TIMESTAMP(3),
    "firmadoPor" TEXT,
    "visibleEnPortal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Encounter_workspaceId_idx" ON "Encounter"("workspaceId");

-- CreateIndex
CREATE INDEX "Encounter_patientRegistrationId_idx" ON "Encounter"("patientRegistrationId");

-- CreateIndex
CREATE INDEX "Encounter_doctorId_idx" ON "Encounter"("doctorId");

-- CreateIndex
CREATE INDEX "Diagnosis_encounterId_idx" ON "Diagnosis"("encounterId");

-- CreateIndex
CREATE INDEX "Medication_nombreGenerico_idx" ON "Medication"("nombreGenerico");

-- CreateIndex
CREATE INDEX "Medication_categoria_idx" ON "Medication"("categoria");

-- CreateIndex
CREATE INDEX "Medication_workspaceId_idx" ON "Medication"("workspaceId");

-- CreateIndex
CREATE INDEX "Prescription_encounterId_idx" ON "Prescription"("encounterId");

-- CreateIndex
CREATE INDEX "PrescriptionItem_prescriptionId_idx" ON "PrescriptionItem"("prescriptionId");

-- CreateIndex
CREATE INDEX "PrescriptionItem_medicationId_idx" ON "PrescriptionItem"("medicationId");

-- CreateIndex
CREATE INDEX "LabOrder_encounterId_idx" ON "LabOrder"("encounterId");

-- CreateIndex
CREATE INDEX "ImagingOrder_encounterId_idx" ON "ImagingOrder"("encounterId");

-- CreateIndex
CREATE INDEX "Document_encounterId_idx" ON "Document"("encounterId");

-- CreateIndex
CREATE INDEX "Document_patientRegistrationId_idx" ON "Document"("patientRegistrationId");

-- AddForeignKey
ALTER TABLE "Encounter" ADD CONSTRAINT "Encounter_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Encounter" ADD CONSTRAINT "Encounter_patientRegistrationId_fkey" FOREIGN KEY ("patientRegistrationId") REFERENCES "PatientRegistration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Diagnosis" ADD CONSTRAINT "Diagnosis_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionItem" ADD CONSTRAINT "PrescriptionItem_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "Prescription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionItem" ADD CONSTRAINT "PrescriptionItem_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "Medication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabOrder" ADD CONSTRAINT "LabOrder_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImagingOrder" ADD CONSTRAINT "ImagingOrder_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_patientRegistrationId_fkey" FOREIGN KEY ("patientRegistrationId") REFERENCES "PatientRegistration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
