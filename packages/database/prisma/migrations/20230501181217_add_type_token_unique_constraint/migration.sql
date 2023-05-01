/*
  Warnings:

  - A unique constraint covering the columns `[type,token]` on the table `Authorization` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Authorization_token_key";

-- CreateIndex
CREATE UNIQUE INDEX "Authorization_type_token_key" ON "Authorization"("type", "token");
