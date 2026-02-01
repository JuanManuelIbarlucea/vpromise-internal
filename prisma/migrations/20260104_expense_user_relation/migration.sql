-- Step 1: Add userId column (nullable initially)
ALTER TABLE "Expense" ADD COLUMN "userId" TEXT;

-- Step 2: Populate userId from talent's userId
UPDATE "Expense" e
SET "userId" = t."userId"
FROM "Talent" t
WHERE e."talentId" = t."id" AND t."userId" IS NOT NULL;

-- Step 3: For any expenses where talent has no userId, we need to handle them
-- Delete expenses where we can't determine a userId (shouldn't happen in normal cases)
DELETE FROM "Expense" WHERE "userId" IS NULL;

-- Step 4: Make userId NOT NULL
ALTER TABLE "Expense" ALTER COLUMN "userId" SET NOT NULL;

-- Step 5: Make talentId nullable
ALTER TABLE "Expense" ALTER COLUMN "talentId" DROP NOT NULL;

-- Step 6: Add foreign key constraint for userId
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 7: Create indexes
CREATE INDEX "Expense_userId_idx" ON "Expense"("userId");
CREATE INDEX "Expense_talentId_idx" ON "Expense"("talentId");



