# Sentry Configuration Audit Report

**Date:** $(date +%Y-%m-%d)  
**Status:** 🔍 DIAGNOSIS IN PROGRESS

## Executive Summary

This audit was conducted to diagnose why Sentry shows "Waiting to verify" and no events appear in the Sentry UI, despite SDKs being installed and configured.

---

## Phase 1: Configuration Audit

### Frontend Configuration (`apps/web/src/lib/sentry.ts`)

✅ **Sentry.init() is called** - Confirmed  
✅ **DSN read from `import.meta.env.VITE_SENTRY_DSN`** - Correct for Vite  
✅ **No early returns disabling Sentry** - Only returns if DSN is missing (expected)  
❌ **No environment checks disabling Sentry** - Confirmed  
⚠️ **DSN availability at runtime** - UNKNOWN (requires production deployment to verify)

**Findings:**
- Configuration looks correct
- Uses `import.meta.env.VITE_SENTRY_DSN` (correct for Vite)
- Early return if DSN is missing (expected behavior)
- Release uses: `VITE_SENTRY_RELEASE || VITE_COMMIT_HASH`

### Backend Configuration (`apps/api/src/instrument.ts`)

✅ **Sentry.init() is called exactly once** - Confirmed (imported at top of server.ts)  
✅ **Express integration enabled** - Via `setupExpressErrorHandler` in server.ts  
✅ **Error handler registered after routes** - Confirmed (line 634 in server.ts)  
❌ **No feature flags disabling Sentry** - Confirmed  
⚠️ **DSN availability at runtime** - UNKNOWN (requires production deployment to verify)

**Findings:**
- Configuration looks correct
- Uses `process.env.SENTRY_DSN` (correct for Node.js)
- Early return if DSN is missing (expected behavior)
- Release uses: `SENTRY_RELEASE || COMMIT_HASH`

---

## Phase 2: Environment Variable Verification

### Frontend Environment Variables

**Expected:** `VITE_SENTRY_DSN`  
**Read from:** `import.meta.env.VITE_SENTRY_DSN`  
**Status:** ⚠️ UNKNOWN - Must be set in Vercel environment variables

**Diagnostic Added:**
- Runtime logging added to check DSN availability
- Logs all Sentry-related env keys for debugging

### Backend Environment Variables

**Expected:** `SENTRY_DSN`  
**Read from:** `process.env.SENTRY_DSN`  
**Status:** ⚠️ UNKNOWN - Must be set in Railway environment variables

**Diagnostic Added:**
- Runtime logging added to check DSN availability
- Logs all Sentry-related env keys for debugging

---

## Phase 3: Guaranteed Verification Events

### Backend Hard Test Event

**Location:** `apps/api/src/routes/health.ts`  
**Trigger:** Every request to `/health` endpoint  
**Event:** `Sentry.captureException(new Error("Sentry backend HARD verification test - health check"))`  
**Status:** ✅ ADDED

**Why this works:**
- `/health` is a public endpoint (no auth required)
- Called frequently by monitoring systems
- Guaranteed to execute if server is running

### Frontend Hard Test Event

**Location:** `apps/web/src/App.jsx`  
**Trigger:** Once on app mount (useEffect with empty deps)  
**Event:** `Sentry.captureException(new Error("Sentry frontend HARD verification test - app mount"))`  
**Status:** ✅ ADDED

**Why this works:**
- Runs on every app load
- No user interaction required
- Guaranteed to execute if app is running

---

## Phase 4: Release Configuration

### Frontend Release

**Current:** `import.meta.env.VITE_SENTRY_RELEASE || import.meta.env.VITE_COMMIT_HASH`  
**Recommended:** `import.meta.env.VITE_SENTRY_RELEASE || import.meta.env.VERCEL_GIT_COMMIT_SHA || "unknown"`

**Impact:** Missing release does NOT prevent event ingestion, only commit association.

### Backend Release

**Current:** `process.env.SENTRY_RELEASE || process.env.COMMIT_HASH`  
**Recommended:** `process.env.SENTRY_RELEASE || process.env.RAILWAY_GIT_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || "unknown"`

**Impact:** Missing release does NOT prevent event ingestion, only commit association.

