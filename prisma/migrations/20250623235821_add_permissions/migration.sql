/*
  Warnings:

  - Added the required column `permissions` to the `AccessRequest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
-- First add the column as nullable
ALTER TABLE "AccessRequest" ADD COLUMN "permissions" JSONB;

-- Update existing records with default permissions
UPDATE "AccessRequest" SET "permissions" = '["s3:GetObject", "s3:ListBucket"]'::jsonb WHERE "permissions" IS NULL;

-- Then make it NOT NULL
ALTER TABLE "AccessRequest" ALTER COLUMN "permissions" SET NOT NULL;
