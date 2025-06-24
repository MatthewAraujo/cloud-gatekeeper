/*
  Warnings:

  - Added the required column `username` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
-- First add the column as nullable
ALTER TABLE "User" ADD COLUMN "username" TEXT;

-- Update existing records with username derived from email (remove domain part)
UPDATE "User" SET "username" = split_part("email", '@', 1) WHERE "username" IS NULL;

-- Then make it NOT NULL
ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL;
