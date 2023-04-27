/*
  Warnings:

  - A unique constraint covering the columns `[id,type,applicationId]` on the table `Authorization` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Authorization_id_type_applicationId_key" ON "Authorization"("id", "type", "applicationId");
