# 🔍 PRODUCTION READINESS AUDIT - COMPREHENSIVE
**Date:** January 5, 2026  
**Auditor:** Senior Platform Engineer  
**Scope:** Neon + Railway + Vercel Integration Audit  
**Requested By:** Deployment Team

---

## ⚡ EXECUTIVE SUMMARY

**VERDICT: 🟡 CONDITIONAL GO - 5 CRITICAL ISSUES MUST BE FIXED**

The Break platform is **architecturally correct** with proper Vercel → Railway → Neon separation. However, **production deployment is BLOCKED by fallback configurations that could cause silent failures**.

### Status Matrix:

| Component | Status | Risk | Action |
|-----------|--------|------|--------|
| **Infrastructure** | ✅ Correct | None | Go |
| **Database** | ✅ Neon only | None | Go |
| **Backend** | ⚠️ Localhost fallbacks | **CRITICAL** | **FIX** |
| **Frontend** | ⚠️ Missing API URL fallback | **CRITICAL** | **FIX** |
| **Auth** | ⚠️ Localhost redirects | **CRITICAL** | **FIX** |
| **Local Storage** | ✅ Auth token only | Low | Monitor |
| **API Calls** | ✅ All real | None | Go |
| **Error Handling** | ✅ Proper codes | None | Go |
| **Security** | ✅ No exposed secrets | None | Go |
| **CORS** | ✅ Locked to domain | None | Go |

---

## 🔴 CRITICAL BLOCKERS (MUST FIX)

### 1. OAuth Redirect URI Fallback
**File:** `apps/api/src/lib/env.ts:27`

**ISSUE:** OAuth defaults to `http://localhost:5001` if env var not set
```typescript
// ❌ CURRENT (BROKEN IN PROD)
redirectUri: getEnv("GOOGLE_REDIRECT_URI", "http://localhost:5001/api/auth/google/callback")

// PROBLEM: If env var missing, users can't authenticate
// USER IMPACT: OAuth redirect fails silently
// DETECTION: Won't show errors until user tries to login
```

**FIX REQUIRED:**
```typescript
// ✅ FIXED (FAILS FAST)
const redirectUri = process.env.GOOGLE_REDIRECT_URI;
if (!redirectUri) {
  if (process.env.NODE_ENV === "production") {
    console.error("❌ FATAL: GOOGLE_REDIRECT_URI not set in production");
    process.exit(1);
  }
}
export const googleConfig = { redirectUri: redirectUri || "http://localhost:5001/..." };
```

---

### 2. Gmail OAuth Redirect Fallback
**File:** `apps/api/src/services/gmail/tokens.ts:31`

**ISSUE:** Gmail auth defaults to localhost
```typescript
// ❌ CURRENT (BROKEN IN PROD)
redirectUri: process.env.MAIL_API_GOOGLE_REDIRECT_URI || 'http://localhost:5001/api/gmail/auth/callback'
```

**FIX REQUIRED:** Same as above - require env var in production, don't fallback

---

### 3. Frontend API URL Missing Validation
**File:** `apps/web/src/services/apiClient.js:4-10`

**ISSUE:** API client falls back to `/api` when VITE_API_URL not set
```javascript
// ❌ CURRENT (WRONG)
const RAW_API_BASE = import.meta.env?.VITE_API_URL;
let API_BASE = "/api";  // ⚠️ Fallback to relative path

if (RAW_API_BASE && RAW_API_BASE.length) {
  // use VITE_API_URL
} else {
  API_BASE = "/api";  // ⚠️ This is wrong in production!
}

// PROBLEM: /api doesn't exist on Vercel (not proxied to Railway)
// REQUESTS: Would 404 or hit Vercel's own APIs
// USER IMPACT: App appears broken, network errors, no clear reason why
```

**FIX REQUIRED:**
```javascript
// ✅ FIXED (FAILS FAST)
const VITE_API_URL = import.meta.env?.VITE_API_URL;

if (!VITE_API_URL) {
  if (import.meta.env.MODE === 'production') {
    throw new Error(
      'FATAL: VITE_API_URL environment variable not set. ' +
      'Add to vercel.json: "VITE_API_URL": "https://breakagencyapi-production.up.railway.app"'
    );
  }
  console.warn('[apiClient] VITE_API_URL not set, falling back to /api for development');
}

const API_BASE = VITE_API_URL ? normalize(VITE_API_URL) : '/api';
```

---

### 4. Email Service Base URL Fallback
**File:** `apps/api/src/services/email/sendOutbound.ts:6`

**ISSUE:** Email service defaults to localhost
```typescript
// ❌ CURRENT
const BASE_URL = process.env.API_URL || "http://localhost:5001";

// PROBLEM: If API_URL not set, emails have localhost links
// USER IMPACT: Email links broken in production
```

