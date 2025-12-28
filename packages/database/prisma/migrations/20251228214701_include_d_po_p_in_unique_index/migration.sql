/*
  Warnings:

  - A unique constraint covering the columns `[type,clientId,userId,dpopJkt]` on the table `Authorization` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Authorization_type_clientId_userId_key";

-- CreateIndex
CREATE UNIQUE INDEX "Authorization_type_clientId_userId_dpopJkt_key" ON "Authorization"("type", "clientId", "userId", "dpopJkt");
