/*
  Warnings:

  - You are about to drop the column `emailId` on the `Authorization` table. All the data in the column will be lost.
  - You are about to drop the `_accountAuthorization` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Authorization" DROP CONSTRAINT "Authorization_emailId_fkey";

-- DropForeignKey
ALTER TABLE "_accountAuthorization" DROP CONSTRAINT "_accountAuthorization_A_fkey";

-- DropForeignKey
ALTER TABLE "_accountAuthorization" DROP CONSTRAINT "_accountAuthorization_B_fkey";

-- AlterTable
ALTER TABLE "Authorization" DROP COLUMN "emailId";

-- DropTable
DROP TABLE "_accountAuthorization";
