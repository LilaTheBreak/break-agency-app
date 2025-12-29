-- AlterTable
ALTER TABLE "CrmBrand" ADD COLUMN "logoUrl" TEXT,
ADD COLUMN "about" TEXT,
ADD COLUMN "socialLinks" JSONB,
ADD COLUMN "enrichedAt" TIMESTAMP(3),
ADD COLUMN "enrichmentSource" TEXT;

