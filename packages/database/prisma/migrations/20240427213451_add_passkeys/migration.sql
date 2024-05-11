/*
  Warnings:

  - A unique constraint covering the columns `[passkeyId]` on the table `UserProvider` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "UserProviderType" ADD VALUE 'passkey';

-- AlterTable
ALTER TABLE "UserProvider" ADD COLUMN     "passkeyId" TEXT,
ALTER COLUMN "token" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Passkey" (
    "id" TEXT NOT NULL,
    "publicKey" BYTEA NOT NULL,
    "userId" TEXT NOT NULL,
    "webAuthnUserId" TEXT NOT NULL,
    "counter" BIGINT NOT NULL,
    "deviceType" TEXT NOT NULL,
    "backedUp" BOOLEAN NOT NULL,
    "transports" TEXT[],

    CONSTRAINT "Passkey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Passkey_webAuthnUserId_userId_key" ON "Passkey"("webAuthnUserId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserProvider_passkeyId_key" ON "UserProvider"("passkeyId");

-- AddForeignKey
ALTER TABLE "Passkey" ADD CONSTRAINT "Passkey_id_fkey" FOREIGN KEY ("id") REFERENCES "UserProvider"("passkeyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Passkey" ADD CONSTRAINT "Passkey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
