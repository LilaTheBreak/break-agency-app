SELECT id, email, name, role, onboarding_status, created_at
FROM "User"
WHERE onboarding_status = 'pending_review'
ORDER BY created_at DESC
LIMIT 10;
