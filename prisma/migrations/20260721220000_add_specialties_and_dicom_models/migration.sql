-- CreateTable OphthoRefraction
CREATE TABLE IF NOT EXISTS "OphthoRefraction" (
    "id" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "patientRegistrationId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "odEsfera" DOUBLE PRECISION,
    "odCilindro" DOUBLE PRECISION,
    "odEje" INTEGER,
    "odAvSinCorr" TEXT,
    "odAvConCorr" TEXT,
    "oiEsfera" DOUBLE PRECISION,
    "oiCilindro" DOUBLE PRECISION,
    "oiEje" INTEGER,
    "oiAvSinCorr" TEXT,
    "oiAvConCorr" TEXT,
    "adicion" DOUBLE PRECISION,
    "distanciaInterpupilarMm" DOUBLE PRECISION,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OphthoRefraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable OphthoTonometry
CREATE TABLE IF NOT EXISTS "OphthoTonometry" (
    "id" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "patientRegistrationId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "pioOdMmHg" DOUBLE PRECISION,
    "pioOiMmHg" DOUBLE PRECISION,
    "metodo" TEXT,
    "horaMedicion" TEXT,
    "paquimetriaOdMicras" DOUBLE PRECISION,
    "paquimetriaOiMicras" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OphthoTonometry_pkey" PRIMARY KEY ("id")
);

-- CreateTable OphthoFundusExam
CREATE TABLE IF NOT EXISTS "OphthoFundusExam" (
    "id" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "patientRegistrationId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "excavacionOd" DOUBLE PRECISION,
    "excavacionOi" DOUBLE PRECISION,
    "retinopatiaDiabeticaEtetdrs" TEXT,
    "retinopatiaHipertensivaScheie" TEXT,
    "maculaOd" TEXT,
    "maculaOi" TEXT,
    "hallazgosVasculares" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OphthoFundusExam_pkey" PRIMARY KEY ("id")
);

-- CreateTable RheumaJointMapper
CREATE TABLE IF NOT EXISTS "RheumaJointMapper" (
    "id" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "patientRegistrationId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "tenderJointCount" INTEGER NOT NULL DEFAULT 0,
    "swollenJointCount" INTEGER NOT NULL DEFAULT 0,
    "jointsTenderJson" TEXT,
    "jointsSwollenJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RheumaJointMapper_pkey" PRIMARY KEY ("id")
);

-- CreateTable RheumaDiseaseActivity
CREATE TABLE IF NOT EXISTS "RheumaDiseaseActivity" (
    "id" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "patientRegistrationId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "vasPatientMm" DOUBLE PRECISION,
    "vasDoctorMm" DOUBLE PRECISION,
    "pcrMgL" DOUBLE PRECISION,
    "vsgMmHr" DOUBLE PRECISION,
    "das28Score" DOUBLE PRECISION,
    "das28Category" TEXT,
    "cdaiScore" DOUBLE PRECISION,
    "sdaiScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RheumaDiseaseActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable RheumaPostChikungunya
CREATE TABLE IF NOT EXISTS "RheumaPostChikungunya" (
    "id" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "patientRegistrationId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "faseClinica" TEXT,
    "mesesEvolucion" INTEGER,
    "rigidezMatutinaMin" INTEGER,
    "manifestacionesTenosinoviales" TEXT,
    "patronArticular" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RheumaPostChikungunya_pkey" PRIMARY KEY ("id")
);

-- CreateTable NephroCkdStage
CREATE TABLE IF NOT EXISTS "NephroCkdStage" (
    "id" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "patientRegistrationId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "creatininaMgDl" DOUBLE PRECISION,
    "tfgCkdEpi" DOUBLE PRECISION,
    "estadioKdigo" TEXT,
    "categoriaAlbuminuria" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "NephroCkdStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable NephroHemodialysisSession
CREATE TABLE IF NOT EXISTS "NephroHemodialysisSession" (
    "id" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "patientRegistrationId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "pesoSecoKg" DOUBLE PRECISION,
    "pesoPreHdKg" DOUBLE PRECISION,
    "pesoPostHdKg" DOUBLE PRECISION,
    "ultrafiltracionL" DOUBLE PRECISION,
    "flujoSangreQb" INTEGER,
    "flujoDializadQd" INTEGER,
    "ktVConseguido" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "NephroHemodialysisSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable NephroVascularAccess
CREATE TABLE IF NOT EXISTS "NephroVascularAccess" (
    "id" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "patientRegistrationId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "tipoAcceso" TEXT,
    "localizacion" TEXT,
    "fechaConfeccion" TIMESTAMP(3),
    "estadoFuncionamiento" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "NephroVascularAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable EmergTriageRecord
CREATE TABLE IF NOT EXISTS "EmergTriageRecord" (
    "id" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "patientRegistrationId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "esiLevel" INTEGER NOT NULL,
    "colorCodigo" TEXT NOT NULL,
    "motivoUrgencia" TEXT,
    "discriminanteVital" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EmergTriageRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable EmergRcpLog
CREATE TABLE IF NOT EXISTS "EmergRcpLog" (
    "id" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "patientRegistrationId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "inicioRcp" TIMESTAMP(3),
    "finRcp" TIMESTAMP(3),
    "duracionMinutos" INTEGER,
    "ritmoInicial" TEXT,
    "shocksDescargados" INTEGER NOT NULL DEFAULT 0,
    "dosisAdrenalinaMg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "retornoCirculacionEspontanea" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EmergRcpLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable EmergProtocolTrack
CREATE TABLE IF NOT EXISTS "EmergProtocolTrack" (
    "id" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "patientRegistrationId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "protocolo" TEXT NOT NULL,
    "tiempoPuertaBalonMin" INTEGER,
    "tiempoPuertaAgujaMin" INTEGER,
    "scoreCrusade" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EmergProtocolTrack_pkey" PRIMARY KEY ("id")
);

-- CreateTable GeriVgiAssessment
CREATE TABLE IF NOT EXISTS "GeriVgiAssessment" (
    "id" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "patientRegistrationId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "katzScore" INTEGER NOT NULL,
    "katzCategory" TEXT NOT NULL,
    "lawtonBrodyScore" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GeriVgiAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable GeriFrailTug
CREATE TABLE IF NOT EXISTS "GeriFrailTug" (
    "id" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "patientRegistrationId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "frailScore" INTEGER NOT NULL,
    "frailCategory" TEXT NOT NULL,
    "tugSeconds" DOUBLE PRECISION NOT NULL,
    "tugRisk" TEXT NOT NULL,
    "caidasUltimoAno" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GeriFrailTug_pkey" PRIMARY KEY ("id")
);

-- CreateTable GeriCognitiveMood
CREATE TABLE IF NOT EXISTS "GeriCognitiveMood" (
    "id" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "patientRegistrationId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "pfeifferScore" INTEGER NOT NULL,
    "pfeifferCategory" TEXT NOT NULL,
    "yesavageGds15Score" INTEGER NOT NULL,
    "yesavageCategory" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GeriCognitiveMood_pkey" PRIMARY KEY ("id")
);

-- CreateTable FamMedGenogram
CREATE TABLE IF NOT EXISTS "FamMedGenogram" (
    "id" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "patientRegistrationId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "generationsCount" INTEGER NOT NULL DEFAULT 3,
    "structureJson" TEXT,
    "hereditaryDiseasesJson" TEXT,
    "familyDynamics" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FamMedGenogram_pkey" PRIMARY KEY ("id")
);

-- CreateTable FamMedApgarScore
CREATE TABLE IF NOT EXISTS "FamMedApgarScore" (
    "id" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "patientRegistrationId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "adaptacion" INTEGER NOT NULL,
    "participacion" INTEGER NOT NULL,
    "gradualidad" INTEGER NOT NULL,
    "afecto" INTEGER NOT NULL,
    "resolucion" INTEGER NOT NULL,
    "totalScore" INTEGER NOT NULL,
    "dysfunctionLevel" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FamMedApgarScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable FamMedFamilyLifeCycle
CREATE TABLE IF NOT EXISTS "FamMedFamilyLifeCycle" (
    "id" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "patientRegistrationId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "stageDuvall" TEXT NOT NULL,
    "normativeCrisesJson" TEXT,
    "paranormativeCrises" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FamMedFamilyLifeCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable PlasticBodyMapping
CREATE TABLE IF NOT EXISTS "PlasticBodyMapping" (
    "id" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "patientRegistrationId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "bodyZonesJson" TEXT,
    "lipoVolumeCcTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "graftVolumeCcTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "surgicalPlan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PlasticBodyMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable PlasticBreastImplant
CREATE TABLE IF NOT EXISTS "PlasticBreastImplant" (
    "id" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "patientRegistrationId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "volumeCc" DOUBLE PRECISION NOT NULL,
    "profile" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "lotNumber" TEXT NOT NULL,
    "anatomicalPlane" TEXT NOT NULL,
    "surgicalIncision" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PlasticBreastImplant_pkey" PRIMARY KEY ("id")
);

-- CreateTable PlasticScarAssessment
CREATE TABLE IF NOT EXISTS "PlasticScarAssessment" (
    "id" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "patientRegistrationId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "vancouverScore" INTEGER NOT NULL,
    "vascularity" INTEGER NOT NULL,
    "pigmentation" INTEGER NOT NULL,
    "pliability" INTEGER NOT NULL,
    "heightMm" INTEGER NOT NULL,
    "scarLocation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PlasticScarAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable HemaPeripheralSmear
CREATE TABLE IF NOT EXISTS "HemaPeripheralSmear" (
    "id" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "patientRegistrationId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "anisocitosis" TEXT,
    "poiquilocitosis" TEXT,
    "drepanocitosPercent" DOUBLE PRECISION,
    "blastosPercent" DOUBLE PRECISION,
    "plaquetasEstimadas" TEXT,
    "hallazgosGlóbulosBlancos" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "HemaPeripheralSmear_pkey" PRIMARY KEY ("id")
);

-- CreateTable HemaSickleCellModule
CREATE TABLE IF NOT EXISTS "HemaSickleCellModule" (
    "id" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "patientRegistrationId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "hbsPercent" DOUBLE PRECISION,
    "hbfPercent" DOUBLE PRECISION,
    "hbaPercent" DOUBLE PRECISION,
    "hydroxyureaDoseMg" DOUBLE PRECISION,
    "painCrisesLastYear" INTEGER NOT NULL DEFAULT 0,
    "acuteChestSyndromeHistory" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "HemaSickleCellModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable HemaTransfusionRecord
CREATE TABLE IF NOT EXISTS "HemaTransfusionRecord" (
    "id" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "patientRegistrationId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "componente" TEXT NOT NULL,
    "unidades" INTEGER NOT NULL,
    "grupoAbo" TEXT NOT NULL,
    "factorRh" TEXT NOT NULL,
    "adverseReaction" BOOLEAN NOT NULL DEFAULT false,
    "reactionDetails" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "HemaTransfusionRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable AllergyPrickTest
CREATE TABLE IF NOT EXISTS "AllergyPrickTest" (
    "id" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "patientRegistrationId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "histamineControlMm" DOUBLE PRECISION NOT NULL,
    "salineControlMm" DOUBLE PRECISION NOT NULL,
    "testResultsJson" TEXT NOT NULL,
    "conclusion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AllergyPrickTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable AllergyImmunotherapy
CREATE TABLE IF NOT EXISTS "AllergyImmunotherapy" (
    "id" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "patientRegistrationId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "extractName" TEXT NOT NULL,
    "administrationRoute" TEXT NOT NULL,
    "currentPhase" TEXT NOT NULL,
    "currentDoseMl" DOUBLE PRECISION NOT NULL,
    "dilutionRatio" TEXT NOT NULL,
    "nextDoseDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AllergyImmunotherapy_pkey" PRIMARY KEY ("id")
);

-- CreateTable AllergyImmunoglobulinPanel
CREATE TABLE IF NOT EXISTS "AllergyImmunoglobulinPanel" (
    "id" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "patientRegistrationId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "igeTotalIuMl" DOUBLE PRECISION,
    "iggMgDl" DOUBLE PRECISION,
    "igaMgDl" DOUBLE PRECISION,
    "igmMgDl" DOUBLE PRECISION,
    "complementC3" DOUBLE PRECISION,
    "complementC4" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AllergyImmunoglobulinPanel_pkey" PRIMARY KEY ("id")
);

-- CreateTable PhysiatryMuscleGonio
CREATE TABLE IF NOT EXISTS "PhysiatryMuscleGonio" (
    "id" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "patientRegistrationId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "muscleGroup" TEXT NOT NULL,
    "danielsStrength" INTEGER NOT NULL,
    "romDegrees" DOUBLE PRECISION NOT NULL,
    "side" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PhysiatryMuscleGonio_pkey" PRIMARY KEY ("id")
);

-- CreateTable PhysiatryAshworthScale
CREATE TABLE IF NOT EXISTS "PhysiatryAshworthScale" (
    "id" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "patientRegistrationId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "bodyRegion" TEXT NOT NULL,
    "modifiedAshworthScore" TEXT NOT NULL,
    "clonusPresent" BOOLEAN NOT NULL DEFAULT false,
    "posturalPattern" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PhysiatryAshworthScale_pkey" PRIMARY KEY ("id")
);

-- CreateTable PhysiatryPrescriptionPlan
CREATE TABLE IF NOT EXISTS "PhysiatryPrescriptionPlan" (
    "id" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "patientRegistrationId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "modalitiesJson" TEXT,
    "sessionDurationMin" INTEGER NOT NULL DEFAULT 45,
    "sessionsPerWeek" INTEGER NOT NULL DEFAULT 3,
    "totalWeeks" INTEGER NOT NULL DEFAULT 4,
    "physiotherapyGoals" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PhysiatryPrescriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable DicomStudy
CREATE TABLE IF NOT EXISTS "DicomStudy" (
    "id" TEXT NOT NULL,
    "encounterId" TEXT,
    "patientRegistrationId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "studyInstanceUid" TEXT NOT NULL,
    "patientIdDicom" TEXT,
    "patientNameDicom" TEXT,
    "studyDate" TIMESTAMP(3),
    "studyTime" TEXT,
    "modality" TEXT NOT NULL,
    "studyDescription" TEXT,
    "referringPhysician" TEXT,
    "numberOfSeries" INTEGER NOT NULL DEFAULT 1,
    "numberOfInstances" INTEGER NOT NULL DEFAULT 1,
    "gcsBucket" TEXT,
    "gcsFolderPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DicomStudy_pkey" PRIMARY KEY ("id")
);

-- CreateTable DicomSeries
CREATE TABLE IF NOT EXISTS "DicomSeries" (
    "id" TEXT NOT NULL,
    "studyId" TEXT NOT NULL,
    "seriesInstanceUid" TEXT NOT NULL,
    "seriesNumber" INTEGER,
    "modality" TEXT NOT NULL,
    "seriesDescription" TEXT,
    "numberOfInstances" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DicomSeries_pkey" PRIMARY KEY ("id")
);

-- CreateTable DicomImage
CREATE TABLE IF NOT EXISTS "DicomImage" (
    "id" TEXT NOT NULL,
    "seriesId" TEXT NOT NULL,
    "sopInstanceUid" TEXT NOT NULL,
    "instanceNumber" INTEGER,
    "storageUrl" TEXT NOT NULL,
    "frameRate" DOUBLE PRECISION,
    "rows" INTEGER,
    "columns" INTEGER,
    "windowCenter" DOUBLE PRECISION,
    "windowWidth" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DicomImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes
CREATE UNIQUE INDEX IF NOT EXISTS "DicomStudy_studyInstanceUid_key" ON "DicomStudy"("studyInstanceUid");
CREATE INDEX IF NOT EXISTS "DicomStudy_encounterId_idx" ON "DicomStudy"("encounterId");
CREATE INDEX IF NOT EXISTS "DicomStudy_patientRegistrationId_idx" ON "DicomStudy"("patientRegistrationId");
CREATE INDEX IF NOT EXISTS "DicomStudy_workspaceId_idx" ON "DicomStudy"("workspaceId");
CREATE INDEX IF NOT EXISTS "DicomStudy_modality_idx" ON "DicomStudy"("modality");

CREATE UNIQUE INDEX IF NOT EXISTS "DicomSeries_seriesInstanceUid_key" ON "DicomSeries"("seriesInstanceUid");
CREATE INDEX IF NOT EXISTS "DicomSeries_studyId_idx" ON "DicomSeries"("studyId");

CREATE UNIQUE INDEX IF NOT EXISTS "DicomImage_sopInstanceUid_key" ON "DicomImage"("sopInstanceUid");
CREATE INDEX IF NOT EXISTS "DicomImage_seriesId_idx" ON "DicomImage"("seriesId");
