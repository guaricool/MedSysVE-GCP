-- CreateTable
CREATE TABLE "ExpressOrder" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "pacienteNombre" TEXT NOT NULL,
    "pacienteApellido" TEXT NOT NULL,
    "pacienteCedula" TEXT,
    "pacienteEdad" INTEGER NOT NULL,
    "pacienteSexo" TEXT,
    "items" JSONB NOT NULL,
    "diagnosticos" TEXT,
    "indicaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "workspaceId" TEXT NOT NULL,

    CONSTRAINT "ExpressOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExpressOrder_workspaceId_idx" ON "ExpressOrder"("workspaceId");

-- AddForeignKey
ALTER TABLE "ExpressOrder" ADD CONSTRAINT "ExpressOrder_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
