-- AlterTable
ALTER TABLE "Doctor" ADD COLUMN "stripeCustomerId" TEXT,
                     ADD COLUMN "stripeSubscriptionId" TEXT,
                     ADD COLUMN "stripePriceId" TEXT,
                     ADD COLUMN "stripeCurrentPeriodEnd" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Doctor_stripeCustomerId_key" ON "Doctor"("stripeCustomerId");
CREATE UNIQUE INDEX "Doctor_stripeSubscriptionId_key" ON "Doctor"("stripeSubscriptionId");

-- AlterTable
ALTER TABLE "Clinic" ADD COLUMN "plan" TEXT NOT NULL DEFAULT 'free',
                     ADD COLUMN "stripeCustomerId" TEXT,
                     ADD COLUMN "stripeSubscriptionId" TEXT,
                     ADD COLUMN "stripePriceId" TEXT,
                     ADD COLUMN "stripeCurrentPeriodEnd" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Clinic_stripeCustomerId_key" ON "Clinic"("stripeCustomerId");
CREATE UNIQUE INDEX "Clinic_stripeSubscriptionId_key" ON "Clinic"("stripeSubscriptionId");
