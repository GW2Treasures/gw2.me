-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "type" "ApplicationType" NOT NULL,
    "secret" TEXT,
    "callbackUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "applicationId" TEXT NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Client_secret_key" ON "Client"("secret");

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
