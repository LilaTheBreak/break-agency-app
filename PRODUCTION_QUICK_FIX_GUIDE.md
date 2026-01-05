# 🔧 PRODUCTION READINESS QUICK-FIX GUIDE

This guide shows EXACTLY which lines to fix for production deployment.

---

## ✅ STEP 1: Railway Environment Variables
**Time: 5 minutes**

Add these to Railway dashboard → Environment Variables:

```bash
GOOGLE_REDIRECT_URI=https://breakagencyapi-production.up.railway.app/api/auth/google/callback
MAIL_API_GOOGLE_REDIRECT_URI=https://breakagencyapi-production.up.railway.app/api/gmail/auth/callback
API_URL=https://breakagencyapi-production.up.railway.app
WEB_URL=https://www.tbctbctbc.online
```

Verify DATABASE_URL, NODE_ENV=production, and FRONTEND_ORIGIN are also set.

---

## ✅ STEP 2: Fix Backend OAuth Redirect

**File:** `apps/api/src/lib/env.ts`

**Find lines 25-28:**
```typescript
export const googleConfig = {
  clientId: getEnv("GOOGLE_CLIENT_ID"),
  clientSecret: getEnv("GOOGLE_CLIENT_SECRET"),
  redirectUri: getEnv(
    "GOOGLE_REDIRECT_URI",
    "http://localhost:5001/api/auth/google/callback"  // ← REMOVE THIS
  ),
};
```

**Replace with:**
```typescript
const googleRedirectUri = process.env.GOOGLE_REDIRECT_URI;
if (!googleRedirectUri && process.env.NODE_ENV === "production") {
  console.error("❌ FATAL: GOOGLE_REDIRECT_URI not set in production");
  process.exit(1);
}

export const googleConfig = {
  clientId: getEnv("GOOGLE_CLIENT_ID"),
  clientSecret: getEnv("GOOGLE_CLIENT_SECRET"),
  redirectUri: googleRedirectUri || "http://localhost:5001/api/auth/google/callback",
};
```

---

## ✅ STEP 3: Fix Gmail OAuth Redirect

**File:** `apps/api/src/services/gmail/tokens.ts`

**Find line 31:**
```typescript
const redirectUri =  process.env.MAIL_API_GOOGLE_REDIRECT_URI
  ? process.env.MAIL_API_GOOGLE_REDIRECT_URI
  : 'http://localhost:5001/api/gmail/auth/callback';  // ← REMOVE THIS
```

**Replace with:**
```typescript
const redirectUri = process.env.MAIL_API_GOOGLE_REDIRECT_URI;
if (!redirectUri && process.env.NODE_ENV === "production") {
  console.error("❌ FATAL: MAIL_API_GOOGLE_REDIRECT_URI not set in production");
  process.exit(1);
}
```

---

## ✅ STEP 4: Fix Email Service Base URL

**File:** `apps/api/src/services/email/sendOutbound.ts`

**Find line 6:**
```typescript
const BASE_URL = process.env.API_URL || "http://localhost:5001";  // ← REMOVE DEFAULT
```

**Replace with:**
```typescript
const BASE_URL = process.env.API_URL;
if (!BASE_URL && process.env.NODE_ENV === "production") {
  console.error("❌ FATAL: API_URL not set in production");
  process.exit(1);
}
const fallbackBaseUrl = BASE_URL || "http://localhost:5001";
```

---

## ✅ STEP 5: Fix Frontend URL Configuration

**File:** `apps/api/src/config/frontendUrl.ts`

**Find around line 86:**
```typescript
const webUrl = process.env.WEB_URL || "http://localhost:5173";  // ← REMOVE DEFAULT
```

**Replace with:**
```typescript
const webUrl = process.env.WEB_URL;
if (!webUrl && process.env.NODE_ENV === "production") {
  throw new Error(
    "❌ FATAL: WEB_URL not set in production. " +
    "Set to: https://www.tbctbctbc.online"
  );
}
export const getFrontendUrl = () => webUrl || "http://localhost:5173";
```

