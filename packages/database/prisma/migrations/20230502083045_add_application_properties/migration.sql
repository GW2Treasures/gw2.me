-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "image" BYTEA,
ADD COLUMN     "publicUrl" TEXT NOT NULL DEFAULT '';
