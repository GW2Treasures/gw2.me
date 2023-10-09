/*
  Warnings:

  - A unique constraint covering the columns `[sha256]` on the table `File` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "File_sha256_key" ON "File"("sha256");
