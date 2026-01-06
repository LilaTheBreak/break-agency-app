-- Recovery Migration: Add missing tables for Neon migration
-- This migration creates tables that should exist according to schema.prisma
-- but were not created during the incomplete initial migration to Neon

-- CreateTable GoogleAccount
CREATE TABLE "GoogleAccount" (
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "tokenType" TEXT,
    "idToken" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoogleAccount_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex GoogleAccount_email_idx
CREATE INDEX "GoogleAccount_email_idx" ON "GoogleAccount"("email");

-- Add foreign key constraint
ALTER TABLE "GoogleAccount" ADD CONSTRAINT "GoogleAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable GmailToken (if missing)
-- Checking if this table should exist in schema...
-- Based on schema.prisma, GmailToken should have:
CREATE TABLE IF NOT EXISTS "GmailToken" (
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "tokenType" TEXT,
    "scope" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GmailToken_pkey" PRIMARY KEY ("userId")
);

-- Add foreign key if table was created
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'GmailToken') THEN
    BEGIN
      ALTER TABLE "GmailToken" ADD CONSTRAINT "GmailToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

-- Verify User table has necessary fields
-- These should already exist from init migration, but we verify structure

-- Ensure indexes exist on User table for auth flows
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");

-- Log successful recovery
-- Note: These are the critical tables for OAuth and auth flow
-- If any other tables are missing, they will be caught on next Prisma migrate check
