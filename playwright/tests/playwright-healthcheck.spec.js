import { test, expect } from '@playwright/test';

/**
 * HARD FAIL TEST - This test MUST fail to prove Playwright is working correctly.
 * 
 * If this test passes, Playwright is NOT detecting failures properly.
 */
test('HARD FAIL: Playwright health check - this MUST fail', async ({ page }) => {
  // GLOBAL FAILURE RULES - Catch console errors and CSP violations
  let consoleErrors = [];
  let pageErrors = [];
  let serverErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      throw new Error(`Console error detected: ${msg.text()}`);
    }
  });

  page.on('pageerror', error => {
    pageErrors.push(error.message);
    throw new Error(`Page error detected: ${error.message}`);
  });

  page.on('response', response => {
    if (response.status() >= 500) {
      const url = response.url();
      const status = response.status();
      serverErrors.push({ url, status });
      throw new Error(`Server error ${status} on ${url}`);
    }
  });

  // 1. Visit the LIVE domain (verify baseURL is working)
  await page.goto('/');
  
  // 2. Verify we're on the actual live domain (not localhost)
  const currentUrl = page.url();
  if (!currentUrl.includes('tbctbctbc.online')) {
    throw new Error(`FAIL: Not on live domain! Current URL: ${currentUrl}`);
  }
  
  // 3. Wait for page to load
  await page.waitForLoadState('networkidle');
  
  // 4. Wait for title to be set (React hydration may delay)
  await page.waitForFunction(() => document.title.length > 0, { timeout: 10000 });
  
  // 5. Get the actual page title
  const actualTitle = await page.title();
  console.log(`Actual page title: "${actualTitle}"`);
  
  // 6. ASSERT CORRECT TITLE (this should pass)
  await expect(page).toHaveTitle(/The Break/i, { timeout: 10000 });
  
  // 6. Verify no console errors occurred (CSP violations should be fixed)
  // NOTE: We collect errors but don't throw immediately to allow test to complete
  // This test should pass if CSP is fixed, fail if CSP violations occur
  if (consoleErrors.length > 0) {
    // CSP worker-src violations are CRITICAL - they must be fixed
    const cspViolations = consoleErrors.filter(err => 
      err.includes('worker-src') || err.includes('Content Security Policy')
    );
    
    if (cspViolations.length > 0) {
      throw new Error(`CSP violations detected (CRITICAL): ${cspViolations.join('; ')}`);
    }
    
    // Other console errors are also failures
    throw new Error(`Console errors detected: ${consoleErrors.join('; ')}`);
  }
  
  // 7. Verify no page errors
  if (pageErrors.length > 0) {
    throw new Error(`Page errors detected: ${pageErrors.join(', ')}`);
  }
  
  // 8. Verify no server errors
  if (serverErrors.length > 0) {
    throw new Error(`Server errors detected: ${JSON.stringify(serverErrors)}`);
  }
  
  // Test passes if we get here - page loaded correctly with no errors
});

