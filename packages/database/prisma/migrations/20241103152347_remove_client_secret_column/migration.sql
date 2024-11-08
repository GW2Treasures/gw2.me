/*
  Warnings:

  - You are about to drop the column `secret` on the `Client` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Client_secret_key";

-- AlterTable
ALTER TABLE "Client" DROP COLUMN "secret";
