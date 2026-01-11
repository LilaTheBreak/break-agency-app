-- CreateTable "TalentFile"
CREATE TABLE "TalentFile" (
    "id" TEXT NOT NULL,
    "talentId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "storageProvider" TEXT NOT NULL DEFAULT 'S3',
    "storagePath" TEXT NOT NULL,
    "storageUrl" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'admin-only',
    "uploadedBy" TEXT NOT NULL,
    "description" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::text[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TalentFile_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TalentFile" ADD CONSTRAINT "TalentFile_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "Talent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TalentFile" ADD CONSTRAINT "TalentFile_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "TalentFile_talentId_idx" ON "TalentFile"("talentId");

-- CreateIndex
CREATE INDEX "TalentFile_category_idx" ON "TalentFile"("category");

-- CreateIndex
CREATE INDEX "TalentFile_createdAt_idx" ON "TalentFile"("createdAt");

-- CreateIndex
CREATE INDEX "TalentFile_uploadedBy_idx" ON "TalentFile"("uploadedBy");
