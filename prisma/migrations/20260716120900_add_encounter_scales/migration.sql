-- CreateTable
CREATE TABLE "EncounterScale" (
    "id" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "valores" JSONB NOT NULL,
    "puntuacion" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EncounterScale_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EncounterScale_encounterId_idx" ON "EncounterScale"("encounterId");

-- AddForeignKey
ALTER TABLE "EncounterScale" ADD CONSTRAINT "EncounterScale_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
