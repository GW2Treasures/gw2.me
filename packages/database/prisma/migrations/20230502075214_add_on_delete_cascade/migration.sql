-- DropForeignKey
ALTER TABLE "Application" DROP CONSTRAINT "Application_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "Authorization" DROP CONSTRAINT "Authorization_applicationId_fkey";

-- DropForeignKey
ALTER TABLE "Authorization" DROP CONSTRAINT "Authorization_userId_fkey";

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Authorization" ADD CONSTRAINT "Authorization_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Authorization" ADD CONSTRAINT "Authorization_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
