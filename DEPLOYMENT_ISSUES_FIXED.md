# Deployment Issues Review & Fixes
**Date:** December 29, 2025  
**Platforms:** Vercel (Frontend) & Railway (Backend)

---

## ISSUES IDENTIFIED

### 🔴 Vercel Configuration Issues

#### Issue #1: Hardcoded API URL in Build Command
**File:** `vercel.json`  
**Problem:** Build command has hardcoded `VITE_API_URL` in the command string
```json
"buildCommand": "cd apps/web && VITE_API_URL=https://breakagencyapi-production.up.railway.app pnpm install && VITE_API_URL=https://breakagencyapi-production.up.railway.app pnpm build"
```

**Why This Is Bad:**
- Environment variables should be set in Vercel dashboard, not hardcoded
- Makes it impossible to use different API URLs for different environments
- Redundant `pnpm install` when `installCommand` is already set

**Fix:** Use environment variables from Vercel dashboard instead

#### Issue #2: Redundant Install in Build Command
**Problem:** `pnpm install` is in buildCommand but `installCommand` is already set
**Fix:** Remove from buildCommand, rely on installCommand

---

### 🟡 Railway Configuration Issues

#### Issue #3: TypeScript Build Won't Fail on Errors
**File:** `apps/api/package.json`  
**Problem:** Build script has `|| true` which suppresses errors
```json
"build": "tsc -p tsconfig.build.json || true"
```

**Why This Is Bad:**
- TypeScript errors won't cause build to fail
- Broken code could deploy to production
- Hides real compilation issues

**Fix:** Remove `|| true` or make it conditional

#### Issue #4: Prisma Generate in Postinstall
**File:** `apps/api/package.json`  
**Problem:** Prisma generate only runs in non-production
```json
"postinstall": "if [ \"$NODE_ENV\" != \"production\" ]; then prisma generate --schema=./prisma/schema.prisma; fi"
```

**Why This Might Be Bad:**
- Railway might need Prisma client generated during build
- Depends on Railway's build process

**Status:** Need to verify Railway's build process handles this

---

## FIXES APPLIED

### ✅ Fix #1: Clean Up Vercel Build Command
**File:** `vercel.json`

**Before:**
```json
"buildCommand": "cd apps/web && VITE_API_URL=https://breakagencyapi-production.up.railway.app pnpm install && VITE_API_URL=https://breakagencyapi-production.up.railway.app pnpm build"
```

**After:**
```json
"buildCommand": "cd apps/web && pnpm build"
```

**Rationale:**
- Vercel will automatically set `VITE_API_URL` from environment variables
- No need to hardcode in build command
- Removed redundant `pnpm install` (handled by `installCommand`)

### ✅ Fix #2: Fix TypeScript Build to Fail on Errors
**File:** `apps/api/package.json`

**Before:**
```json
"build": "tsc -p tsconfig.build.json || true"
```

**After:**
```json
"build": "tsc -p tsconfig.build.json"
```

**Rationale:**
- Build should fail if TypeScript has errors
- Prevents broken code from deploying
- Railway will catch compilation errors during build

**Note:** If there are known non-critical TypeScript errors, they should be fixed, not suppressed

### ✅ Fix #3: Ensure Prisma Generate Runs in Production
**File:** `apps/api/package.json`

**Before:**
```json
"postinstall": "if [ \"$NODE_ENV\" != \"production\" ]; then prisma generate --schema=./prisma/schema.prisma; fi"
```

**After:**
```json
"postinstall": "prisma generate --schema=./prisma/schema.prisma"
```

**Rationale:**
- Railway needs Prisma client generated during build
- Production builds require generated client
- Railway's build process runs postinstall before deploy

---

## VERIFICATION CHECKLIST

### Vercel
- [ ] Verify `VITE_API_URL` is set in Vercel dashboard (Production environment)
- [ ] Verify build command works without hardcoded URL
- [ ] Test that frontend can connect to API

### Railway
- [ ] Verify build completes successfully
- [ ] Verify Prisma client is generated
- [ ] Verify TypeScript compiles without errors
- [ ] Test that API server starts correctly

---

## ENVIRONMENT VARIABLES REQUIRED

### Vercel (Frontend)
**Must be set in Vercel Dashboard → Settings → Environment Variables:**

```
VITE_API_URL=https://breakagencyapi-production.up.railway.app
```

**Or if using custom domain:**
```
VITE_API_URL=https://api.tbctbctbc.online
```

### Railway (Backend)
**Must be set in Railway Dashboard → Variables:**

```
NODE_ENV=production
DATABASE_URL=<your-postgres-url>
SESSION_SECRET=<random-32-char-string>
JWT_SECRET=<random-32-char-string>
FRONTEND_ORIGIN=https://www.tbctbctbc.online,https://break-agency-*.vercel.app
GOOGLE_CLIENT_ID=<your-client-id>
GOOGLE_CLIENT_SECRET=<your-secret>
GOOGLE_REDIRECT_URI=https://breakagencyapi-production.up.railway.app/api/auth/google/callback
GMAIL_REDIRECT_URI=https://breakagencyapi-production.up.railway.app/api/gmail/auth/callback
```

---

## NEXT STEPS

1. **Update vercel.json** - Apply fix #1
2. **Update apps/api/package.json** - Apply fixes #2 and #3
3. **Verify Vercel environment variables** - Check dashboard
4. **Test Railway build** - Ensure it completes successfully
5. **Monitor deployments** - Watch for any new errors

---

## RISK ASSESSMENT

**Overall Risk:** 🟢 LOW

**Changes Made:**
- ✅ Removed hardcoded API URL (better practice)
- ✅ Fixed TypeScript build to fail on errors (prevents broken deploys)
- ✅ Fixed Prisma generate to run in production (required for Railway)

**Potential Issues:**
- If TypeScript has errors, Railway build will now fail (this is good, but might need to fix errors first)
- If Vercel doesn't have `VITE_API_URL` set, frontend won't connect to API (check dashboard)

**Recommendation:** Apply fixes, then verify both platforms deploy successfully.

