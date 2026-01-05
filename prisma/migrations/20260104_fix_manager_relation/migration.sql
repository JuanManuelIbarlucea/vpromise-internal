-- DropIndex: Remove the unique constraint on managerId to allow multiple talents per manager
DROP INDEX IF EXISTS "Talent_managerId_key";

