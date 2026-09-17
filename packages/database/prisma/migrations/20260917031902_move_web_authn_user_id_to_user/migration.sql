/*
  Warnings:

  - A unique constraint covering the columns `[webAuthnUserId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Passkey_webAuthnUserId_userId_key";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "webAuthnUserId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_webAuthnUserId_key" ON "User"("webAuthnUserId");

-- Migrate the most recently used "webAuthnUserId" from "Passkey" to "User"
WITH most_recent_passkey AS (
  SELECT DISTINCT ON (p."userId")
    p."userId",
    p."webAuthnUserId"
  FROM "Passkey" p
  INNER JOIN "UserProvider" up ON up."passkeyId" = p."id"
  ORDER BY p."userId", up."usedAt" DESC NULLS LAST, up."updatedAt" DESC, p."id"
)
UPDATE "User" u
SET "webAuthnUserId" = mrp."webAuthnUserId"
FROM most_recent_passkey mrp
WHERE u."id" = mrp."userId";
