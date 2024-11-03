/*
  Warnings:

  - A unique constraint covering the columns `[type,clientId,userId]` on the table `Authorization` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Authorization" ADD COLUMN     "clientId" TEXT;

-- Migrate data
UPDATE "Authorization"
  SET "clientId" = "Client"."id"
FROM "Client" WHERE "Authorization"."applicationId" = "Client"."applicationId";

-- Disallow NULL for clientId
ALTER TABLE "Authorization" ALTER COLUMN "clientId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Authorization_type_clientId_userId_key" ON "Authorization"("type", "clientId", "userId");

-- AddForeignKey
ALTER TABLE "Authorization" ADD CONSTRAINT "Authorization_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
