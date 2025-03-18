-- CreateTable
CREATE TABLE "ApplicationUserSettings" (
    "applicationGrantId" TEXT NOT NULL,
    "settings" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApplicationUserSettings_pkey" PRIMARY KEY ("applicationGrantId")
);

-- AddForeignKey
ALTER TABLE "ApplicationUserSettings" ADD CONSTRAINT "ApplicationUserSettings_applicationGrantId_fkey" FOREIGN KEY ("applicationGrantId") REFERENCES "ApplicationGrant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
