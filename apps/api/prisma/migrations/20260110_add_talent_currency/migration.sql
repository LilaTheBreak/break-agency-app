-- AddColumn: currency to Talent
-- Purpose: Store per-talent currency preference (GBP, USD, EUR, etc.)

ALTER TABLE "Talent" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'GBP';

-- Add index for filtering by currency
CREATE INDEX "Talent_currency_idx" ON "Talent"("currency");
