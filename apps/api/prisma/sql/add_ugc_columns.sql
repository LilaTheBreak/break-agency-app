-- Add missing UGC-related columns to users table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "ugcApproved" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "ugcRates" JSONB;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "ugc_portfolio_url" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "ugc_categories" TEXT[] DEFAULT '{}';
