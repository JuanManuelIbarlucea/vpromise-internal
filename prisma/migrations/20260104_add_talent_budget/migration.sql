-- AlterTable: Add contractDate and annualBudget to Talent
ALTER TABLE "Talent" ADD COLUMN "contractDate" TIMESTAMP(3) NOT NULL DEFAULT '2025-05-01 00:00:00';
ALTER TABLE "Talent" ADD COLUMN "annualBudget" DOUBLE PRECISION NOT NULL DEFAULT 1000;

-- CreateIndex
CREATE INDEX "Talent_contractDate_idx" ON "Talent"("contractDate");

