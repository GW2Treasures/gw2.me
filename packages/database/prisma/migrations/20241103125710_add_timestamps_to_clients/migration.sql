/*
  Warnings:

  - Added the required column `updatedAt` to the `Client` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3);

-- Migrate createdAt and set updatedAt
UPDATE "Client"
  SET "createdAt" = "Application"."createdAt", "updatedAt" = CURRENT_TIMESTAMP
FROM "Application"
  WHERE "Application"."id" = "Client"."applicationId";

-- Add NOT NULL to updatedAt
ALTER TABLE "Client" ALTER COLUMN "updatedAt" SET NOT NULL;
