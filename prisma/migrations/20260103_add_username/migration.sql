-- AlterTable: Add username column with temporary default
ALTER TABLE "User" ADD COLUMN "username" TEXT;

-- Update existing users: use email prefix as username
UPDATE "User" SET "username" = SPLIT_PART("email", '@', 1) WHERE "username" IS NULL;

-- Make username required and unique
ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL;

-- AlterTable: Make email optional
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;

-- DropIndex
DROP INDEX IF EXISTS "User_email_key";

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "User"("username");

