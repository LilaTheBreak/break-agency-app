import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './playwright/tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry once on failure */
  retries: 1,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'https://www.tbctbctbc.online',
    /* Run tests in headless mode */
    headless: true,
    /* Take screenshot only on failure */
    screenshot: 'only-on-failure',
    /* Retain video only on failure */
    video: 'retain-on-failure',
    /* Retain trace only on failure */
    trace: 'retain-on-failure',
    /* Use saved authentication state (if available) */
    ...(process.env.PLAYWRIGHT_AUTH_STATE || (require('fs').existsSync('playwright/.auth/admin.json') ? { storageState: 'playwright/.auth/admin.json' } : {})),
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        viewport: { width: 1280, height: 720 },
      },
    },

    {
      name: 'firefox',
      use: {
        viewport: { width: 1280, height: 720 },
      },
    },

    {
      name: 'webkit',
      use: {
        viewport: { width: 1280, height: 720 },
      },
    },
  ],
});

