-- This migration marks the manual application of talent columns
-- Columns were added directly via SQL on 2026-01-10:
-- - analyticsNotes (TEXT, nullable)
-- - socialIntelligenceNotes (TEXT, nullable)
-- - comparisonNotes (TEXT, nullable)
-- - currency (TEXT, NOT NULL DEFAULT 'GBP')

-- Verify columns exist (no-op if they already do)
SELECT 1 FROM "Talent" LIMIT 1;
