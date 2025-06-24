/*
  Warnings:

  - Added the required column `username` to the `AccessRequest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
-- First add the column as nullable
ALTER TABLE "AccessRequest" ADD COLUMN "username" TEXT;

-- Update existing records with default username (using requesterId as fallback)
UPDATE "AccessRequest" SET "username" = "requesterId" WHERE "username" IS NULL;

-- Then make it NOT NULL
ALTER TABLE "AccessRequest" ALTER COLUMN "username" SET NOT NULL;
