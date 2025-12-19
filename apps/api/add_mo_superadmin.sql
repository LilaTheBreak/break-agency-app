-- Insert or update mo@thebreakco.com as SUPERADMIN
INSERT INTO "User" (id, email, role, name, onboarding_status, "onboardingComplete", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'mo@thebreakco.com',
  'SUPERADMIN',
  'Mo',
  'approved',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) 
DO UPDATE SET 
  role = 'SUPERADMIN',
  onboarding_status = 'approved',
  "onboardingComplete" = true,
  "updatedAt" = NOW();
