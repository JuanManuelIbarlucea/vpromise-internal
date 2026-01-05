-- CreateEnum
CREATE TYPE "IncomePlatform" AS ENUM ('YOUTUBE', 'TWITCH', 'STREAMLOOTS', 'KOFI', 'MERCHANDISE');

-- CreateTable
CREATE TABLE "Income" (
    "id" TEXT NOT NULL,
    "accountingMonth" TIMESTAMP(3) NOT NULL,
    "platform" "IncomePlatform" NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "referenceValue" DOUBLE PRECISION NOT NULL,
    "actualValue" DOUBLE PRECISION NOT NULL,
    "actualValueUSD" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "talentId" TEXT NOT NULL,

    CONSTRAINT "Income_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Income_talentId_idx" ON "Income"("talentId");

-- CreateIndex
CREATE INDEX "Income_accountingMonth_idx" ON "Income"("accountingMonth");

-- CreateIndex
CREATE INDEX "Income_platform_idx" ON "Income"("platform");

-- AddForeignKey
ALTER TABLE "Income" ADD CONSTRAINT "Income_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "Talent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

