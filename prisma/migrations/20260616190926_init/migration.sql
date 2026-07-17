-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('SECRETARY', 'ASSISTANT', 'NURSE');

-- CreateEnum
CREATE TYPE "ClinicRole" AS ENUM ('OWNER', 'STAFF', 'CONTRACTOR');

-- CreateEnum
CREATE TYPE "IdentificationType" AS ENUM ('CEDULA_V', 'CEDULA_E', 'PASAPORTE');

-- CreateEnum
CREATE TYPE "ParentRelationship" AS ENUM ('PADRE', 'MADRE', 'TUTOR_LEGAL', 'OTRO');

-- CreateTable
CREATE TABLE "Doctor" (
    "id" TEXT NOT NULL,
    "cedula" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "telefono" TEXT,
    "fotoUrl" TEXT,
    "especialidadPrincipal" TEXT NOT NULL,
    "subEspecialidades" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "rif" TEXT,
    "datosFiscales" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Doctor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Clinic" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "rif" TEXT,
    "razonSocial" TEXT,
    "direccion" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "website" TEXT,
    "logoUrl" TEXT,
    "bannerUrl" TEXT,
    "descripcion" TEXT,
    "servicios" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "redesSociales" JSONB,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Clinic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoctorClinicAffiliation" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "rol" "ClinicRole" NOT NULL DEFAULT 'STAFF',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DoctorClinicAffiliation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT,
    "telefono" TEXT,
    "logoUrl" TEXT,
    "membreteUrl" TEXT,
    "rif" TEXT,
    "razonSocial" TEXT,
    "direccionFiscal" TEXT,
    "doctorId" TEXT NOT NULL,
    "clinicId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Staff" (
    "id" TEXT NOT NULL,
    "cedula" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "pinAcceso" TEXT,
    "rol" "StaffRole" NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL,
    "tipoIdentificacion" "IdentificationType",
    "numeroIdentificacion" TEXT,
    "sinCedula" BOOLEAN NOT NULL DEFAULT false,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "fechaNacimiento" TIMESTAMP(3) NOT NULL,
    "sexo" TEXT NOT NULL,
    "telefono" TEXT,
    "email" TEXT,
    "portalPasswordHash" TEXT,
    "repCedula" TEXT,
    "repNombreCompleto" TEXT,
    "repParentesco" "ParentRelationship",
    "repTelefono" TEXT,
    "repEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientRegistration" (
    "id" TEXT NOT NULL,
    "idDisplay" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "notasInternas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Doctor_cedula_key" ON "Doctor"("cedula");

-- CreateIndex
CREATE UNIQUE INDEX "Doctor_email_key" ON "Doctor"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Clinic_rif_key" ON "Clinic"("rif");

-- CreateIndex
CREATE INDEX "DoctorClinicAffiliation_clinicId_idx" ON "DoctorClinicAffiliation"("clinicId");

-- CreateIndex
CREATE UNIQUE INDEX "DoctorClinicAffiliation_doctorId_clinicId_key" ON "DoctorClinicAffiliation"("doctorId", "clinicId");

-- CreateIndex
CREATE INDEX "Workspace_doctorId_idx" ON "Workspace"("doctorId");

-- CreateIndex
CREATE INDEX "Workspace_clinicId_idx" ON "Workspace"("clinicId");

-- CreateIndex
CREATE INDEX "Staff_workspaceId_idx" ON "Staff"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_cedula_workspaceId_key" ON "Staff"("cedula", "workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_email_workspaceId_key" ON "Staff"("email", "workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_tipoIdentificacion_numeroIdentificacion_key" ON "Patient"("tipoIdentificacion", "numeroIdentificacion");

-- CreateIndex
CREATE INDEX "PatientRegistration_workspaceId_idx" ON "PatientRegistration"("workspaceId");

-- CreateIndex
CREATE INDEX "PatientRegistration_patientId_idx" ON "PatientRegistration"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "PatientRegistration_workspaceId_idDisplay_key" ON "PatientRegistration"("workspaceId", "idDisplay");

-- CreateIndex
CREATE UNIQUE INDEX "PatientRegistration_workspaceId_patientId_key" ON "PatientRegistration"("workspaceId", "patientId");

-- AddForeignKey
ALTER TABLE "DoctorClinicAffiliation" ADD CONSTRAINT "DoctorClinicAffiliation_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorClinicAffiliation" ADD CONSTRAINT "DoctorClinicAffiliation_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workspace" ADD CONSTRAINT "Workspace_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workspace" ADD CONSTRAINT "Workspace_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientRegistration" ADD CONSTRAINT "PatientRegistration_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientRegistration" ADD CONSTRAINT "PatientRegistration_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
