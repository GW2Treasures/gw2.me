/*
  Warnings:

  - Added the required column `token` to the `ApiToken` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ApiToken" ADD COLUMN     "token" TEXT NOT NULL;
