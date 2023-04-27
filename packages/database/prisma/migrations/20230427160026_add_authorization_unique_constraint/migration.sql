/*
  Warnings:

  - A unique constraint covering the columns `[type,applicationId,userId]` on the table `Authorization` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Authorization_id_type_applicationId_key";

-- CreateIndex
CREATE UNIQUE INDEX "Authorization_type_applicationId_userId_key" ON "Authorization"("type", "applicationId", "userId");
