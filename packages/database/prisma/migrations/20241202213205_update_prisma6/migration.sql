-- AlterTable
ALTER TABLE "_accountAuthorization" ADD CONSTRAINT "_accountAuthorization_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_accountAuthorization_AB_unique";
