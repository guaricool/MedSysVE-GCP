-- CreateTable TraumaImplante
CREATE TABLE IF NOT EXISTS "TraumaImplante" (
    "id" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "patientRegistrationId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "tipoMaterial" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "modelo" TEXT,
    "lote" TEXT NOT NULL,
    "material" TEXT,
    "zonaAnatomica" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TraumaImplante_pkey" PRIMARY KEY ("id")
);

-- CreateTable TraumaAoClassification
CREATE TABLE IF NOT EXISTS "TraumaAoClassification" (
    "id" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "hueso" TEXT NOT NULL,
    "segmento" TEXT NOT NULL,
    "codigoAO" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "mecanismoLesion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TraumaAoClassification_pkey" PRIMARY KEY ("id")
);

-- CreateTable TraumaRehabProtocol
CREATE TABLE IF NOT EXISTS "TraumaRehabProtocol" (
    "id" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "patientRegistrationId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "nivelCarga" TEXT NOT NULL,
    "usoOrtesis" TEXT,
    "faseRehab" TEXT NOT NULL,
    "ejerciciosPermitidos" TEXT,
    "contraindicaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TraumaRehabProtocol_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes
CREATE INDEX IF NOT EXISTS "TraumaImplante_encounterId_idx" ON "TraumaImplante"("encounterId");
CREATE INDEX IF NOT EXISTS "TraumaImplante_patientRegistrationId_idx" ON "TraumaImplante"("patientRegistrationId");
CREATE INDEX IF NOT EXISTS "TraumaImplante_workspaceId_idx" ON "TraumaImplante"("workspaceId");

CREATE INDEX IF NOT EXISTS "TraumaAoClassification_encounterId_idx" ON "TraumaAoClassification"("encounterId");

CREATE INDEX IF NOT EXISTS "TraumaRehabProtocol_encounterId_idx" ON "TraumaRehabProtocol"("encounterId");
CREATE INDEX IF NOT EXISTS "TraumaRehabProtocol_patientRegistrationId_idx" ON "TraumaRehabProtocol"("patientRegistrationId");
CREATE INDEX IF NOT EXISTS "TraumaRehabProtocol_workspaceId_idx" ON "TraumaRehabProtocol"("workspaceId");
