/*
  Warnings:

  - You are about to drop the column `pinAcceso` on the `Staff` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `DoctorClinicAffiliation` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `sexo` on the `Patient` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "SexoType" AS ENUM ('MASCULINO', 'FEMENINO', 'OTRO');

-- AlterTable
ALTER TABLE "DoctorClinicAffiliation" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Patient" DROP COLUMN "sexo",
ADD COLUMN     "sexo" "SexoType" NOT NULL;

-- AlterTable
ALTER TABLE "Staff" DROP COLUMN "pinAcceso",
ADD COLUMN     "pinAccesoHash" TEXT;
