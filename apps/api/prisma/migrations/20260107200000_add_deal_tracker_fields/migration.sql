-- AlterTable - Add Deal Tracker Fields
-- Purpose: Support Patricia's deal tracker data from spreadsheet
-- These fields enable richer deal tracking including platforms, deliverables,
-- invoice status, payment status, and internal notes

ALTER TABLE "Deal" ADD COLUMN "campaignName" TEXT,
ADD COLUMN "internalNotes" TEXT,
ADD COLUMN "startDate" TIMESTAMP(3),
ADD COLUMN "endDate" TIMESTAMP(3),
ADD COLUMN "platforms" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "deliverables" TEXT,
ADD COLUMN "invoiceStatus" TEXT,
ADD COLUMN "paymentStatus" TEXT;

-- Create indexes for better query performance on new fields
CREATE INDEX "Deal_campaignName_idx" ON "Deal"("campaignName");
CREATE INDEX "Deal_invoiceStatus_idx" ON "Deal"("invoiceStatus");
CREATE INDEX "Deal_paymentStatus_idx" ON "Deal"("paymentStatus");
CREATE INDEX "Deal_startDate_idx" ON "Deal"("startDate");
CREATE INDEX "Deal_endDate_idx" ON "Deal"("endDate");
