-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ExpenseStatus" AS ENUM ('PENDING', 'PAID');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('SALARY', 'EXPENSE');

-- CreateEnum
CREATE TYPE "UserPermission" AS ENUM ('ADMIN', 'MANAGER', 'USER');

-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('TALENT', 'MANAGER', 'STAFF', 'EDITOR');

-- CreateEnum
CREATE TYPE "IncomePlatform" AS ENUM ('YOUTUBE', 'TWITCH', 'STREAMLOOTS', 'KOFI', 'MERCHANDISE', 'PAYPAL', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "VideoStatus" AS ENUM ('GUIONADO', 'CORRECCIONES', 'GRABANDO', 'EDITANDO', 'TERMINADO');

-- CreateEnum
CREATE TYPE "VideoType" AS ENUM ('SHORT', 'LARGO');

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "category" TEXT NOT NULL DEFAULT '',
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "isSalary" BOOLEAN NOT NULL DEFAULT false,
    "status" "ExpenseStatus" NOT NULL DEFAULT 'PENDING',
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "talentId" TEXT,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" "PaymentType" NOT NULL,
    "description" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "expenseId" TEXT,
    "paypalTransactionId" TEXT,
    "paypalEmail" TEXT,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "paypalEmail" TEXT,
    "password" TEXT NOT NULL,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "salary" DOUBLE PRECISION NOT NULL,
    "types" "UserType"[],
    "permission" "UserPermission" NOT NULL,
    "username" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Talent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contractDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "annualBudget" DOUBLE PRECISION NOT NULL DEFAULT 1000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "twitch" TEXT,
    "youtube" TEXT,
    "tiktok" TEXT,
    "instagram" TEXT,
    "twitter" TEXT,
    "googleRefreshToken" TEXT,
    "googleAccessToken" TEXT,
    "googleTokenExpiresAt" TIMESTAMP(3),
    "userId" TEXT,
    "managerId" TEXT,

    CONSTRAINT "Talent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Manager" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,

    CONSTRAINT "Manager_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "Video" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "tipo" "VideoType" NOT NULL DEFAULT 'LARGO',
    "estado" "VideoStatus" NOT NULL DEFAULT 'GUIONADO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "talentId" TEXT NOT NULL,
    "editorId" TEXT,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Viewer" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "platformId" TEXT NOT NULL,
    "displayName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Viewer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ViewerPoints" (
    "viewerId" TEXT NOT NULL,
    "talentId" TEXT NOT NULL,
    "points" BIGINT NOT NULL DEFAULT 0,
    "totalEarned" BIGINT NOT NULL DEFAULT 0,
    "totalSpent" BIGINT NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ViewerPoints_pkey" PRIMARY KEY ("viewerId","talentId")
);

-- CreateTable
CREATE TABLE "PointTransaction" (
    "id" TEXT NOT NULL,
    "viewerId" TEXT NOT NULL,
    "talentId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PointTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PointConfig" (
    "talentId" TEXT NOT NULL,
    "pointsPerMessage" INTEGER NOT NULL DEFAULT 1,
    "messageCooldownSec" INTEGER NOT NULL DEFAULT 30,
    "watchIntervalMin" INTEGER NOT NULL DEFAULT 5,
    "pointsPerWatchInterval" INTEGER NOT NULL DEFAULT 5,
    "pointsPerSub" INTEGER NOT NULL DEFAULT 500,
    "pointsPerGiftedSub" INTEGER NOT NULL DEFAULT 500,
    "pointsPerBit" INTEGER NOT NULL DEFAULT 1,
    "pointsPerUsd" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "pointsPerMembership" INTEGER NOT NULL DEFAULT 500,
    "pointsPerChannelPoint" DOUBLE PRECISION NOT NULL DEFAULT 0.1,

    CONSTRAINT "PointConfig_pkey" PRIMARY KEY ("talentId")
);

-- CreateIndex
CREATE INDEX "Expense_date_idx" ON "Expense"("date");

-- CreateIndex
CREATE INDEX "Expense_isRecurring_idx" ON "Expense"("isRecurring");

-- CreateIndex
CREATE INDEX "Expense_isSalary_idx" ON "Expense"("isSalary");

-- CreateIndex
CREATE INDEX "Expense_status_idx" ON "Expense"("status");

-- CreateIndex
CREATE INDEX "Expense_userId_idx" ON "Expense"("userId");

-- CreateIndex
CREATE INDEX "Expense_talentId_idx" ON "Expense"("talentId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_expenseId_key" ON "Payment"("expenseId");

-- CreateIndex
CREATE INDEX "Payment_date_idx" ON "Payment"("date");

-- CreateIndex
CREATE INDEX "Payment_type_idx" ON "Payment"("type");

-- CreateIndex
CREATE INDEX "Payment_userId_idx" ON "Payment"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Talent_userId_key" ON "Talent"("userId");

-- CreateIndex
CREATE INDEX "Talent_name_idx" ON "Talent"("name");

-- CreateIndex
CREATE INDEX "Talent_contractDate_idx" ON "Talent"("contractDate");

-- CreateIndex
CREATE UNIQUE INDEX "Manager_userId_key" ON "Manager"("userId");

-- CreateIndex
CREATE INDEX "Manager_name_idx" ON "Manager"("name");

-- CreateIndex
CREATE INDEX "Income_talentId_idx" ON "Income"("talentId");

-- CreateIndex
CREATE INDEX "Income_accountingMonth_idx" ON "Income"("accountingMonth");

-- CreateIndex
CREATE INDEX "Income_platform_idx" ON "Income"("platform");

-- CreateIndex
CREATE INDEX "Video_talentId_idx" ON "Video"("talentId");

-- CreateIndex
CREATE INDEX "Video_editorId_idx" ON "Video"("editorId");

-- CreateIndex
CREATE INDEX "Video_estado_idx" ON "Video"("estado");

-- CreateIndex
CREATE INDEX "Video_tipo_idx" ON "Video"("tipo");

-- CreateIndex
CREATE INDEX "Viewer_displayName_idx" ON "Viewer"("displayName");

-- CreateIndex
CREATE UNIQUE INDEX "Viewer_platform_platformId_key" ON "Viewer"("platform", "platformId");

-- CreateIndex
CREATE INDEX "PointTransaction_viewerId_idx" ON "PointTransaction"("viewerId");

-- CreateIndex
CREATE INDEX "PointTransaction_talentId_idx" ON "PointTransaction"("talentId");

-- CreateIndex
CREATE INDEX "PointTransaction_createdAt_idx" ON "PointTransaction"("createdAt");

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "Talent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Talent" ADD CONSTRAINT "Talent_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Manager"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Talent" ADD CONSTRAINT "Talent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Manager" ADD CONSTRAINT "Manager_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Income" ADD CONSTRAINT "Income_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "Talent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "Talent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_editorId_fkey" FOREIGN KEY ("editorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ViewerPoints" ADD CONSTRAINT "ViewerPoints_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "Viewer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ViewerPoints" ADD CONSTRAINT "ViewerPoints_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "Talent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointTransaction" ADD CONSTRAINT "PointTransaction_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "Viewer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointTransaction" ADD CONSTRAINT "PointTransaction_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "Talent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointConfig" ADD CONSTRAINT "PointConfig_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "Talent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

