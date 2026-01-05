-- AlterTable: Add isSalary to Expense
ALTER TABLE "Expense" ADD COLUMN "isSalary" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Expense_isSalary_idx" ON "Expense"("isSalary");

