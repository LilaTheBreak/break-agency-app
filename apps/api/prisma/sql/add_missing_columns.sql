-- Add missing columns to users table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "include_in_roster" BOOLEAN NOT NULL DEFAULT false;
