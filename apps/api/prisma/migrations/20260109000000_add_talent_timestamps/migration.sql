-- Add missing timestamp columns to Talent table
-- These are required by the Prisma schema but were missing from the initial migration

ALTER TABLE "Talent" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Talent" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
