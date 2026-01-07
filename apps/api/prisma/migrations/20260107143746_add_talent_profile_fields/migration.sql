-- Add talent profile fields for persistence
ALTER TABLE "Talent" ADD COLUMN "displayName" TEXT;
ALTER TABLE "Talent" ADD COLUMN "legalName" TEXT;
ALTER TABLE "Talent" ADD COLUMN "primaryEmail" TEXT;
ALTER TABLE "Talent" ADD COLUMN "representationType" TEXT;
ALTER TABLE "Talent" ADD COLUMN "status" TEXT;
ALTER TABLE "Talent" ADD COLUMN "managerId" TEXT;
ALTER TABLE "Talent" ADD COLUMN "notes" TEXT;
