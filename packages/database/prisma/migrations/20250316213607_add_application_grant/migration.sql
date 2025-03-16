-- CreateTable
CREATE TABLE "ApplicationGrant" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "scope" TEXT[],
    "emailId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApplicationGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_applicationGrants" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_applicationGrants_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "ApplicationGrant_userId_applicationId_key" ON "ApplicationGrant"("userId", "applicationId");

-- CreateIndex
CREATE INDEX "_applicationGrants_B_index" ON "_applicationGrants"("B");

-- AddForeignKey
ALTER TABLE "ApplicationGrant" ADD CONSTRAINT "ApplicationGrant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationGrant" ADD CONSTRAINT "ApplicationGrant_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationGrant" ADD CONSTRAINT "ApplicationGrant_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "UserEmail"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_applicationGrants" ADD CONSTRAINT "_applicationGrants_A_fkey" FOREIGN KEY ("A") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_applicationGrants" ADD CONSTRAINT "_applicationGrants_B_fkey" FOREIGN KEY ("B") REFERENCES "ApplicationGrant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
