-- CreateEnum
CREATE TYPE "SharedAccountState" AS ENUM ('Pending', 'Active');

-- CreateTable
CREATE TABLE "SharedAccount" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "state" "SharedAccountState" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SharedAccount_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SharedAccount" ADD CONSTRAINT "SharedAccount_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedAccount" ADD CONSTRAINT "SharedAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
