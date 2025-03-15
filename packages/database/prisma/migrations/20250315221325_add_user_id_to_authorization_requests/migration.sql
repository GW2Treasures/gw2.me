-- CreateEnum
CREATE TYPE "AuthorizationRequestPrompt" AS ENUM ('None', 'Consent');

-- AlterTable
ALTER TABLE "AuthorizationRequest" ADD COLUMN     "userId" TEXT;

-- AddForeignKey
ALTER TABLE "AuthorizationRequest" ADD CONSTRAINT "AuthorizationRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
