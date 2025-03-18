-- AlterTable
ALTER TABLE "Authorization" ADD COLUMN     "applicationId" TEXT;

-- AddForeignKey
ALTER TABLE "Authorization" ADD CONSTRAINT "Authorization_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate data
UPDATE "Authorization" a
    SET "applicationId" = c."applicationId"
    FROM "Client" c
    WHERE c.id = a."clientId"; 

-- Require applicationId
ALTER TABLE "Authorization" ALTER COLUMN "applicationId" SET NOT NULL;
