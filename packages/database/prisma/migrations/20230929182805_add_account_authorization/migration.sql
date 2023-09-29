-- CreateTable
CREATE TABLE "_accountAuthorization" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_accountAuthorization_AB_unique" ON "_accountAuthorization"("A", "B");

-- CreateIndex
CREATE INDEX "_accountAuthorization_B_index" ON "_accountAuthorization"("B");

-- AddForeignKey
ALTER TABLE "_accountAuthorization" ADD CONSTRAINT "_accountAuthorization_A_fkey" FOREIGN KEY ("A") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_accountAuthorization" ADD CONSTRAINT "_accountAuthorization_B_fkey" FOREIGN KEY ("B") REFERENCES "Authorization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
