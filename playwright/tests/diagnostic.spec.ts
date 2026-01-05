import { test, expect } from '@playwright/test';

/**
 * Diagnostic test to check what status codes we're actually getting
 */

test.describe('🔧 DIAGNOSTIC TESTS', () => {
  test('Check GET /api/admin/talent status', async ({ request }) => {
    const response = await request.get('/api/admin/talent');
    console.log(`GET /api/admin/talent: ${response.status()}`);
    
    if (response.status() < 300) {
      const data = await response.json().catch(() => ({}));
      console.log('Response data:', JSON.stringify(data).substring(0, 200));
    }
    
    expect(response.status()).toBeGreaterThan(0);
  });

  test('Check GET /api/admin/talent/nonexistent-id', async ({ request }) => {
    const response = await request.get('/api/admin/talent/nonexistent-id-12345');
    console.log(`GET /api/admin/talent/nonexistent-id: ${response.status()}`);
    
    const text = await response.text();
    console.log('Response (first 300 chars):', text.substring(0, 300));
    
    if (response.status() === 200) {
      console.error('🔴 ISSUE: GET nonexistent returned 200, expected 404');
    }
    
    expect(response.status()).toBeGreaterThan(0);
  });

  test('Check POST /api/admin/talent', async ({ request }) => {
    const response = await request.post('/api/admin/talent', {
      data: {
        name: 'Test Talent',
        email: 'test@test.com'
      }
    });
    console.log(`POST /api/admin/talent: ${response.status()}`);
    
    if (response.status() === 405) {
      console.error('🔴 ISSUE: POST returned 405 Method Not Allowed');
    }
    
    const text = await response.text();
    console.log('Response (first 300 chars):', text.substring(0, 300));
    
    expect(response.status()).toBeGreaterThan(0);
  });

  test('Check DELETE /api/admin/talent/test-id', async ({ request }) => {
    const response = await request.delete('/api/admin/talent/test-id-123');
    console.log(`DELETE /api/admin/talent/test-id: ${response.status()}`);
    
    expect(response.status()).toBeGreaterThan(0);
  });
});
