-- AlterTable
ALTER TABLE "public"."UserSession" ADD COLUMN     "providerAccountId" TEXT,
ADD COLUMN     "providerType" "public"."UserProviderType";

-- AddForeignKey
ALTER TABLE "public"."UserSession" ADD CONSTRAINT "UserSession_providerType_providerAccountId_fkey" FOREIGN KEY ("providerType", "providerAccountId") REFERENCES "public"."UserProvider"("provider", "providerAccountId") ON DELETE CASCADE ON UPDATE CASCADE;
