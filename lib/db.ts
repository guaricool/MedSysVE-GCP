import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    console.error("[lib/db] ERROR: DATABASE_URL environment variable is missing!")
  }
  const pool = new Pool({
    connectionString: dbUrl || "postgresql://unconfigured:5432/medsysve",
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error"] : ["error"],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db

let migrationCheckDone = false
export async function ensureDbSchema(force = false) {
  if (migrationCheckDone && !force) return
  migrationCheckDone = true
  try {
    // 1. Doctor columns
    await db.$executeRawUnsafe(`
      ALTER TABLE "Doctor" ADD COLUMN IF NOT EXISTS "extraWorkspacesCount" INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE "Doctor" ADD COLUMN IF NOT EXISTS "segundoNombre" TEXT;
      ALTER TABLE "Doctor" ADD COLUMN IF NOT EXISTS "segundoApellido" TEXT;
      ALTER TABLE "Doctor" ADD COLUMN IF NOT EXISTS "nacionalidad" TEXT NOT NULL DEFAULT 'V';
      ALTER TABLE "Doctor" ADD COLUMN IF NOT EXISTS "mppsMatricula" TEXT;
      ALTER TABLE "Doctor" ADD COLUMN IF NOT EXISTS "isSacsVerified" BOOLEAN NOT NULL DEFAULT false;
      ALTER TABLE "Doctor" ADD COLUMN IF NOT EXISTS "isOnboardingComplete" BOOLEAN NOT NULL DEFAULT false;
      ALTER TABLE "Doctor" ADD COLUMN IF NOT EXISTS "prefijo" TEXT NOT NULL DEFAULT 'Dr.';
    `)

    // 2. Alergia enum & table
    await db.$executeRawUnsafe(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AlergiaGravedad') THEN
          CREATE TYPE "AlergiaGravedad" AS ENUM ('LEVE', 'MODERADA', 'SEVERA');
        END IF;
      END $$;

      CREATE TABLE IF NOT EXISTS "Alergia" (
          "id" TEXT NOT NULL,
          "workspaceId" TEXT NOT NULL,
          "patientRegistrationId" TEXT NOT NULL,
          "sustancia" TEXT NOT NULL,
          "reaccion" TEXT,
          "categoria" TEXT,
          "gravedad" "AlergiaGravedad" NOT NULL DEFAULT 'LEVE',
          "activa" BOOLEAN NOT NULL DEFAULT true,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Alergia_pkey" PRIMARY KEY ("id")
      );
      CREATE INDEX IF NOT EXISTS "Alergia_workspaceId_idx" ON "Alergia"("workspaceId");
      CREATE INDEX IF NOT EXISTS "Alergia_patientRegistrationId_idx" ON "Alergia"("patientRegistrationId");
    `)

    // 3. Allergy specialty models
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "AllergyPrickTest" (
          "id" TEXT NOT NULL,
          "encounterId" TEXT NOT NULL,
          "patientRegistrationId" TEXT NOT NULL,
          "workspaceId" TEXT NOT NULL,
          "histamineControlMm" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "salineControlMm" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "dustMitesJson" TEXT,
          "moldsFungiJson" TEXT,
          "epitheliaAnimalJson" TEXT,
          "pollensFoodsJson" TEXT,
          "customItemsJson" TEXT,
          "positiveReactionsCount" INTEGER NOT NULL DEFAULT 0,
          "conclusion" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "AllergyPrickTest_pkey" PRIMARY KEY ("id")
      );
      CREATE INDEX IF NOT EXISTS "AllergyPrickTest_encounterId_idx" ON "AllergyPrickTest"("encounterId");
      CREATE INDEX IF NOT EXISTS "AllergyPrickTest_patientRegistrationId_idx" ON "AllergyPrickTest"("patientRegistrationId");
      CREATE INDEX IF NOT EXISTS "AllergyPrickTest_workspaceId_idx" ON "AllergyPrickTest"("workspaceId");

      CREATE TABLE IF NOT EXISTS "AllergyPatchTest" (
          "id" TEXT NOT NULL,
          "encounterId" TEXT NOT NULL,
          "patientRegistrationId" TEXT NOT NULL,
          "workspaceId" TEXT NOT NULL,
          "fechaAplicacion" TIMESTAMP(3),
          "fechaLectura" TIMESTAMP(3),
          "diagnostico" TEXT,
          "comentarios" TEXT,
          "itemsJson" TEXT,
          "positiveCount" INTEGER NOT NULL DEFAULT 0,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "AllergyPatchTest_pkey" PRIMARY KEY ("id")
      );
      CREATE INDEX IF NOT EXISTS "AllergyPatchTest_encounterId_idx" ON "AllergyPatchTest"("encounterId");
      CREATE INDEX IF NOT EXISTS "AllergyPatchTest_patientRegistrationId_idx" ON "AllergyPatchTest"("patientRegistrationId");
      CREATE INDEX IF NOT EXISTS "AllergyPatchTest_workspaceId_idx" ON "AllergyPatchTest"("workspaceId");

      CREATE TABLE IF NOT EXISTS "AllergyImmunotherapy" (
          "id" TEXT NOT NULL,
          "encounterId" TEXT NOT NULL,
          "patientRegistrationId" TEXT NOT NULL,
          "workspaceId" TEXT NOT NULL,
          "therapyRoute" TEXT NOT NULL DEFAULT '',
          "allergenicExtract" TEXT NOT NULL DEFAULT '',
          "phase" TEXT NOT NULL DEFAULT '',
          "vialConcentration" TEXT NOT NULL DEFAULT '',
          "doseAmount" TEXT NOT NULL DEFAULT '',
          "localReactionMm" DOUBLE PRECISION,
          "systemicReaction" TEXT,
          "extractName" TEXT,
          "administrationRoute" TEXT,
          "currentPhase" TEXT,
          "currentDoseMl" DOUBLE PRECISION,
          "dilutionRatio" TEXT,
          "nextDoseDate" TIMESTAMP(3),
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "AllergyImmunotherapy_pkey" PRIMARY KEY ("id")
      );
      CREATE INDEX IF NOT EXISTS "AllergyImmunotherapy_encounterId_idx" ON "AllergyImmunotherapy"("encounterId");
      CREATE INDEX IF NOT EXISTS "AllergyImmunotherapy_patientRegistrationId_idx" ON "AllergyImmunotherapy"("patientRegistrationId");
      CREATE INDEX IF NOT EXISTS "AllergyImmunotherapy_workspaceId_idx" ON "AllergyImmunotherapy"("workspaceId");

      CREATE TABLE IF NOT EXISTS "AllergyImmunoglobulinPanel" (
          "id" TEXT NOT NULL,
          "encounterId" TEXT NOT NULL,
          "patientRegistrationId" TEXT NOT NULL,
          "workspaceId" TEXT NOT NULL,
          "totalIgEKuiL" DOUBLE PRECISION,
          "totalIgGMgDl" DOUBLE PRECISION,
          "totalIgAMgDl" DOUBLE PRECISION,
          "totalIgMMgDl" DOUBLE PRECISION,
          "c3ComplementMgDl" DOUBLE PRECISION,
          "c4ComplementMgDl" DOUBLE PRECISION,
          "immunodeficiencyDiagnosis" TEXT,
          "igeTotalIuMl" DOUBLE PRECISION,
          "iggMgDl" DOUBLE PRECISION,
          "igaMgDl" DOUBLE PRECISION,
          "igmMgDl" DOUBLE PRECISION,
          "complementC3" DOUBLE PRECISION,
          "complementC4" DOUBLE PRECISION,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "AllergyImmunoglobulinPanel_pkey" PRIMARY KEY ("id")
      );
      CREATE INDEX IF NOT EXISTS "AllergyImmunoglobulinPanel_encounterId_idx" ON "AllergyImmunoglobulinPanel"("encounterId");
      CREATE INDEX IF NOT EXISTS "AllergyImmunoglobulinPanel_patientRegistrationId_idx" ON "AllergyImmunoglobulinPanel"("patientRegistrationId");
      CREATE INDEX IF NOT EXISTS "AllergyImmunoglobulinPanel_workspaceId_idx" ON "AllergyImmunoglobulinPanel"("workspaceId");
    `)

    // 4. Other 27 specialty tables
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "OphthoRefraction" (
          "id" TEXT NOT NULL,
          "encounterId" TEXT NOT NULL,
          "patientRegistrationId" TEXT NOT NULL,
          "workspaceId" TEXT NOT NULL,
          "odEsfera" DOUBLE PRECISION, "odCilindro" DOUBLE PRECISION, "odEje" INTEGER, "odAvSinCorr" TEXT, "odAvConCorr" TEXT,
          "oiEsfera" DOUBLE PRECISION, "oiCilindro" DOUBLE PRECISION, "oiEje" INTEGER, "oiAvSinCorr" TEXT, "oiAvConCorr" TEXT,
          "adicion" DOUBLE PRECISION, "distanciaInterpupilarMm" DOUBLE PRECISION, "observaciones" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "OphthoRefraction_pkey" PRIMARY KEY ("id")
      );

      CREATE TABLE IF NOT EXISTS "RheumaJointMapper" (
          "id" TEXT NOT NULL, "encounterId" TEXT NOT NULL, "patientRegistrationId" TEXT NOT NULL, "workspaceId" TEXT NOT NULL,
          "tenderJointCount" INTEGER NOT NULL DEFAULT 0, "swollenJointCount" INTEGER NOT NULL DEFAULT 0,
          "jointsTenderJson" TEXT, "jointsSwollenJson" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "RheumaJointMapper_pkey" PRIMARY KEY ("id")
      );

      CREATE TABLE IF NOT EXISTS "RheumaDiseaseActivity" (
          "id" TEXT NOT NULL, "encounterId" TEXT NOT NULL, "patientRegistrationId" TEXT NOT NULL, "workspaceId" TEXT NOT NULL,
          "vasPatientMm" DOUBLE PRECISION, "vasDoctorMm" DOUBLE PRECISION, "pcrMgL" DOUBLE PRECISION, "vsgMmHr" DOUBLE PRECISION,
          "das28Score" DOUBLE PRECISION, "das28Category" TEXT, "cdaiScore" DOUBLE PRECISION, "sdaiScore" DOUBLE PRECISION,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "RheumaDiseaseActivity_pkey" PRIMARY KEY ("id")
      );

      CREATE TABLE IF NOT EXISTS "NephroCkdStage" (
          "id" TEXT NOT NULL, "encounterId" TEXT NOT NULL, "patientRegistrationId" TEXT NOT NULL, "workspaceId" TEXT NOT NULL,
          "creatininaMgDl" DOUBLE PRECISION, "tfgCkdEpi" DOUBLE PRECISION, "estadioKdigo" TEXT, "categoriaAlbuminuria" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "NephroCkdStage_pkey" PRIMARY KEY ("id")
      );

      CREATE TABLE IF NOT EXISTS "EmergTriageRecord" (
          "id" TEXT NOT NULL, "encounterId" TEXT NOT NULL, "patientRegistrationId" TEXT NOT NULL, "workspaceId" TEXT NOT NULL,
          "esiLevel" INTEGER NOT NULL, "colorCodigo" TEXT NOT NULL, "motivoUrgencia" TEXT, "discriminanteVital" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "EmergTriageRecord_pkey" PRIMARY KEY ("id")
      );

      CREATE TABLE IF NOT EXISTS "TraumaImplante" (
          "id" TEXT NOT NULL, "encounterId" TEXT NOT NULL, "patientRegistrationId" TEXT NOT NULL, "workspaceId" TEXT NOT NULL,
          "tipoMaterial" TEXT NOT NULL, "marca" TEXT NOT NULL, "modelo" TEXT, "lote" TEXT NOT NULL, "material" TEXT,
          "zonaAnatomica" TEXT NOT NULL, "cantidad" INTEGER NOT NULL DEFAULT 1, "observaciones" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "TraumaImplante_pkey" PRIMARY KEY ("id")
      );

      CREATE TABLE IF NOT EXISTS "DicomStudy" (
          "id" TEXT NOT NULL, "encounterId" TEXT, "patientRegistrationId" TEXT NOT NULL, "workspaceId" TEXT NOT NULL,
          "studyInstanceUid" TEXT NOT NULL, "patientIdDicom" TEXT, "patientNameDicom" TEXT, "studyDate" TIMESTAMP(3),
          "studyTime" TEXT, "modality" TEXT NOT NULL, "studyDescription" TEXT, "referringPhysician" TEXT,
          "numberOfSeries" INTEGER NOT NULL DEFAULT 1, "numberOfInstances" INTEGER NOT NULL DEFAULT 1,
          "gcsBucket" TEXT, "gcsFolderPath" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "DicomStudy_pkey" PRIMARY KEY ("id")
      );

      -- Bot System Tables
      CREATE TABLE IF NOT EXISTS "BotConfig" (
          "id" TEXT NOT NULL,
          "workspaceId" TEXT,
          "botType" TEXT NOT NULL,
          "isEnabled" BOOLEAN NOT NULL DEFAULT true,
          "systemPrompt" TEXT,
          "welcomeMessage" TEXT,
          "metaPhoneNumber" TEXT,
          "metaPageId" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "BotConfig_pkey" PRIMARY KEY ("id")
      );
      CREATE INDEX IF NOT EXISTS "BotConfig_workspaceId_idx" ON "BotConfig"("workspaceId");
      CREATE INDEX IF NOT EXISTS "BotConfig_botType_idx" ON "BotConfig"("botType");

      CREATE TABLE IF NOT EXISTS "BotConversation" (
          "id" TEXT NOT NULL,
          "workspaceId" TEXT,
          "channel" TEXT NOT NULL,
          "senderId" TEXT NOT NULL,
          "senderName" TEXT,
          "botType" TEXT NOT NULL,
          "status" TEXT NOT NULL DEFAULT 'ACTIVE',
          "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "BotConversation_pkey" PRIMARY KEY ("id")
      );
      CREATE INDEX IF NOT EXISTS "BotConversation_workspaceId_idx" ON "BotConversation"("workspaceId");
      CREATE INDEX IF NOT EXISTS "BotConversation_status_idx" ON "BotConversation"("status");

      CREATE TABLE IF NOT EXISTS "BotMessage" (
          "id" TEXT NOT NULL,
          "conversationId" TEXT NOT NULL,
          "role" TEXT NOT NULL,
          "content" TEXT NOT NULL,
          "metaMessageId" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "BotMessage_pkey" PRIMARY KEY ("id")
      );
      CREATE INDEX IF NOT EXISTS "BotMessage_conversationId_createdAt_idx" ON "BotMessage"("conversationId", "createdAt");

      CREATE TABLE IF NOT EXISTS "BotLead" (
          "id" TEXT NOT NULL,
          "name" TEXT,
          "phone" TEXT,
          "email" TEXT,
          "specialty" TEXT,
          "status" TEXT NOT NULL DEFAULT 'NEW',
          "channel" TEXT NOT NULL,
          "notes" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "BotLead_pkey" PRIMARY KEY ("id")
      );
      CREATE INDEX IF NOT EXISTS "BotLead_status_idx" ON "BotLead"("status");
      CREATE INDEX IF NOT EXISTS "BotLead_channel_idx" ON "BotLead"("channel");
      CREATE TABLE IF NOT EXISTS "KnowledgeChunk" (
          "id" TEXT NOT NULL,
          "source" TEXT NOT NULL,
          "category" TEXT NOT NULL,
          "title" TEXT NOT NULL,
          "content" TEXT NOT NULL,
          "vectorJson" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "KnowledgeChunk_pkey" PRIMARY KEY ("id")
      );
      CREATE INDEX IF NOT EXISTS "KnowledgeChunk_source_idx" ON "KnowledgeChunk"("source");
      CREATE INDEX IF NOT EXISTS "KnowledgeChunk_category_idx" ON "KnowledgeChunk"("category");

      -- ORL Tables
      CREATE TABLE IF NOT EXISTS "OrlAudiometry" (
          "id" TEXT NOT NULL,
          "encounterId" TEXT NOT NULL,
          "patientRegistrationId" TEXT NOT NULL,
          "workspaceId" TEXT NOT NULL,
          "airOd" TEXT,
          "airOi" TEXT,
          "boneOd" TEXT,
          "boneOi" TEXT,
          "logoaudioOd" INTEGER,
          "logoaudioOi" INTEGER,
          "srtcOd" INTEGER,
          "srtcOi" INTEGER,
          "tympanogramOd" TEXT,
          "tympanogramOi" TEXT,
          "observaciones" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "OrlAudiometry_pkey" PRIMARY KEY ("id")
      );
      CREATE INDEX IF NOT EXISTS "OrlAudiometry_encounterId_idx" ON "OrlAudiometry"("encounterId");
      CREATE INDEX IF NOT EXISTS "OrlAudiometry_patientRegistrationId_idx" ON "OrlAudiometry"("patientRegistrationId");
      CREATE INDEX IF NOT EXISTS "OrlAudiometry_workspaceId_idx" ON "OrlAudiometry"("workspaceId");

      CREATE TABLE IF NOT EXISTS "OrlEndoscopyReport" (
          "id" TEXT NOT NULL,
          "encounterId" TEXT NOT NULL,
          "patientRegistrationId" TEXT NOT NULL,
          "workspaceId" TEXT NOT NULL,
          "tipoProcedimiento" TEXT NOT NULL,
          "hallazgosFosasNasales" TEXT,
          "hallazgosRinofaringe" TEXT,
          "hallazgosLaringe" TEXT,
          "hallazgosCuerdasVocales" TEXT,
          "imagenesUrl" TEXT[] DEFAULT ARRAY[]::TEXT[],
          "conclusion" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "OrlEndoscopyReport_pkey" PRIMARY KEY ("id")
      );
      CREATE INDEX IF NOT EXISTS "OrlEndoscopyReport_encounterId_idx" ON "OrlEndoscopyReport"("encounterId");
      CREATE INDEX IF NOT EXISTS "OrlEndoscopyReport_patientRegistrationId_idx" ON "OrlEndoscopyReport"("patientRegistrationId");
      CREATE INDEX IF NOT EXISTS "OrlEndoscopyReport_workspaceId_idx" ON "OrlEndoscopyReport"("workspaceId");

      CREATE TABLE IF NOT EXISTS "OrlDiagramPin" (
          "id" TEXT NOT NULL,
          "encounterId" TEXT NOT NULL,
          "region" TEXT NOT NULL,
          "xPct" DOUBLE PRECISION NOT NULL,
          "yPct" DOUBLE PRECISION NOT NULL,
          "titulo" TEXT NOT NULL,
          "hallazgo" TEXT NOT NULL,
          "gravedad" TEXT NOT NULL DEFAULT 'LEVE',
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "OrlDiagramPin_pkey" PRIMARY KEY ("id")
      );
      CREATE INDEX IF NOT EXISTS "OrlDiagramPin_encounterId_idx" ON "OrlDiagramPin"("encounterId");

      CREATE TABLE IF NOT EXISTS "TraumaAoClassification" (
          "id" TEXT NOT NULL,
          "encounterId" TEXT NOT NULL,
          "hueso" TEXT NOT NULL,
          "segmento" TEXT NOT NULL,
          "codigoAO" TEXT NOT NULL,
          "descripcion" TEXT,
          "mecanismoLesion" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "TraumaAoClassification_pkey" PRIMARY KEY ("id")
      );
      CREATE INDEX IF NOT EXISTS "TraumaAoClassification_encounterId_idx" ON "TraumaAoClassification"("encounterId");

      CREATE TABLE IF NOT EXISTS "KnowledgeChunk" (
          "id" TEXT NOT NULL,
          "source" TEXT NOT NULL,
          "category" TEXT NOT NULL,
          "title" TEXT NOT NULL,
          "content" TEXT NOT NULL,
          "vectorJson" TEXT,
          "metadata" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "KnowledgeChunk_pkey" PRIMARY KEY ("id")
      );
      CREATE INDEX IF NOT EXISTS "KnowledgeChunk_category_idx" ON "KnowledgeChunk"("category");
      CREATE INDEX IF NOT EXISTS "KnowledgeChunk_source_idx" ON "KnowledgeChunk"("source");
    `)
  } catch (err) {
    console.warn("[ensureDbSchema] Auto-migration execution note:", err)
  }
}

if (process.env.NEXT_PHASE !== "phase-production-build" && !process.env.NEXT_BUILD) {
  ensureDbSchema().catch((err) => {
    console.warn("[ensureDbSchema] Auto-migration execution note:", err)
  })
}