**FIX REQUIRED:** Require in production

---

### 5. Frontend URL Configuration
**File:** `apps/api/src/config/frontendUrl.ts:86`

**ISSUE:** Default to localhost:5173
```typescript
// ❌ CURRENT
const webUrl = process.env.WEB_URL || "http://localhost:5173";

// PROBLEM: Redirects in emails/auth would go to localhost
```

**FIX REQUIRED:** Require in production

---

## ✅ WHAT'S CORRECT

### Database Setup
```
✅ Neon is the single source of truth
✅ Prisma datasource uses env("DATABASE_URL")
✅ DATABASE_URL is REQUIRED (checked at startup)
✅ No localhost DB URLs
✅ No shadow databases
```

### Backend Configuration
```
✅ NODE_ENV=production in Railway
✅ All required env vars checked at startup
✅ Sentry properly configured
✅ CORS restricted to production domain
✅ Security headers set correctly
```

### Frontend Configuration
```
✅ VITE_API_URL set in vercel.json (mostly)
✅ No secrets in frontend code
✅ API calls go to Railway endpoint
✅ CSP restricts to Railway domain
```

### Local Storage Usage
```
✅ Auth token (necessary for cross-domain)
✅ UI preferences only (dismissed tips)
✅ Draft data only (exclusive profile)
✅ No business data cached
```

### API Connectivity
```
✅ All pages make real API calls
✅ No hardcoded mock data
✅ No fallback UI renders
✅ Proper error handling (see separate audit)
```

---

## 📋 DETAILED FINDINGS

### Environment Variables - What's Set

| Variable | Backend | Frontend | Status |
|----------|---------|----------|--------|
| DATABASE_URL | ✅ Required | ❌ N/A | Good |
| VITE_API_URL | ❌ N/A | ⚠️ Set but no fallback | Medium |
| GOOGLE_REDIRECT_URI | ⚠️ Has fallback | ❌ N/A | **CRITICAL** |
| MAIL_API_GOOGLE_REDIRECT_URI | ⚠️ Has fallback | ❌ N/A | **CRITICAL** |
| API_URL | ⚠️ Has fallback | ❌ N/A | **CRITICAL** |
| WEB_URL | ⚠️ Has fallback | ❌ N/A | **CRITICAL** |
| FRONTEND_ORIGIN | ✅ Set | ❌ N/A | Good |
| NODE_ENV | ✅ production | ✅ Set | Good |

---

### Localhost References Found

**Backend (Need to Remove):**
```
❌ http://localhost:5001 (OAuth redirect - LINE 27)
❌ http://localhost:5001 (Gmail OAuth - LINE 31)  
❌ http://localhost:5001 (Email BASE_URL - LINE 6)
❌ http://localhost:5173 (Frontend URL - LINE 86)
❌ http://localhost:5173 (Auth routes - LINE 34)
```

**Frontend (OK - Just config):**
```
✅ localhost:5173 (dev config only)
✅ localhost:5001 (dev config only)
```

---

### Local Storage Audit

**Current Usage:**
```javascript
✅ auth_token        → JWT Bearer token (necessary)
✅ dismissed_tips_*  → UI hints (preference)
✅ break_exclusive_*  → Form draft (OK)
⚠️ Legacy CRM data    → Migration tool only (not active)
```

**Verdict:** ✅ **ACCEPTABLE**
- Only auth token is from API
- No business data cached
- Draft data sent to server on save
- Legacy data is for migration only

---

### API Call Verification

**Checked Pages:**
```
✅ /login           → /api/auth/google/url
✅ /admin/talent    → /api/admin/talent
✅ /admin/deals     → /api/admin/deals
✅ /admin/brands    → /api/crm-brands
✅ /admin/campaigns → /api/admin/campaigns
✅ /admin/finance   → /api/finance/*
✅ /admin/inbox     → /api/inbox/*
✅ /talent/profile  → /api/user/profile
✅ /dashboard       → /api/analytics/*
```

**Verdict:** ✅ **ALL MAKE REAL API CALLS** - No mocks, no fallbacks

---

### Security Scan

**API Keys Found:**
```
✅ OPENAI_API_KEY   → Backend only, not exposed
✅ GOOGLE_SECRET    → Backend only, not exposed
✅ DATABASE_URL     → Backend only, not exposed
✅ JWT_SECRET       → Backend only, not exposed
```

**Verified:**
```
✅ No secrets in frontend code
✅ No secrets in env files
✅ Secrets masked in UI (Stripe keys show as ••••••)
✅ CSP restricts to approved domains
✅ X-Frame-Options: DENY
✅ HSTS enabled (63 days)
```

**Verdict:** ✅ **SECURE** - No exposed secrets

---

### CORS & Cross-Domain

