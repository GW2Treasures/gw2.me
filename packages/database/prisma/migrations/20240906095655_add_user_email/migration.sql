-- CreateTable
CREATE TABLE "UserEmail" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT,
    "userId" TEXT NOT NULL,
    "isDefaultForUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),

    CONSTRAINT "UserEmail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserEmail_verificationToken_key" ON "UserEmail"("verificationToken");

-- CreateIndex
CREATE UNIQUE INDEX "UserEmail_isDefaultForUserId_key" ON "UserEmail"("isDefaultForUserId");

-- CreateIndex
CREATE UNIQUE INDEX "UserEmail_userId_email_key" ON "UserEmail"("userId", "email");

-- AddForeignKey
ALTER TABLE "UserEmail" ADD CONSTRAINT "UserEmail_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserEmail" ADD CONSTRAINT "UserEmail_isDefaultForUserId_fkey" FOREIGN KEY ("isDefaultForUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate emails to new table
INSERT INTO "UserEmail"
    SELECT
        gen_random_uuid() as "id",
        "email",
        false as "verified",
        NULL as "verificationToken",
        "id" as "userId",
        "id" as "isDefaultForUserId",
        CURRENT_TIMESTAMP as "createdAt",
        CURRENT_TIMESTAMP as "updatedAt",
        NULL as "verifiedAt"
    FROM "User"
    WHERE "email" IS NOT NULL;
