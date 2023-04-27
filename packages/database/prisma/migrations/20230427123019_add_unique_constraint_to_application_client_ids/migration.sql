/*
  Warnings:

  - A unique constraint covering the columns `[clientId]` on the table `Application` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[clientSecret]` on the table `Application` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Application_clientId_key" ON "Application"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "Application_clientSecret_key" ON "Application"("clientSecret");
