-- CreateTable GrowthInitiative
CREATE TABLE "GrowthInitiative" (
    "id" TEXT NOT NULL,
    "talentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "platforms" TEXT[],
    "objective" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "monthlyBudget" DOUBLE PRECISION,
    "totalBudget" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'active',
    "owner" TEXT NOT NULL DEFAULT 'both',
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GrowthInitiative_pkey" PRIMARY KEY ("id")
);

-- CreateTable GrowthInput
CREATE TABLE "GrowthInput" (
    "id" TEXT NOT NULL,
    "initiativeId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contributorUserId" TEXT,
    "costMonthly" DOUBLE PRECISION,
    "costOneOff" DOUBLE PRECISION,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GrowthInput_pkey" PRIMARY KEY ("id")
);

-- CreateTable GrowthOutput
CREATE TABLE "GrowthOutput" (
    "id" TEXT NOT NULL,
    "initiativeId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "contributorUserId" TEXT,
    "title" TEXT,
    "url" TEXT,
    "publishedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GrowthOutput_pkey" PRIMARY KEY ("id")
);

-- CreateTable GrowthPerformance
CREATE TABLE "GrowthPerformance" (
    "id" TEXT NOT NULL,
    "initiativeId" TEXT NOT NULL,
    "totalViews" INTEGER,
    "avgEngagement" DOUBLE PRECISION,
    "followerGrowth" INTEGER,
    "profileVisits" INTEGER,
    "inboundMessages" INTEGER,
    "brandEnquiries" INTEGER,
    "speakingInvites" INTEGER,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GrowthPerformance_pkey" PRIMARY KEY ("id")
);

-- CreateTable BusinessImpact
CREATE TABLE "BusinessImpact" (
    "id" TEXT NOT NULL,
    "initiativeId" TEXT NOT NULL,
    "dealsInfluencedIds" TEXT[],
    "inboundLeads" INTEGER,
    "brandCategoriesUnlocked" TEXT[],
    "avgDealValueChangePct" DOUBLE PRECISION,
    "agentNotes" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessImpact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GrowthInitiative_talentId_idx" ON "GrowthInitiative"("talentId");

-- CreateIndex
CREATE INDEX "GrowthInitiative_status_idx" ON "GrowthInitiative"("status");

-- CreateIndex
CREATE INDEX "GrowthInitiative_objective_idx" ON "GrowthInitiative"("objective");

-- CreateIndex
CREATE INDEX "GrowthInitiative_createdAt_idx" ON "GrowthInitiative"("createdAt");

-- CreateIndex
CREATE INDEX "GrowthInput_initiativeId_idx" ON "GrowthInput"("initiativeId");

-- CreateIndex
CREATE INDEX "GrowthInput_type_idx" ON "GrowthInput"("type");

-- CreateIndex
CREATE INDEX "GrowthOutput_initiativeId_idx" ON "GrowthOutput"("initiativeId");

-- CreateIndex
CREATE INDEX "GrowthOutput_platform_idx" ON "GrowthOutput"("platform");

-- CreateIndex
CREATE INDEX "GrowthOutput_format_idx" ON "GrowthOutput"("format");

-- CreateIndex
CREATE INDEX "GrowthPerformance_initiativeId_idx" ON "GrowthPerformance"("initiativeId");

-- CreateIndex
CREATE INDEX "GrowthPerformance_periodStart_idx" ON "GrowthPerformance"("periodStart");

-- CreateIndex
CREATE INDEX "BusinessImpact_initiativeId_idx" ON "BusinessImpact"("initiativeId");

-- AddForeignKey
ALTER TABLE "GrowthInitiative" ADD CONSTRAINT "GrowthInitiative_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "Talent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrowthInitiative" ADD CONSTRAINT "GrowthInitiative_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrowthInput" ADD CONSTRAINT "GrowthInput_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "GrowthInitiative"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrowthInput" ADD CONSTRAINT "GrowthInput_contributorUserId_fkey" FOREIGN KEY ("contributorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrowthOutput" ADD CONSTRAINT "GrowthOutput_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "GrowthInitiative"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrowthOutput" ADD CONSTRAINT "GrowthOutput_contributorUserId_fkey" FOREIGN KEY ("contributorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrowthPerformance" ADD CONSTRAINT "GrowthPerformance_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "GrowthInitiative"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessImpact" ADD CONSTRAINT "BusinessImpact_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "GrowthInitiative"("id") ON DELETE CASCADE ON UPDATE CASCADE;