---

## ✅ STEP 6: Validate Frontend API URL

**File:** `apps/web/src/services/apiClient.js`

**Find lines 4-10:**
```javascript
const RAW_API_BASE = import.meta.env?.VITE_API_URL;
let API_BASE = "/api";  // ← REMOVE THIS DEFAULT

if (RAW_API_BASE && RAW_API_BASE.length) {
  // ... handle VITE_API_URL
} else {
  API_BASE = "/api";  // ← REMOVE THIS FALLBACK
}
```

**Replace with:**
```javascript
const RAW_API_BASE = import.meta.env?.VITE_API_URL;

// Fail fast in production if API URL not configured
if (!RAW_API_BASE && import.meta.env.MODE === 'production') {
  console.error(
    '❌ FATAL: VITE_API_URL environment variable not set.\n' +
    'Add to vercel.json: "VITE_API_URL": "https://breakagencyapi-production.up.railway.app"'
  );
  throw new Error('VITE_API_URL is required in production');
}

let API_BASE = "/api";  // Dev fallback only
if (RAW_API_BASE && RAW_API_BASE.length) {
  const cleaned = RAW_API_BASE.replace(/\\n|\\r|\n|\r/g, '').trim();
  if (/^https?:\/\//i.test(cleaned)) {
    let base = cleaned.replace(/\/$/, '');
    if (!base.endsWith('/api')) {
      base = base + '/api';
    }
    API_BASE = base;
  }
}
```

---

## ✅ STEP 7: Verify Vercel Configuration

**File:** `vercel.json`

**Check line with env (should be around line 8):**
```json
{
  ...
  "env": {
    "VITE_API_URL": "https://breakagencyapi-production.up.railway.app"
  },
  ...
}
```

✅ Already correct! No changes needed.

---

## ✅ STEP 8: Test Locally

Before deploying, test that errors throw:

```bash
# Test backend startup with missing env var
cd apps/api
unset GOOGLE_REDIRECT_URI  # Simulate missing var
npm run dev  # Should show error and exit
```

```bash
# Test frontend build with missing var
cd apps/web
unset VITE_API_URL  # Simulate missing var
npm run build  # Should show error
```

---

## ✅ STEP 9: Deploy & Verify

```bash
# 1. Commit all changes
git add .
git commit -m "fix: require production env vars, remove localhost fallbacks"

# 2. Set Railway env vars (dashboard)
# GOOGLE_REDIRECT_URI
# MAIL_API_GOOGLE_REDIRECT_URI
# API_URL
# WEB_URL

# 3. Deploy to Railway
git push  # Triggers Railway deployment

# 4. Verify Vercel built
# Check Vercel dashboard → last deployment successful

# 5. Manual smoke test
# Open https://www.tbctbctbc.online
# Check DevTools Network tab:
#   - All requests to breakagencyapi-production.up.railway.app ✓
#   - auth_token in localStorage ✓
#   - Login works ✓
```

---

## ✅ QUICK REFERENCE: What Changed

| File | Line | Change | Reason |
|------|------|--------|--------|
| `env.ts` | 27 | Remove localhost fallback | OAuth must not go to localhost |
| `gmail/tokens.ts` | 31 | Remove localhost fallback | Gmail auth must not go to localhost |
| `sendOutbound.ts` | 6 | Remove localhost fallback | Email links must not be localhost |
| `frontendUrl.ts` | 86 | Remove localhost fallback | Auth redirects must not be localhost |
| `apiClient.js` | 4-10 | Add production validation | API URL must be explicit in prod |

---

## 🟢 DONE?

When all fixes applied and tested:

```bash
git push  # Deploy to production
```

Monitor Railway logs for errors. If no errors in first 10 minutes, you're done! 🎉