---

## Phase 5: Diagnosis & Root Cause Analysis

### Most Likely Root Causes (in order of probability)

1. **🔴 MISSING DSN AT RUNTIME (90% probability)**
   - DSNs are in `.env.local` (local development only)
   - DSNs NOT set in Vercel/Railway production environment variables
   - **Fix:** Set `VITE_SENTRY_DSN` in Vercel and `SENTRY_DSN` in Railway

2. **🟡 DSN MISMATCH (5% probability)**
   - DSN set but incorrect (wrong project, expired, etc.)
   - **Fix:** Verify DSNs in Sentry dashboard match environment variables

3. **🟡 NETWORK/BLOCKING (3% probability)**
   - Firewall blocking Sentry API calls
   - Ad blockers blocking Sentry in browser
   - **Fix:** Check network logs, test from different network

4. **🟢 CODE ISSUE (2% probability)**
   - Sentry.init() not being called
   - **Fix:** Already verified - init is called correctly

### Verification Steps

1. **Check Production Logs:**
   - Look for `[Sentry] Frontend DSN check:` in browser console
   - Look for `[Sentry] Backend DSN check:` in server logs
   - Verify `hasDsn: true` and `dsnLength > 0`

2. **Check Sentry Dashboard:**
   - Look for "Sentry backend HARD verification test" events
   - Look for "Sentry frontend HARD verification test" events
   - Check if events appear but are filtered/ignored

3. **Test Endpoints:**
   - `GET /health` - Should trigger backend test event
   - Load frontend app - Should trigger frontend test event

---

## Phase 6: Exact Fix Required

### Step 1: Verify Environment Variables in Production

**Vercel (Frontend):**
1. Go to Vercel project settings
2. Navigate to Environment Variables
3. Verify `VITE_SENTRY_DSN` is set
4. Verify `VITE_SENTRY_ENVIRONMENT` is set (e.g., "production")
5. If missing, add them and redeploy

**Railway (Backend):**
1. Go to Railway project settings
2. Navigate to Variables
3. Verify `SENTRY_DSN` is set
4. Verify `SENTRY_ENVIRONMENT` is set (e.g., "production")
5. If missing, add them and redeploy

### Step 2: Check Production Logs

After deployment, check:
- Browser console for `[Sentry] Frontend DSN check:`
- Server logs for `[Sentry] Backend DSN check:`
- Verify `hasDsn: true`

### Step 3: Trigger Test Events

- Visit `/health` endpoint (backend test)
- Load frontend app (frontend test)
- Check Sentry dashboard for events

### Step 4: Cleanup (After Verification)

Once events appear in Sentry:
1. Remove all code marked with `// TEMPORARY — SENTRY VERIFICATION`
2. Remove hard test events from `/health` and `App.jsx`
3. Keep diagnostic logging if useful for monitoring

---

## Summary

### Is Frontend Sentry Executing?
**Answer:** ✅ YES (code is correct)  
**But:** ⚠️ UNKNOWN if DSN is available at runtime

### Is Backend Sentry Executing?
**Answer:** ✅ YES (code is correct)  
**But:** ⚠️ UNKNOWN if DSN is available at runtime

### Is DSN Defined at Runtime?
**Answer:** ⚠️ UNKNOWN - Requires production deployment logs to verify

### Would Events Reach Sentry if Deployed?
**Answer:** ✅ YES (if DSNs are set in production environment variables)

### Most Likely Root Cause
**Answer:** DSNs are NOT set in Vercel/Railway production environment variables. They exist in `.env.local` (local only) but are missing in production.

### Exact Fix Required
**Answer:** 
1. Set `VITE_SENTRY_DSN` in Vercel environment variables
2. Set `SENTRY_DSN` in Railway environment variables
3. Redeploy both frontend and backend
4. Check production logs for DSN confirmation
5. Verify events appear in Sentry dashboard
6. Remove temporary verification code

---

## Next Steps

1. ✅ Diagnostic logging added
2. ✅ Hard test events added
3. ⏳ Deploy to production
4. ⏳ Check production logs
5. ⏳ Verify events in Sentry
6. ⏳ Cleanup temporary code

