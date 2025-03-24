/*
  Warnings:

  - A unique constraint covering the columns `[applicationId,name]` on the table `Client` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "name" TEXT NOT NULL DEFAULT 'Default Client';

-- CreateIndex
CREATE UNIQUE INDEX "Client_applicationId_name_key" ON "Client"("applicationId", "name");
