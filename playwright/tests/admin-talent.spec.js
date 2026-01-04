import { test, expect } from '@playwright/test';

test('Admin can create talent and see it in list', async ({ page }) => {
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

  // Catch failed network requests (404s, 500s, etc.)
  page.on('response', response => {
    if (response.status() >= 400) {
      const url = response.url();
      const status = response.status();
      // Don't fail on expected 404s or redirects, but log them
      if (status >= 500) {
        throw new Error(`Server error ${status} on ${url}`);
      }
    }
  });

  // 1. Go directly to Talent page (assumes authentication state is loaded)
  await page.goto('/admin/talent');
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  
  // Check if we're actually on the talent page (not redirected to login)
  if (page.url().includes('/login') || page.url().includes('/auth') || !page.url().includes('/admin/talent')) {
    throw new Error('Not authenticated - please run: npx playwright codegen https://www.tbctbctbc.online and save auth state to playwright/.auth/admin.json');
  }

  // 4. Click Add Talent (try multiple selectors for robustness)
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
    await page.screenshot({ path: 'test-results/admin-talent-page-debug.png', fullPage: true });
    throw new Error('Add Talent button not found. Page may require authentication or have different structure.');
  }
  
  await addButton.click();

  // 5. Fill form
  const talentName = `Playwright Test ${Date.now()}`;
  // Use specific label to avoid matching both "Display Name" and "Legal Name"
  await page.getByLabel(/display name/i).first().fill(talentName);
  await page.getByLabel(/email/i).fill(`test+${Date.now()}@example.com`);

  // 6. Save
  await page.getByRole('button', { name: /create/i }).click();

  // 7. ASSERTION — THIS IS THE TRUTH CHECK
  await expect(
    page.getByText(talentName, { exact: false })
  ).toBeVisible({ timeout: 5000 });
});

