-- DropForeignKey
ALTER TABLE "Passkey" DROP CONSTRAINT "Passkey_id_fkey";

-- AddForeignKey
ALTER TABLE "Passkey" ADD CONSTRAINT "Passkey_id_fkey" FOREIGN KEY ("id") REFERENCES "UserProvider"("passkeyId") ON DELETE CASCADE ON UPDATE CASCADE;
