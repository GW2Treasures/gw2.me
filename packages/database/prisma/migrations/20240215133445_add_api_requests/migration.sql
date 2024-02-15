-- CreateTable
CREATE TABLE "ApiRequest" (
    "id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "queryParameters" TEXT NOT NULL,
    "apiTokenId" TEXT,
    "status" INTEGER NOT NULL,
    "response" TEXT,
    "responseTimeMs" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ApiRequest" ADD CONSTRAINT "ApiRequest_apiTokenId_fkey" FOREIGN KEY ("apiTokenId") REFERENCES "ApiToken"("id") ON DELETE SET NULL ON UPDATE CASCADE;
