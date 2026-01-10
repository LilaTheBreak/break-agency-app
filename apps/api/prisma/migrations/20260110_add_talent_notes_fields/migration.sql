-- AddColumn: analyticsNotes, socialIntelligenceNotes, comparisonNotes to Talent
-- Purpose: Store admin and agent notes on talent profiles

ALTER TABLE "Talent" ADD COLUMN "analyticsNotes" TEXT,
ADD COLUMN "socialIntelligenceNotes" TEXT,
ADD COLUMN "comparisonNotes" TEXT;
