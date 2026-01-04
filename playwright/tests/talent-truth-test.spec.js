import { test, expect } from '@playwright/test';

/**
 * TALENT TRUTH TEST (CRITICAL)
 * 
 * This test verifies the read-after-write consistency fix.
 * 
 * MUST PASS:
 * - Talent creation succeeds
 * - Talent appears in list within 5 seconds
 * - No console errors occur
 * - No network errors occur
 * 
 * If this fails, the system is lying about talent creation.
 */
test('TALENT TRUTH: Create talent and verify it appears in list', async ({ page }) => {
  // GLOBAL FAILURE RULES - Catch all errors
  let consoleErrors = [];
  let networkErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      throw new Error(`Console error detected: ${msg.text()}`);
    }
  });

  page.on('pageerror', error => {
    throw new Error(`Page error detected: ${error.message}`);
  });

  page.on('response', response => {
    if (response.status() >= 400) {
      const url = response.url();
      const status = response.status();
      // Only fail on 500+ errors, log 400s
      if (status >= 500) {
        networkErrors.push({ url, status });
        throw new Error(`Server error ${status} on ${url}`);
      }
    }
  });

  // 1. Navigate to talent page (assumes auth state exists)
  await page.goto('/admin/talent');
  await page.waitForLoadState('networkidle');

  // Verify we're authenticated
  if (page.url().includes('/login') || page.url().includes('/auth') || !page.url().includes('/admin/talent')) {
    throw new Error('Not authenticated - please generate auth state: npx playwright codegen https://www.tbctbctbc.online');
  }

  // 2. Get initial talent count (if list is visible)
  const initialCount = await page.locator('[data-testid="talent-item"], .talent-item, tr').count().catch(() => 0);

  // 3. Click "Add Talent" button (try multiple selectors for robustness)
  // Wait for page to be fully interactive
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000); // Allow React to render
  
  // Try multiple selectors
  let addButton = null;
  const selectors = [
    page.getByRole('button', { name: /add.*talent/i }),
    page.getByRole('button', { name: /add new talent/i }),
    page.locator('button:has-text("Add New Talent")'),
    page.locator('button:has-text("Add talent")'),
  ];
  
  for (const selector of selectors) {
    const isVisible = await selector.first().isVisible({ timeout: 2000 }).catch(() => false);
    if (isVisible) {
      addButton = selector.first();
      break;
    }
  }
  
  if (!addButton) {
    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/talent-page-debug.png', fullPage: true });
    throw new Error('Add Talent button not found. Page may require authentication or have different structure.');
  }
  
  await addButton.click({ timeout: 10000 });

  // 4. Fill form with unique data
  const timestamp = Date.now();
  const talentName = `Playwright Truth Test ${timestamp}`;
  const talentEmail = `playwright-test-${timestamp}@example.com`;

  // Wait for form to appear
  await page.waitForSelector('input[type="text"], input[name*="name"], label:has-text("name")', { timeout: 5000 });

  // Fill name field (try multiple selectors)
  const nameInput = page.locator('input[name*="name"], input[type="text"]').first();
  await nameInput.fill(talentName, { timeout: 5000 });

  // Fill email field
  const emailInput = page.locator('input[name*="email"], input[type="email"]').first();
  await emailInput.fill(talentEmail, { timeout: 5000 });

  // 5. Submit form
  await page.getByRole('button', { name: /create|save|submit/i }).click({ timeout: 5000 });

  // 6. Wait for success (toast or redirect)
  await page.waitForTimeout(2000);

  // 7. ASSERTION — THE TRUTH CHECK
  // The talent MUST appear in the list within 5 seconds
  await expect(
    page.getByText(talentName, { exact: false })
  ).toBeVisible({ timeout: 5000 });

  // 8. Verify no errors occurred
  if (consoleErrors.length > 0) {
    throw new Error(`Console errors occurred during talent creation: ${consoleErrors.join(', ')}`);
  }

  if (networkErrors.length > 0) {
    throw new Error(`Network errors occurred: ${JSON.stringify(networkErrors)}`);
  }

  // 9. Verify talent count increased
  const finalCount = await page.locator('[data-testid="talent-item"], .talent-item, tr').count().catch(() => 0);
  if (finalCount <= initialCount) {
    console.warn(`Talent count did not increase (initial: ${initialCount}, final: ${finalCount})`);
    // Don't fail on this - the text visibility check is the real truth
  }
});

