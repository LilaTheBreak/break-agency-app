import { test } from '@playwright/test';

const BACKEND_API_URL = 'https://breakagencyapi-production.up.railway.app/api';

test('Debug POST /api/admin/talent', async ({ request }) => {
  const response = await request.post(`${BACKEND_API_URL}/admin/talent`, {
    data: {
      displayName: `[AUDIT] Talent ${Date.now()}`,
      primaryEmail: `audit-${Date.now()}@test.com`,
      representationType: 'NON_EXCLUSIVE',
      status: 'ACTIVE'
    }
  });

  console.log(`POST status: ${response.status()}`);
  
  const text = await response.text();
  console.log('Response body:', text);
});
