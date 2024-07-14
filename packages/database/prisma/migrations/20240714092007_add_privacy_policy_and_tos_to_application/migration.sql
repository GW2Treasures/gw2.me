-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "privacyPolicyUrl" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "termsOfServiceUrl" TEXT NOT NULL DEFAULT '';
