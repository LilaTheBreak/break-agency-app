# Sentry Production Setup - Final Summary

**Status:** ✅ Code Audit Complete - Ready for Environment Variable Configuration

---

## Code Audit Results

### Frontend (`apps/web/src/lib/sentry.ts`)
- ✅ Uses `import.meta.env.VITE_SENTRY_DSN` (correct for Vite)
- ✅ Uses `import.meta.env.VITE_SENTRY_ENVIRONMENT` (defaults to `MODE` if not set)
- ✅ No hardcoded DSN values
- ✅ No fallback DSN values
- ✅ `Sentry.init()` exits early ONLY when DSN is missing (expected behavior)

### Backend (`apps/api/src/instrument.ts`)
- ✅ Uses `process.env.SENTRY_DSN` (correct for Node.js)
- ✅ Uses `process.env.SENTRY_ENVIRONMENT` (defaults to `NODE_ENV` if not set)
- ✅ No hardcoded DSN values
- ✅ No fallback DSN values
- ✅ `Sentry.init()` only runs when DSN is present
- ✅ `setupExpressErrorHandler(app)` registered AFTER all routes (line 634 in `server.ts`)

---

## Required Environment Variables

### Vercel (Frontend)

**Location:** Vercel Dashboard → Project → Settings → Environment Variables

| Variable | Value | Environment |
|----------|-------|-------------|
| `VITE_SENTRY_DSN` | `<Frontend DSN from Sentry>` | Production |
| `VITE_SENTRY_ENVIRONMENT` | `production` | Production |

**How to get DSN:**
1. Sentry Dashboard → Frontend/React Project
2. Settings → Client Keys (DSN)
3. Copy the DSN URL

### Railway (Backend)

**Location:** Railway Dashboard → Project → Variables

| Variable | Value |
|----------|-------|
| `SENTRY_DSN` | `<Backend DSN from Sentry>` |
| `SENTRY_ENVIRONMENT` | `production` |

**How to get DSN:**
1. Sentry Dashboard → Backend/Node Project
2. Settings → Client Keys (DSN)
3. Copy the DSN URL

**Important:** Frontend and Backend should use **separate Sentry projects** with different DSNs.

---

## Verification Steps

### Frontend Verification

**After setting variables and deploying:**

1. **Open Production App**
   - Open browser Developer Tools → Console

2. **Check Console Logs**
   ```
   [Sentry] Frontend DSN check: {
     hasDsn: true,           ← MUST be true
     dsnLength: 89,          ← Should be > 0
     environment: "production",
     ...
   }
   ```

3. **Check Sentry Dashboard**
   - Look for event: **"Sentry frontend HARD verification test - app mount"**
   - Platform: `javascript`
   - Environment: `production`

### Backend Verification

**After setting variables and deploying:**

1. **Check Railway Logs**
   ```
   [Sentry] Backend DSN check: {
     hasDsn: true,           ← MUST be true
     dsnLength: 89,          ← Should be > 0
     environment: "production",
     ...
   }
   ```

2. **Trigger Health Check**
   ```bash
   curl https://your-api-domain.com/health
   ```

3. **Check Sentry Dashboard**
   - Look for event: **"Sentry backend HARD verification test - health check"**
   - Platform: `node`
   - Environment: `production`

---

## Success Indicators

### Exact Log Lines

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

### Exact Sentry Events

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

## Redeployment

**CLI Tools Available:**
- ✅ `vercel` CLI installed at `/Users/admin/.npm-global/bin/vercel`
- ✅ `railway` CLI installed at `/Users/admin/.npm-global/bin/railway`

**Note:** Redeployment via CLI requires:
- Proper authentication (`vercel login` / `railway login`)
- Project context (linked projects)
- Appropriate permissions

**Recommended Approach:**
1. Set environment variables in dashboards (Vercel/Railway)
2. Trigger redeploy via:
   - **Vercel:** Dashboard → Deployments → Redeploy, OR push to main branch
   - **Railway:** Dashboard → Deployments → Redeploy, OR push to main branch

**Manual Redeploy Required:**
- After setting environment variables, you must trigger a redeploy
- Variables are only loaded on deployment, not on running instances

---

## Cleanup Reminder

**⚠️ After Sentry is verified and working:**

Remove all code marked with `// TEMPORARY — SENTRY VERIFICATION`:

1. **Frontend:**
   - `apps/web/src/lib/sentry.ts` - Remove DSN diagnostic logging (lines ~24-31)
   - `apps/web/src/App.jsx` - Remove hard test event (lines ~286-303) and import (line ~105)

2. **Backend:**
   - `apps/api/src/instrument.ts` - Remove DSN diagnostic logging (lines ~14-21)
   - `apps/api/src/routes/health.ts` - Remove hard test event (lines ~25-41) and import (line ~5)

**See:** `SENTRY_CLEANUP_PLAN.md` for detailed instructions.

**DO NOT remove:**
- `Sentry.init()` calls
- `setupExpressErrorHandler()`
- ErrorBoundary components
- Any functional Sentry code

---

## Files Created

1. **SENTRY_PRODUCTION_SETUP.md** - Complete setup guide with all details
2. **SENTRY_ENV_VAR_CHECKLIST.md** - Quick reference checklist
3. **SENTRY_FINAL_SETUP_SUMMARY.md** - This summary document

---

## Next Steps

1. ✅ Code audit complete
2. ⏳ Set `VITE_SENTRY_DSN` in Vercel
3. ⏳ Set `SENTRY_DSN` in Railway
4. ⏳ Redeploy both services
5. ⏳ Verify using checklists
6. ⏳ Remove TEMPORARY code after verification

---

## Summary

**Status:** Ready for production configuration

**Action Required:** Set environment variables in Vercel and Railway dashboards, then redeploy.

**Verification:** Check logs for `hasDsn: true` and Sentry dashboard for test events.

**Cleanup:** Remove TEMPORARY code after successful verification.

