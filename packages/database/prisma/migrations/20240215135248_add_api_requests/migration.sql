/*
  Warnings:

  - You are about to drop the column `apiTokenId` on the `ApiRequest` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ApiRequest" DROP CONSTRAINT "ApiRequest_apiTokenId_fkey";

-- AlterTable
ALTER TABLE "ApiRequest" DROP COLUMN "apiTokenId",
ADD COLUMN     "apiKey" TEXT;
