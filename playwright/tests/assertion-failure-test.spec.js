import { test, expect } from '@playwright/test';

/**
 * SIMPLE ASSERTION FAILURE TEST
 * 
 * This test verifies Playwright can detect assertion failures.
 * It does NOT catch console errors (to test assertion failure independently).
 */
test('Assertion failure detection - this MUST fail', async ({ page }) => {
  // Navigate to live domain
  await page.goto('/');
  
  // Verify we're on live domain
  const currentUrl = page.url();
  if (!currentUrl.includes('tbctbctbc.online')) {
    throw new Error(`FAIL: Not on live domain! Current URL: ${currentUrl}`);
  }
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  
  // Get actual title
  const actualTitle = await page.title();
  console.log(`Actual page title: "${actualTitle}"`);
  
  // INTENTIONAL FAILURE - Assert wrong title
  // This MUST fail to prove Playwright detects assertion failures
  await expect(page).toHaveTitle('THIS TITLE DOES NOT EXIST', { timeout: 2000 });
  
  // If we get here, Playwright is broken
  throw new Error('CRITICAL: Assertion should have failed but did not!');
});

