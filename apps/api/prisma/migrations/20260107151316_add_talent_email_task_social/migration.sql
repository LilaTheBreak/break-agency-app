-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "TalentEmail" (
    "id" TEXT NOT NULL,
    "talentId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "label" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TalentEmail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TalentTask" (
    "id" TEXT NOT NULL,
    "talentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "dueDate" TIMESTAMP(3),
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "TalentTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TalentSocial" (
    "id" TEXT NOT NULL,
    "talentId" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "handle" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "followers" INTEGER,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TalentSocial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TalentEmail_talentId_email_key" ON "TalentEmail"("talentId", "email");

-- CreateIndex
CREATE INDEX "TalentEmail_talentId_idx" ON "TalentEmail"("talentId");

-- CreateIndex
CREATE INDEX "TalentEmail_email_idx" ON "TalentEmail"("email");

-- CreateIndex
CREATE INDEX "TalentTask_talentId_idx" ON "TalentTask"("talentId");

-- CreateIndex
CREATE INDEX "TalentTask_status_idx" ON "TalentTask"("status");

-- CreateIndex
CREATE INDEX "TalentTask_dueDate_idx" ON "TalentTask"("dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "TalentSocial_talentId_platform_handle_key" ON "TalentSocial"("talentId", "platform", "handle");

-- CreateIndex
CREATE INDEX "TalentSocial_talentId_idx" ON "TalentSocial"("talentId");

-- CreateIndex
CREATE INDEX "TalentSocial_platform_idx" ON "TalentSocial"("platform");

-- AddForeignKey
ALTER TABLE "TalentEmail" ADD CONSTRAINT "TalentEmail_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "Talent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TalentTask" ADD CONSTRAINT "TalentTask_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "Talent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TalentSocial" ADD CONSTRAINT "TalentSocial_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "Talent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
