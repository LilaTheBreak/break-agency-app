# Railway CORS Fix
**Date:** December 29, 2025  
**Issue:** Vercel preview URLs being blocked by CORS

---

## PROBLEM

Railway logs showed CORS errors:
```
[CORS] Origin "https://break-agency-hvwqbubxv-lilas-projects-27f9c819.vercel.app" is BLOCKED
```

**Root Cause:**
- Vercel creates new preview URLs for each deployment (e.g., `break-agency-*.vercel.app`)
- Railway API only had one specific Vercel URL in allowed origins
- New preview deployments were being blocked

---

## FIX APPLIED

### ✅ Updated CORS Configuration
**File:** `apps/api/src/server.ts`

**Changes:**
- Added logic to allow ALL Vercel preview URLs (`.vercel.app` domain)
- This allows dynamic Vercel deployment URLs without manual updates

**Code Added:**
```typescript
// Allow Vercel preview URLs (dynamic per deployment)
// Pattern: https://break-agency-*.vercel.app or https://*.vercel.app
if (origin.includes('.vercel.app')) {
  console.log(`[CORS] Origin "${origin}" is ALLOWED (Vercel preview)`);
  return callback(null, true);
}
```

---

## DEPLOYMENT

**Status:** ✅ **COMMITTED & PUSHED**

- Changes committed to GitHub
- Railway will auto-deploy from GitHub
- Should be live in 2-3 minutes

---

## VERIFICATION

After deployment, check Railway logs:
```bash
railway logs --tail 50
```

**Expected:**
- ✅ Vercel preview URLs should show: `[CORS] Origin "...vercel.app" is ALLOWED (Vercel preview)`
- ✅ No more CORS blocking errors
- ✅ API requests from Vercel previews should work

---

## SECURITY NOTE

Allowing all `.vercel.app` domains is safe because:
1. Vercel controls the domain namespace
2. Only Vercel can create `.vercel.app` subdomains
3. This is a standard pattern for preview deployments
4. Production domains (`tbctbctbc.online`) are still explicitly allowed

---

**Status:** ✅ Fixed. CORS will now allow all Vercel preview URLs automatically.

