/*
  Warnings:

  - A unique constraint covering the columns `[token]` on the table `Authorization` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `token` to the `Authorization` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Authorization" ADD COLUMN     "token" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Authorization_token_key" ON "Authorization"("token");
