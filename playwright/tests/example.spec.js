import { test, expect } from '@playwright/test';

test('homepage loads', async ({ page }) => {
  // GLOBAL FAILURE RULES - Catch console errors and CSP violations
  page.on('console', msg => {
    if (msg.type() === 'error') {
      throw new Error(`Console error: ${msg.text()}`);
    }
  });

  // Catch page errors (including CSP violations)
  page.on('pageerror', error => {
    throw new Error(`Page error: ${error.message}`);
  });

  await page.goto('/');
  await expect(page).toHaveTitle(/The Break/i);
});

