import { test, expect } from '@playwright/test';

/**
 * CONSOLE ERROR DETECTION TEST
 * 
 * This test verifies that Playwright can detect console errors and CSP violations.
 * It injects a console.error() call to verify detection works.
 */
test('Console error detection - should catch injected error', async ({ page }) => {
  let consoleErrorCaught = false;
  let consoleErrorText = '';

  // Set up console error listener BEFORE navigating
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrorCaught = true;
      consoleErrorText = msg.text();
      throw new Error(`Console error detected: ${msg.text()}`);
    }
  });

  page.on('pageerror', error => {
    throw new Error(`Page error detected: ${error.message}`);
  });

  // Navigate to live domain
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Verify we're on live domain
  const currentUrl = page.url();
  if (!currentUrl.includes('tbctbctbc.online')) {
    throw new Error(`FAIL: Not on live domain! Current URL: ${currentUrl}`);
  }

  // Inject a console.error() to test detection
  await page.evaluate(() => {
    console.error('TEST INJECTED ERROR: This should cause test to fail');
  });

  // Wait a moment for the error to be caught
  await page.waitForTimeout(500);

  // If we get here without the error being caught, detection is broken
  if (!consoleErrorCaught) {
    throw new Error('CRITICAL: Console error was NOT detected! Playwright console error detection is broken.');
  }

  // Verify the error text was captured
  if (!consoleErrorText.includes('TEST INJECTED ERROR')) {
    throw new Error(`Console error text not captured correctly. Got: ${consoleErrorText}`);
  }

  // This line should never execute because the console.error should trigger the listener
  throw new Error('Test should have failed on console.error but did not');
});

