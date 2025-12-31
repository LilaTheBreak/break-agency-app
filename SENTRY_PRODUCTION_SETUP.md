# Sentry Production Configuration Guide

**Status:** ✅ Code Audit Complete - Ready for Environment Variable Setup

This guide provides exact instructions for configuring Sentry in production environments.

---

## PART 1: FRONTEND (Vercel)

### Code Audit Results

**File:** `apps/web/src/lib/sentry.ts`

**Environment Variables Used:**
- `import.meta.env.VITE_SENTRY_DSN` - Frontend Sentry DSN
- `import.meta.env.VITE_SENTRY_ENVIRONMENT` - Environment name (defaults to `MODE` if not set)

**Validation:**
- ✅ No hardcoded DSN values found
- ✅ No fallback DSN values found
- ✅ `Sentry.init()` exits early ONLY when DSN is missing (line 34-37)
- ✅ Early return is expected behavior when DSN is missing

### Required Vercel Environment Variables

**Location:** Vercel Dashboard → Your Project → Settings → Environment Variables

**Required Variables:**

| Variable Name | Value | Environment | Notes |
|---------------|-------|-------------|-------|
| `VITE_SENTRY_DSN` | `<Your Frontend DSN>` | Production | Get from Sentry Dashboard → Settings → Client Keys (DSN) |
| `VITE_SENTRY_ENVIRONMENT` | `production` | Production | Environment identifier for Sentry |

**Optional Variables:**

| Variable Name | Value | Environment | Notes |
|---------------|-------|-------------|-------|
| `VITE_SENTRY_RELEASE` | `<commit-hash>` | Production | Optional: For release tracking (can use `VERCEL_GIT_COMMIT_SHA`) |

**How to Find Your Frontend DSN:**
1. Go to Sentry Dashboard
2. Select your **Frontend/React** project
3. Navigate to: Settings → Client Keys (DSN)
4. Copy the DSN (format: `https://...@...ingest.sentry.io/...`)

**Apply To:**
- ✅ Production
- ⚠️ Preview (optional - can use same DSN or separate project)

### Frontend Verification Steps

**After setting variables and deploying:**

1. **Open Production App in Browser**
   - Navigate to your production URL
   - Open browser Developer Tools → Console

2. **Check Console Logs**
   Look for:
   ```
   [Sentry] Frontend DSN check: {
     hasDsn: true,           ← MUST be true
     dsnLength: 89,          ← Should be > 0
     environment: "production",
     release: "...",
     allEnvKeys: ["VITE_SENTRY_DSN", "VITE_SENTRY_ENVIRONMENT", ...]
   }
   ```

3. **Verify Sentry Dashboard**
   - Go to Sentry Dashboard → Issues/Events
   - Look for event: **"Sentry frontend HARD verification test - app mount"**
   - Event should have:
     - Platform: `javascript`
     - Environment: `production`
     - Tags: `verification: "hard_test"`, `source: "app_mount"`

**If `hasDsn: false`:**
- ❌ `VITE_SENTRY_DSN` not set in Vercel
- Fix: Add variable in Vercel project settings and redeploy

**If `hasDsn: true` but no events:**
- Check browser Network tab for Sentry API calls
- Check for ad blockers
- Verify DSN matches Sentry project

---

## PART 2: BACKEND (Railway)

### Code Audit Results

**File:** `apps/api/src/instrument.ts`

**Environment Variables Used:**
- `process.env.SENTRY_DSN` - Backend Sentry DSN
- `process.env.SENTRY_ENVIRONMENT` - Environment name (defaults to `NODE_ENV` if not set)

**Validation:**
- ✅ No hardcoded DSN values found
- ✅ No fallback DSN values found
- ✅ `Sentry.init()` only runs when DSN is present (line 23-27)
- ✅ Early return is expected behavior when DSN is missing

**Express Error Handler:**
- ✅ `setupExpressErrorHandler(app)` called AFTER all routes (line 634 in `server.ts`)
- ✅ Correct middleware order confirmed

### Required Railway Environment Variables

**Location:** Railway Dashboard → Your Project → Variables

**Required Variables:**

| Variable Name | Value | Notes |
|---------------|-------|-------|
| `SENTRY_DSN` | `<Your Backend DSN>` | Get from Sentry Dashboard → Settings → Client Keys (DSN) |
| `SENTRY_ENVIRONMENT` | `production` | Environment identifier for Sentry |

**Optional Variables:**

| Variable Name | Value | Notes |
|---------------|-------|-------|
| `SENTRY_RELEASE` | `<commit-hash>` | Optional: For release tracking (can use `RAILWAY_GIT_COMMIT_SHA` or `COMMIT_HASH`) |

**How to Find Your Backend DSN:**
1. Go to Sentry Dashboard
2. Select your **Backend/Node** project
3. Navigate to: Settings → Client Keys (DSN)
4. Copy the DSN (format: `https://...@...ingest.sentry.io/...`)

**Note:** Frontend and Backend should use **separate Sentry projects** with different DSNs.

### Backend Verification Steps

**After setting variables and deploying:**

