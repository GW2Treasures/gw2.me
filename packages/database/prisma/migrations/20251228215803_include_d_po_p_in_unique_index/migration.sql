/*
  Warnings:

  - Made the column `dpopJkt` on table `Authorization` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
UPDATE "Authorization" SET "dpopJkt" = '' WHERE "dpopJkt" IS NULL;
ALTER TABLE "Authorization" ALTER COLUMN "dpopJkt" SET NOT NULL,
ALTER COLUMN "dpopJkt" SET DEFAULT '';
