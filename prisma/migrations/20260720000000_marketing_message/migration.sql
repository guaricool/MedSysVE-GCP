-- CreateTable
CREATE TABLE "MarketingMessage" (
    "id" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "nombrePerfil" TEXT,
    "texto" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "leido" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketingMessage_pkey" PRIMARY KEY ("id")
);
