-- AlterTable: Add isRecurring field to Expense
ALTER TABLE "Expense" ADD COLUMN "isRecurring" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Expense_isRecurring_idx" ON "Expense"("isRecurring");

