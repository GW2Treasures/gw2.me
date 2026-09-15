/*
  Warnings:

  - A unique constraint covering the columns `[token]` on the table `Authorization` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,type,clientId,dpopJkt]` on the table `Authorization` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Authorization_token_key" ON "Authorization"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Authorization_userId_type_clientId_dpopJkt_key" ON "Authorization"("userId", "type", "clientId", "dpopJkt");

-- DropIndex
DROP INDEX "Authorization_type_clientId_userId_dpopJkt_key";

-- DropIndex
DROP INDEX "Authorization_type_token_key";

-- CreateIndex
CREATE INDEX "Account_userId_createdAt_idx" ON "Account"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Application_ownerId_idx" ON "Application"("ownerId");

-- CreateIndex
CREATE INDEX "SharedAccount_userId_createdAt_idx" ON "SharedAccount"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "UserProvider_userId_idx" ON "UserProvider"("userId");

-- CreateIndex
CREATE INDEX "UserSession_userId_idx" ON "UserSession"("userId");
