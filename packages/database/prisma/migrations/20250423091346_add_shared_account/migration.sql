/*
  Warnings:

  - A unique constraint covering the columns `[accountId,userId]` on the table `SharedAccount` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "SharedAccount_accountId_userId_key" ON "SharedAccount"("accountId", "userId");
