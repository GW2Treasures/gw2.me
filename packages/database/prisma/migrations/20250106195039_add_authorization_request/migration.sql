-- CreateEnum
CREATE TYPE "AuthorizationRequestType" AS ENUM ('OAuth2', 'FedCM');

-- CreateEnum
CREATE TYPE "AuthorizationRequestState" AS ENUM ('Pending', 'Canceled', 'Authorized');

-- CreateTable
CREATE TABLE "AuthorizationRequest" (
    "id" TEXT NOT NULL,
    "type" "AuthorizationRequestType" NOT NULL,
    "state" "AuthorizationRequestState" NOT NULL DEFAULT 'Pending',
    "data" JSONB NOT NULL,
    "clientId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthorizationRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AuthorizationRequest" ADD CONSTRAINT "AuthorizationRequest_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
