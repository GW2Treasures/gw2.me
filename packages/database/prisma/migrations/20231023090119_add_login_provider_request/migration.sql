/*
  Warnings:

  - The primary key for the `UserProvider` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Changed the type of `provider` on the `UserProvider` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "UserProviderType" AS ENUM ('discord');

-- CreateEnum
CREATE TYPE "UserProviderRequestType" AS ENUM ('login', 'add');

-- AlterTable
ALTER TABLE "UserProvider"
ALTER COLUMN "provider" TYPE "UserProviderType" USING "provider"::"UserProviderType";

-- CreateTable
CREATE TABLE "UserProviderRequest" (
    "id" TEXT NOT NULL,
    "provider" "UserProviderType" NOT NULL,
    "type" "UserProviderRequestType" NOT NULL,
    "userId" TEXT,
    "redirect_uri" TEXT NOT NULL,
    "state" TEXT,
    "code_verifier" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProviderRequest_pkey" PRIMARY KEY ("id")
);
