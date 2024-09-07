-- AlterTable
ALTER TABLE "Authorization" ADD COLUMN     "emailId" TEXT;

-- AddForeignKey
ALTER TABLE "Authorization" ADD CONSTRAINT "Authorization_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "UserEmail"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate data
WITH "temp" AS (
    SELECT "Authorization"."id" as "authorizationId", "UserEmail"."id" AS "emailId"
    FROM "Authorization"
    LEFT JOIN "UserEmail" ON "UserEmail"."isDefaultForUserId" = "Authorization"."userId"
    WHERE 'email' = ANY("scope") AND "email" IS NOT NULL
)
UPDATE "Authorization"
SET "emailId" = "temp"."emailId"
FROM "temp"
WHERE "Authorization"."id" = "temp"."authorizationId";
