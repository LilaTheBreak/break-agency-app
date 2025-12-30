-- Phase 5: Add BrandBrief model for briefs feature
CREATE TABLE IF NOT EXISTS "BrandBrief" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "deliverables" TEXT[],
    "budget" TEXT,
    "deadline" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdBy" TEXT NOT NULL,
    "versionHistory" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandBrief_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "BrandBrief_brandId_idx" ON "BrandBrief"("brandId");
CREATE INDEX IF NOT EXISTS "BrandBrief_status_idx" ON "BrandBrief"("status");
CREATE INDEX IF NOT EXISTS "BrandBrief_createdBy_idx" ON "BrandBrief"("createdBy");

-- Phase 5: Add BriefMatch model for matching briefs to creators
CREATE TABLE IF NOT EXISTS "BriefMatch" (
    "id" TEXT NOT NULL,
    "briefId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "matchScore" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BriefMatch_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "BriefMatch_briefId_idx" ON "BriefMatch"("briefId");
CREATE INDEX IF NOT EXISTS "BriefMatch_creatorId_idx" ON "BriefMatch"("creatorId");
CREATE INDEX IF NOT EXISTS "BriefMatch_status_idx" ON "BriefMatch"("status");
CREATE UNIQUE INDEX IF NOT EXISTS "BriefMatch_briefId_creatorId_key" ON "BriefMatch"("briefId", "creatorId");

-- Phase 5: Add OutreachLead model
CREATE TABLE IF NOT EXISTS "OutreachLead" (
    "id" TEXT NOT NULL,
    "brandName" TEXT NOT NULL,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "website" TEXT,
    "industry" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "source" TEXT,
    "notes" TEXT,
    "convertedToOutreachId" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutreachLead_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "OutreachLead_status_idx" ON "OutreachLead"("status");
CREATE INDEX IF NOT EXISTS "OutreachLead_createdBy_idx" ON "OutreachLead"("createdBy");
CREATE INDEX IF NOT EXISTS "OutreachLead_convertedToOutreachId_idx" ON "OutreachLead"("convertedToOutreachId");

-- Phase 5: Add CreatorWeeklyReport model
CREATE TABLE IF NOT EXISTS "CreatorWeeklyReport" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "weekStartDate" TIMESTAMP(3) NOT NULL,
    "weekEndDate" TIMESTAMP(3) NOT NULL,
    "summary" TEXT,
    "metrics" JSONB,
    "highlights" TEXT[],
    "challenges" TEXT[],
    "nextWeekGoals" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreatorWeeklyReport_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "CreatorWeeklyReport_creatorId_idx" ON "CreatorWeeklyReport"("creatorId");
CREATE INDEX IF NOT EXISTS "CreatorWeeklyReport_weekStartDate_idx" ON "CreatorWeeklyReport"("weekStartDate");
CREATE UNIQUE INDEX IF NOT EXISTS "CreatorWeeklyReport_creatorId_weekStartDate_key" ON "CreatorWeeklyReport"("creatorId", "weekStartDate");

-- Phase 5: Add DealIntelligence model
CREATE TABLE IF NOT EXISTS "DealIntelligence" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "summary" TEXT,
    "riskFlags" TEXT[],
    "performanceNotes" TEXT[],
    "insights" JSONB,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DealIntelligence_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "DealIntelligence_dealId_idx" ON "DealIntelligence"("dealId");
CREATE UNIQUE INDEX IF NOT EXISTS "DealIntelligence_dealId_key" ON "DealIntelligence"("dealId");

-- Phase 5: Add Bundle model
CREATE TABLE IF NOT EXISTS "Bundle" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priceMin" DOUBLE PRECISION,
    "priceMax" DOUBLE PRECISION,
    "deliverables" JSONB,
    "dealId" TEXT,
    "creatorId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bundle_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Bundle_dealId_idx" ON "Bundle"("dealId");
CREATE INDEX IF NOT EXISTS "Bundle_creatorId_idx" ON "Bundle"("creatorId");
CREATE INDEX IF NOT EXISTS "Bundle_status_idx" ON "Bundle"("status");

