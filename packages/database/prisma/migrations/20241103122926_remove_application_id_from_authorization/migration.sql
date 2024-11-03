/*
  Warnings:

  - You are about to drop the column `applicationId` on the `Authorization` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Authorization" DROP CONSTRAINT "Authorization_applicationId_fkey";

-- DropIndex
DROP INDEX "Authorization_type_applicationId_userId_key";

-- AlterTable
ALTER TABLE "Authorization" DROP COLUMN "applicationId";
