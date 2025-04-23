-- CreateTable
CREATE TABLE "_sharedAccounts" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_sharedAccounts_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_sharedAccounts_B_index" ON "_sharedAccounts"("B");

-- AddForeignKey
ALTER TABLE "_sharedAccounts" ADD CONSTRAINT "_sharedAccounts_A_fkey" FOREIGN KEY ("A") REFERENCES "ApplicationGrant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_sharedAccounts" ADD CONSTRAINT "_sharedAccounts_B_fkey" FOREIGN KEY ("B") REFERENCES "SharedAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
