/*
  Warnings:

  - You are about to drop the column `name` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `ApiToken` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[accountId,userId]` on the table `Account` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `accountId` to the `Account` table without a default value. This is not possible if the table is not empty.
  - Added the required column `accountName` to the `Account` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Account` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ApiToken" DROP CONSTRAINT "ApiToken_userId_fkey";

-- AlterTable
ALTER TABLE "Account" DROP COLUMN "name",
ADD COLUMN     "accountId" TEXT NOT NULL,
ADD COLUMN     "accountName" TEXT NOT NULL,
ADD COLUMN     "displayName" TEXT,
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ApiToken" DROP COLUMN "userId";

-- CreateIndex
CREATE UNIQUE INDEX "Account_accountId_userId_key" ON "Account"("accountId", "userId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
