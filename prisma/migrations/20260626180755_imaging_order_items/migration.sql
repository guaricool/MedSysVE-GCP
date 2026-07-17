--CreateTable
CREATE TABLE "ImagingOrderItem" (
    "id" TEXT NOT NULL,
    "imagingOrderId" TEXT NOT NULL,
    "tipoImagen" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "notas" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImagingOrderItem_pkey" PRIMARY KEY ("id")
);

--CreateIndex
CREATE INDEX "ImagingOrderItem_imagingOrderId_idx" ON "ImagingOrderItem"("imagingOrderId");

--AddForeignKey
ALTER TABLE "ImagingOrderItem" ADD CONSTRAINT "ImagingOrderItem_imagingOrderId_fkey" FOREIGN KEY ("imagingOrderId") REFERENCES "ImagingOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: every existing ImagingOrder becomes a single-item order carrying
-- its original tipoImagen/region. Preserves current PDFs without manual fixup.
--
-- Uses gen_random_uuid() (built-in since Postgres 13, no extension needed)
-- for the PK. Avoids `md5(random()::text)` which Postgres transmits with an
-- embedded null byte under some client encodings and trips the protocol
-- error "string contains embedded null" — observed on the first attempt.
INSERT INTO "ImagingOrderItem" ("id", "imagingOrderId", "tipoImagen", "region", "orden", "createdAt")
SELECT
    gen_random_uuid()::text,
    id,
    "tipoImagen",
    "region",
    0,
    "createdAt"
FROM "ImagingOrder";