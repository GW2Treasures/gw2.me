-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "emailId" TEXT;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "UserEmail"("id") ON DELETE SET NULL ON UPDATE CASCADE;
