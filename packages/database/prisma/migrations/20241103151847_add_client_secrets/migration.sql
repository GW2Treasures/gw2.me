-- CreateTable
CREATE TABLE "ClientSecret" (
    "id" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "ClientSecret_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClientSecret_secret_key" ON "ClientSecret"("secret");

-- AddForeignKey
ALTER TABLE "ClientSecret" ADD CONSTRAINT "ClientSecret_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate data
INSERT INTO "ClientSecret"
    SELECT
        gen_random_uuid() as "id",
        "secret",
        "id" as "clientId",
        "createdAt",
        "createdAt" as "updatedAt",
        NULL as "usedAt"
    FROM "Client"
    WHERE "secret" IS NOT NULL;
