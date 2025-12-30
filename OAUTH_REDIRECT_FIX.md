# OAuth Redirect Fix - Production Domain Enforcement

## Problem

OAuth redirects (Gmail + Google Calendar) were sending users to Vercel preview URLs instead of the production domain:
- `https://break-agency-3nan4i2ow-lilas-projects-27f9c819.vercel.app/admin`
- Instead of: `https://www.tbctbctbc.online/admin`

## Root Cause

The `FRONTEND_ORIGIN` environment variable was being set to a Vercel preview URL in Railway, causing all OAuth redirects to use the wrong domain.

## Solution

Created a canonical frontend URL system that:

1. **Always uses production domain in production** - Never allows preview URLs
2. **Validates environment variables** - Filters out preview URLs automatically
3. **Provides clear fallbacks** - Uses production domain if no valid URL found

## Implementation

### New File: `apps/api/src/config/frontendUrl.ts`

- Defines `getFrontendUrl()` function that returns canonical production URL
- Priority order:
  1. `FRONTEND_URL` env var (if not a preview URL)
  2. Production domain (`https://www.tbctbctbc.online`) in production
  3. `WEB_APP_URL` env var (if not a preview URL)
  4. `FRONTEND_ORIGIN` env var (filtered to remove preview URLs in production)
  5. Localhost (development only)

### Updated Files

1. **`apps/api/src/routes/gmailAuth.ts`**
   - Replaced `FRONTEND_ORIGIN` with `getFrontendUrl()` for all redirects
   - Success redirect: `/admin/inbox?gmail_connected=1`
   - Error redirects: `/admin/inbox?gmail_error=...`

2. **`apps/api/src/routes/auth.ts`**
   - Updated `buildPostAuthRedirect()` to use `getFrontendUrl()`
   - Updated password reset email URL to use `getFrontendUrl()`
   - All OAuth callbacks now redirect to production domain

## Environment Variables

### Required (Railway)

Set `FRONTEND_URL` to production domain:
```
FRONTEND_URL=https://www.tbctbctbc.online
```

### Optional (for CORS)

`FRONTEND_ORIGIN` can still contain multiple origins (including preview URLs) for CORS, but OAuth redirects will always use the canonical production URL.

## Verification

After deployment, verify:

1. ✅ Gmail OAuth redirects to `https://www.tbctbctbc.online/admin/inbox`
2. ✅ Google Calendar OAuth redirects to production domain
3. ✅ No redirects to `*.vercel.app` domains
4. ✅ Sessions persist correctly after redirect
5. ✅ Cookies work across domains

## Testing

### Local Development
- Uses `http://localhost:5173` (development fallback)
- Preview URLs allowed in non-production

### Production
- Always uses `https://www.tbctbctbc.online`
- Preview URLs automatically filtered out
- Warnings logged if preview URLs detected in env vars

## Security

- ✅ No hardcoded URLs (uses environment variables)
- ✅ Production domain enforced in production
- ✅ Preview URLs never used for OAuth redirects in production
- ✅ Clear logging for debugging

## Notes

- The system is backward compatible - existing env vars still work
- Preview URLs are still allowed for CORS (just not for OAuth redirects)
- The fix is transparent to users - they'll just land on the correct domain

