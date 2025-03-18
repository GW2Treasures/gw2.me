-- Delete expired code authorizations
DELETE FROM "Authorization" WHERE "type" = 'Code' AND "expiresAt" < NOW();

-- AddForeignKey
ALTER TABLE "Authorization" ADD CONSTRAINT "Authorization_applicationId_userId_fkey" FOREIGN KEY ("applicationId", "userId") REFERENCES "ApplicationGrant"("applicationId", "userId") ON DELETE RESTRICT ON UPDATE CASCADE;
