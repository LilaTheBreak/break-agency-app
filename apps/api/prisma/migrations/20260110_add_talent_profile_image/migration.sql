-- AddColumn: profileImageUrl, profileImageSource, lastProfileImageSyncAt to Talent
-- Purpose: Store social media profile images for automatic avatar display

ALTER TABLE "Talent" ADD COLUMN "profileImageUrl" TEXT,
ADD COLUMN "profileImageSource" TEXT DEFAULT 'initials',
ADD COLUMN "lastProfileImageSyncAt" TIMESTAMP(3);

-- Create index for profile image sync queries
CREATE INDEX "Talent_lastProfileImageSyncAt_idx" ON "Talent"("lastProfileImageSyncAt");
CREATE INDEX "Talent_profileImageSource_idx" ON "Talent"("profileImageSource");
