-- CreateEnum
CREATE TYPE "ApplicationType" AS ENUM ('Confidential', 'Public');

-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "type" "ApplicationType" NOT NULL DEFAULT 'Confidential';
