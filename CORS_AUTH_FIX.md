# CORS Cross-Domain Authentication Fix

## Issue
Production authentication failing with CORS errors preventing frontend (`https://www.tbctbctbc.online`) from accessing API (`https://breakagencyapi-production.up.railway.app`).

**Error**: "No 'Access-Control-Allow-Origin' header present" on preflight requests.

## Root Causes Identified

### 1. Incomplete CORS Configuration
The CORS middleware in `server.ts` had:
- ✅ `credentials: true` (correct)
- ✅ Dynamic origin validation (correct)
- ❌ Missing explicit `allowedHeaders` for preflight
- ❌ Missing explicit `methods` for preflight
- ❌ Missing `exposedHeaders` for Set-Cookie
- ❌ No preflight cache optimization

### 2. Missing Environment Variable
- `FRONTEND_ORIGIN` not set in Railway production environment
- Default fallback only allows `http://localhost:5173`
- Production origin `https://www.tbctbctbc.online` rejected by CORS

### 3. Cookie Configuration (Was Already Correct!)
The `buildCookieConfig()` in `lib/jwt.ts` already had proper cross-domain settings:
- ✅ `sameSite: "none"` for production
- ✅ `secure: true` for production
- ✅ `httpOnly: true` for security
- ✅ No domain restriction (allows cross-domain)

## Fixes Applied

### Fix 1: Enhanced CORS Configuration
**File**: `apps/api/src/server.ts` (lines 241-257)

Added explicit CORS options:
```typescript
cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked origin: ${origin}`);
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS", "PUT"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["Set-Cookie"],
  maxAge: 86400 // Cache preflight for 24 hours
})
```

**Changes**:
- Added `methods` array for OPTIONS preflight support
- Added `allowedHeaders` for Content-Type, Authorization, X-Requested-With
- Added `exposedHeaders: ["Set-Cookie"]` for cookie visibility
- Added `maxAge: 86400` to cache preflight requests (performance)
- Added console.warn for blocked origins (debugging)

### Fix 2: Documented FRONTEND_ORIGIN
**File**: `apps/api/.env.example` (lines 1-15)

Added environment variable documentation:
```dotenv
# Frontend CORS Configuration
# Comma-separated list of allowed origins for CORS
# Production: https://www.tbctbctbc.online
# Development: http://localhost:5173,http://localhost:3000
FRONTEND_ORIGIN=http://localhost:5173
```

**Benefits**:
- Clear documentation for developers
- Examples for production and development
- Shows comma-separated format for multiple origins

## Required Railway Environment Variables

Set in Railway dashboard for production deployment:

```bash
FRONTEND_ORIGIN=https://www.tbctbctbc.online
NODE_ENV=production
USE_HTTPS=true
```

**Optional**: Add localhost for local testing against production:
```bash
FRONTEND_ORIGIN=https://www.tbctbctbc.online,http://localhost:3000
```

## How Cookie-Based Cross-Domain Auth Works

### Development (localhost)
```typescript
{
  httpOnly: true,
  secure: false,      // HTTP allowed
  sameSite: "lax",    // Same-site only
  domain: undefined   // No domain restriction
}
```

### Production (custom domain)
```typescript
{
  httpOnly: true,
  secure: true,       // HTTPS required
  sameSite: "none",   // Cross-domain allowed
  domain: undefined   // Browser handles domain
}
```

**Key Points**:
1. `sameSite: "none"` requires `secure: true` (HTTPS only)
2. `httpOnly: true` prevents JavaScript access (security)
3. `domain: undefined` lets browser apply cookie correctly
4. CORS `credentials: true` allows cookies in cross-origin requests

## Verification Steps

### 1. Check Railway Environment
```bash
# In Railway dashboard, verify:
FRONTEND_ORIGIN=https://www.tbctbctbc.online
NODE_ENV=production
```

### 2. Test Production Authentication

1. Visit `https://www.tbctbctbc.online`
2. Open browser DevTools → Network tab
3. Click login/auth button
4. Verify in Network tab:
   - ✅ OPTIONS request returns 200 OK
   - ✅ Response has `Access-Control-Allow-Origin: https://www.tbctbctbc.online`
   - ✅ Response has `Access-Control-Allow-Credentials: true`
   - ✅ No CORS errors in Console
5. Check Application → Cookies:
   - ✅ `break_session` cookie appears
   - ✅ Cookie has `Secure` flag
   - ✅ Cookie has `HttpOnly` flag
   - ✅ Cookie has `SameSite=None`
6. Test authenticated request:
   - GET `/api/auth/me` returns 200 or 401 (not CORS error)

### 3. Test Local Development
```bash
# Should still work on localhost
cd apps/api
npm run dev

# Frontend on http://localhost:5173 should authenticate
```

## Deployment

```bash
git add -A
git commit -m "fix: Enable cross-domain cookie authentication - add explicit CORS headers and FRONTEND_ORIGIN support"
git push origin main
```

Railway will automatically deploy. Monitor logs for CORS warnings if origins are blocked.

## Troubleshooting

### Issue: Still getting CORS errors
**Solution**: Verify `FRONTEND_ORIGIN` is set in Railway environment variables.

```bash
# Check Railway logs for:
[CORS] Blocked origin: https://www.tbctbctbc.online
```

If you see this, the environment variable is not set.

### Issue: Cookies not appearing
**Solution**: Verify frontend is using HTTPS and credentials are included in fetch:

```javascript
fetch("https://breakagencyapi-production.up.railway.app/api/auth/me", {
  credentials: "include"  // Required for cookies
})
```

### Issue: Mixed Content warnings
**Solution**: Ensure both frontend and backend use HTTPS in production. No HTTP connections.

### Issue: Cookies work locally but not in production
**Checklist**:
- ✅ `FRONTEND_ORIGIN` includes production domain
- ✅ `NODE_ENV=production` in Railway
- ✅ Frontend uses `credentials: "include"` in fetch
- ✅ Both frontend and API use HTTPS
- ✅ Cookie has `SameSite=None` and `Secure=true` in production

## Related Files

- `apps/api/src/server.ts` - CORS middleware configuration
- `apps/api/src/lib/jwt.ts` - Cookie configuration (buildCookieConfig)
- `apps/api/.env.example` - Environment variable documentation

## Technical Details

### CORS Preflight Flow
1. Browser sends OPTIONS request before actual request
2. Server responds with allowed methods, headers, origin
3. Browser caches preflight response (maxAge: 24 hours)
4. Browser sends actual request with cookies

### Cookie Security Model
- `httpOnly: true` - JavaScript cannot access (XSS protection)
- `secure: true` - Only sent over HTTPS (MITM protection)
- `sameSite: "none"` - Allows cross-domain (requires secure)
- `credentials: true` - Server accepts cookies from cross-origin

### Why This Fix Works
1. **Explicit Headers**: OPTIONS preflight gets proper allowed headers/methods
2. **Origin Allowlist**: Production frontend added via FRONTEND_ORIGIN env var
3. **Cookie Exposure**: `exposedHeaders: ["Set-Cookie"]` makes cookies visible to JavaScript
4. **Preflight Cache**: `maxAge: 86400` reduces preflight requests by 24 hours
5. **Cookie Config**: Already correct - sameSite: "none" with secure: true

## Status
✅ CORS configuration enhanced with explicit headers
✅ Cookie configuration verified (already correct)
✅ Environment variable documented
🔲 Awaiting Railway environment variable setup
🔲 Awaiting production authentication test

**Next Action**: Set `FRONTEND_ORIGIN=https://www.tbctbctbc.online` in Railway dashboard, then test authentication flow.
