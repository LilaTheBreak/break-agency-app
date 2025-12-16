-- Add missing columns with checks
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='location') THEN
    ALTER TABLE "User" ADD COLUMN "location" TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='timezone') THEN
    ALTER TABLE "User" ADD COLUMN "timezone" TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='pronouns') THEN
    ALTER TABLE "User" ADD COLUMN "pronouns" TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='accountType') THEN
    ALTER TABLE "User" ADD COLUMN "accountType" TEXT DEFAULT 'creator';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='status') THEN
    ALTER TABLE "User" ADD COLUMN "status" TEXT DEFAULT 'active';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='bio') THEN
    ALTER TABLE "User" ADD COLUMN "bio" TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='socialLinks') THEN
    ALTER TABLE "User" ADD COLUMN "socialLinks" JSONB;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='onboardingComplete') THEN
    ALTER TABLE "User" ADD COLUMN "onboardingComplete" BOOLEAN DEFAULT false;
  END IF;
END $$;
