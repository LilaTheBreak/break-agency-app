-- Update user role to SUPERADMIN
-- Replace 'your-email@example.com' with your actual email address

UPDATE "User" 
SET role = 'SUPERADMIN', 
    "updatedAt" = NOW()
WHERE email = 'your-email@example.com';

-- Verify the update
SELECT id, email, role, "onboarding_status", "onboardingComplete" 
FROM "User" 
WHERE email = 'your-email@example.com';