1. **Check Railway Logs**
   Look for:
   ```
   [Sentry] Backend DSN check: {
     hasDsn: true,           ← MUST be true
     dsnLength: 89,          ← Should be > 0
     environment: "production",
     release: "...",
     allEnvKeys: ["SENTRY_DSN", "SENTRY_ENVIRONMENT", ...]
   }
   ```

2. **Trigger Health Check**
   ```bash
   curl https://your-api-domain.com/health
   ```
   Or visit: `https://your-api-domain.com/health` in browser

3. **Verify Sentry Dashboard**
   - Go to Sentry Dashboard → Issues/Events
   - Look for event: **"Sentry backend HARD verification test - health check"**
   - Event should have:
     - Platform: `node`
     - Environment: `production`
     - Tags: `verification: "hard_test"`, `source: "health_check"`

**If `hasDsn: false`:**
- ❌ `SENTRY_DSN` not set in Railway
- Fix: Add variable in Railway project variables and redeploy

**If `hasDsn: true` but no events:**
- Check Railway logs for Sentry errors
- Verify `/health` endpoint is accessible
- Verify DSN matches Sentry project

---

## PART 3: Deployment Checklist

### Vercel Setup Checklist

- [ ] Log into Vercel Dashboard
- [ ] Navigate to your project → Settings → Environment Variables
- [ ] Add `VITE_SENTRY_DSN` with your frontend DSN
- [ ] Add `VITE_SENTRY_ENVIRONMENT` with value `production`
- [ ] Select "Production" environment
- [ ] Save variables
- [ ] Trigger redeploy (or wait for next commit)

### Railway Setup Checklist

- [ ] Log into Railway Dashboard
- [ ] Navigate to your project → Variables
- [ ] Add `SENTRY_DSN` with your backend DSN
- [ ] Add `SENTRY_ENVIRONMENT` with value `production`
- [ ] Save variables
- [ ] Trigger redeploy (or wait for next commit)

### Post-Deployment Verification

- [ ] Frontend console shows `hasDsn: true`
- [ ] Backend logs show `hasDsn: true`
- [ ] "Sentry frontend HARD verification test" appears in Sentry dashboard
- [ ] "Sentry backend HARD verification test" appears in Sentry dashboard
- [ ] Sentry dashboard shows "Verified" status (may take a few minutes)

---

## PART 4: Success Confirmation

### Exact Log Lines That Confirm Success

**Frontend (Browser Console):**
```
[Sentry] Frontend DSN check: { hasDsn: true, dsnLength: 89, environment: "production", ... }
[Sentry] Hard verification event sent from App.jsx on mount
```

**Backend (Railway Logs):**
```
[Sentry] Backend DSN check: { hasDsn: true, dsnLength: 89, environment: "production", ... }
[Sentry] Hard verification event sent from /health endpoint
```

### Exact Sentry Events That Confirm Verification

**Frontend Event:**
- Message: "Sentry frontend HARD verification test - app mount"
- Platform: `javascript`
- Environment: `production`
- Tags: `verification: "hard_test"`, `source: "app_mount"`

**Backend Event:**
- Message: "Sentry backend HARD verification test - health check"
- Platform: `node`
- Environment: `production`
- Tags: `verification: "hard_test"`, `source: "health_check"`

---

## PART 5: Cleanup Reminder

**⚠️ After Sentry is verified and working:**

All code marked with `// TEMPORARY — SENTRY VERIFICATION` can be removed:

1. **Frontend:**
   - Remove DSN diagnostic logging from `apps/web/src/lib/sentry.ts`
   - Remove hard test event from `apps/web/src/App.jsx`

2. **Backend:**
   - Remove DSN diagnostic logging from `apps/api/src/instrument.ts`
   - Remove hard test event from `apps/api/src/routes/health.ts`

**See:** `SENTRY_CLEANUP_PLAN.md` for detailed removal instructions.

**DO NOT remove:**
- `Sentry.init()` calls
- `setupExpressErrorHandler()`
- ErrorBoundary components
- Any functional Sentry code

---

## Troubleshooting

### Issue: Variables set but `hasDsn: false` in logs
**Solution:** 
- Verify variable names match exactly (case-sensitive)
- Ensure variables are set for correct environment (Production)
- Redeploy after setting variables

### Issue: `hasDsn: true` but no events in Sentry
**Possible causes:**
- Ad blocker blocking Sentry (test in incognito)
- Network firewall blocking Sentry API
- DSN mismatch (wrong project)
- Sentry project settings filtering events

### Issue: Events appear but Sentry shows "Waiting to verify"
**Solution:** This is normal - Sentry may take a few minutes to update status after first events

---

## Summary

**Frontend (Vercel):**
- Set `VITE_SENTRY_DSN` and `VITE_SENTRY_ENVIRONMENT`
- Verify in browser console: `hasDsn: true`
- Check for "Sentry frontend HARD verification test" event

**Backend (Railway):**
- Set `SENTRY_DSN` and `SENTRY_ENVIRONMENT`
- Verify in Railway logs: `hasDsn: true`
- Check for "Sentry backend HARD verification test" event

**After verification:** Remove TEMPORARY code (see cleanup plan)

