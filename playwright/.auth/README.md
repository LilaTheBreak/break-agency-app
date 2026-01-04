# Authentication State Storage

This directory stores Playwright authentication state files.

## Setup Instructions

1. **Generate authentication state:**
   ```bash
   npx playwright codegen https://www.tbctbctbc.online
   ```

2. **In the Playwright Inspector:**
   - Navigate to the site
   - Log in manually (Google OAuth)
   - Once logged in, the session is automatically saved

3. **Save the authentication state:**
   - The auth state will be saved automatically
   - Copy it to `playwright/.auth/admin.json`

4. **Or use Playwright's storageState API:**
   ```javascript
   // In a setup script or test
   await page.context().storageState({ path: 'playwright/.auth/admin.json' });
   ```

## File Structure

- `admin.json` - Admin user authentication state (cookies, localStorage, etc.)

## Security

- ⚠️ **DO NOT COMMIT** authentication state files to git
- These files contain session cookies and tokens
- They are gitignored by default

## Usage

Tests will automatically use `playwright/.auth/admin.json` if it exists (configured in `playwright.config.js`).

If the file doesn't exist, tests will fail with a clear error message.