**Frontend Domain:** `https://www.tbctbctbc.online`  
**Backend Domain:** `https://breakagencyapi-production.up.railway.app`  
**Auth Method:** Bearer token in Authorization header

**CORS Configuration:**
```typescript
✅ Allows production domain only
✅ Allows Vercel preview URLs (for testing)
✅ Blocks unknown origins
✅ Proper error logging
```

**Verdict:** ✅ **CORRECT** - Proper environment isolation

---

## 🚨 CRITICAL ACTION ITEMS

### Priority 1: OAuth Failures (User-Facing)

**1.1 Fix GOOGLE_REDIRECT_URI**
```bash
# In Railway dashboard → Environment Variables:
# Add or verify:
GOOGLE_REDIRECT_URI=https://breakagencyapi-production.up.railway.app/api/auth/google/callback

# Then update code to REQUIRE it:
```

**1.2 Fix MAIL_API_GOOGLE_REDIRECT_URI**
```bash
# Add to Railway:
MAIL_API_GOOGLE_REDIRECT_URI=https://breakagencyapi-production.up.railway.app/api/gmail/auth/callback
```

**1.3 Remove localhost fallbacks from code**
- Edit `apps/api/src/lib/env.ts` - fail if GOOGLE_REDIRECT_URI missing in prod
- Edit `apps/api/src/services/gmail/tokens.ts` - fail if MAIL_API_GOOGLE_REDIRECT_URI missing in prod

---

### Priority 2: Email & URL Generation (Content-Facing)

**2.1 Fix API_URL**
```bash
# Add to Railway:
API_URL=https://breakagencyapi-production.up.railway.app
```

**2.2 Fix WEB_URL**
```bash
# Add to Railway:
WEB_URL=https://www.tbctbctbc.online
```

**2.3 Remove localhost fallbacks**
- Edit `apps/api/src/services/email/sendOutbound.ts` - require API_URL
- Edit `apps/api/src/config/frontendUrl.ts` - require WEB_URL

---

### Priority 3: Frontend API URL (Architecture)

**3.1 Validate VITE_API_URL**
```javascript
// apps/web/src/services/apiClient.js
if (!import.meta.env.VITE_API_URL && import.meta.env.MODE === 'production') {
  throw new Error('VITE_API_URL required in production');
}
```

**3.2 Verify vercel.json**
```json
{
  "env": {
    "VITE_API_URL": "https://breakagencyapi-production.up.railway.app"
  }
}
```

---

## ✅ VERIFICATION STEPS

### After Fixes, Run This Checklist:

```bash
# 1. Check Railway dashboard
[ ] GOOGLE_REDIRECT_URI is set
[ ] MAIL_API_GOOGLE_REDIRECT_URI is set  
[ ] API_URL is set
[ ] WEB_URL is set
[ ] DATABASE_URL is set
[ ] NODE_ENV=production

# 2. Verify Vercel deployment
[ ] VITE_API_URL in vercel.json
[ ] Built successfully
[ ] Environment variables set

# 3. Manual test (fresh incognito)
[ ] Load https://www.tbctbctbc.online
[ ] Network tab shows Railway API calls
[ ] Log in works (Google OAuth)
[ ] Verify token in localStorage (auth_token)
[ ] Navigate /admin/talent → list loads
[ ] Refresh page → data persists
[ ] Log out → token cleared

# 4. Check logs
[ ] No localhost references in production logs
[ ] No missing env var warnings
[ ] No fallback messages
```

---

## 📊 SUMMARY

| Category | Status | Issues | Risk |
|----------|--------|--------|------|
| **Infrastructure** | ✅ | 0 | None |
| **Database** | ✅ | 0 | None |
| **Frontend Setup** | ⚠️ | 1 | Medium |
| **Backend Config** | ❌ | 4 | **CRITICAL** |
| **Auth/OAuth** | ❌ | 2 | **CRITICAL** |
| **Local Storage** | ✅ | 0 | None |
| **API Calls** | ✅ | 0 | None |
| **Security** | ✅ | 0 | None |
| **Error Handling** | ✅ | 0 | None |

**Total Issues:** 7  
**Blockers:** 5  
**Can Deploy:** Only after fixes

---

## 🎯 DEPLOYMENT READINESS

### Before Deploy:
- [ ] All 5 critical fixes applied
- [ ] All 4 env vars set in Railway
- [ ] Code changes tested locally
- [ ] Vercel redeployed
- [ ] Smoke test passed

### Estimated Time: 2 hours

**Go/No-Go Decision:**
- **NOW:** 🔴 NO-GO (fallbacks would cause failures)
- **AFTER FIXES:** 🟢 GO (architecture is sound)

---

**Audit Complete**  
**Next Step:** Apply fixes, re-test, deploy

