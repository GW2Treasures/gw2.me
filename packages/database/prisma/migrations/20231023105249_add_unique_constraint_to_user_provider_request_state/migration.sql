/*
  Warnings:

  - A unique constraint covering the columns `[state]` on the table `UserProviderRequest` will be added. If there are existing duplicate values, this will fail.
  - Made the column `state` on table `UserProviderRequest` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "UserProviderRequest" ALTER COLUMN "state" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "UserProviderRequest_state_key" ON "UserProviderRequest"("state");
