/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Application` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Application_name_key" ON "Application"("name");
