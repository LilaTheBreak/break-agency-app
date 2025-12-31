# Sentry Deployment Checklist

## ✅ Pre-Deployment Verification

### Frontend (Vercel)
- [x] `Sentry.init()` exists in `apps/web/src/lib/sentry.ts`
- [x] DSN read from `import.meta.env.VITE_SENTRY_DSN`
- [x] Diagnostic logging added (TEMPORARY)
- [x] Hard test event added to App.jsx (TEMPORARY)
- [x] ErrorBoundary wraps App

### Backend (Railway)
- [x] `Sentry.init()` exists in `apps/api/src/instrument.ts`
- [x] DSN read from `process.env.SENTRY_DSN`
- [x] Diagnostic logging added (TEMPORARY)
- [x] Hard test event added to /health endpoint (TEMPORARY)
- [x] `setupExpressErrorHandler` registered after routes

---

## 🔧 Environment Variables Required

### Vercel (Frontend) - Set in Project Settings → Environment Variables

**Required:**
- `VITE_SENTRY_DSN` - Your frontend Sentry DSN (from Sentry dashboard)
- `VITE_SENTRY_ENVIRONMENT` - Environment name (e.g., `production`, `staging`)

**Optional (for release tracking):**
- `VITE_SENTRY_RELEASE` - Release version (can use `VERCEL_GIT_COMMIT_SHA`)

**Example:**
```
VITE_SENTRY_DSN=https://f7b2ac0196e3bc72103af383235c1885@o4510626406924288.ingest.de.sentry.io/4510626409480272
VITE_SENTRY_ENVIRONMENT=production
```

### Railway (Backend) - Set in Project → Variables

**Required:**
- `SENTRY_DSN` - Your backend Sentry DSN (from Sentry dashboard)
- `SENTRY_ENVIRONMENT` - Environment name (e.g., `production`, `staging`)

**Optional (for release tracking):**
- `SENTRY_RELEASE` - Release version (can use `RAILWAY_GIT_COMMIT_SHA` or `COMMIT_HASH`)

**Example:**
```
SENTRY_DSN=https://4ba8439964649efb0c2e2c37468b651f@o4510626406924288.ingest.de.sentry.io/4510626506014800
SENTRY_ENVIRONMENT=production
```

---

## 📋 Post-Deployment Verification Steps

### Step 1: Check Frontend Logs (Browser Console)

After deployment, open your production app and check the browser console for:

```
[Sentry] Frontend DSN check: {
  hasDsn: true,           ← Must be true
  dsnLength: 89,           ← Should be > 0
  environment: "production",
  release: "...",
  allEnvKeys: ["VITE_SENTRY_DSN", "VITE_SENTRY_ENVIRONMENT", ...]
}
```

**If `hasDsn: false`:**
- ❌ DSN not set in Vercel environment variables
- Fix: Add `VITE_SENTRY_DSN` in Vercel project settings

**If `hasDsn: true` but no events:**
- Check network tab for Sentry API calls
- Check for ad blockers blocking Sentry
- Check Sentry dashboard for filtered/ignored events

### Step 2: Check Backend Logs (Railway Logs)

After deployment, check Railway logs for:

```
[Sentry] Backend DSN check: {
  hasDsn: true,           ← Must be true
  dsnLength: 89,          ← Should be > 0
  environment: "production",
  release: "...",
  allEnvKeys: ["SENTRY_DSN", "SENTRY_ENVIRONMENT", ...]
}
```

**If `hasDsn: false`:**
- ❌ DSN not set in Railway environment variables
- Fix: Add `SENTRY_DSN` in Railway project variables

**If `hasDsn: true` but no events:**
- Check server logs for Sentry errors
- Verify `/health` endpoint is being called
- Check Sentry dashboard for filtered/ignored events

### Step 3: Trigger Test Events

**Backend Test:**
```bash
curl https://your-api-domain.com/health
```

**Frontend Test:**
- Simply load the production app in a browser
- The test event fires automatically on app mount

### Step 4: Verify Events in Sentry Dashboard

1. Go to your Sentry dashboard
2. Navigate to Issues or Events
3. Look for:
   - "Sentry backend HARD verification test - health check"
   - "Sentry frontend HARD verification test - app mount"
4. Check that events have:
   - Correct environment tag
   - Correct platform (javascript/node)
   - Stack traces

**If events appear:**
- ✅ Sentry is working correctly
- Proceed to cleanup (remove TEMPORARY code)

**If events don't appear:**
- Check DSN logs (Step 1 & 2)
- Verify DSNs match Sentry dashboard
- Check Sentry project settings (rate limits, filters)

---

## 🧹 Cleanup (After Verification)

Once events appear in Sentry dashboard, remove all TEMPORARY code:

### Files to Clean:

1. **apps/web/src/lib/sentry.ts**
   - Remove lines ~27-31 (DSN diagnostic logging)
   - Keep: Sentry.init() and all configuration

2. **apps/api/src/instrument.ts**
   - Remove lines ~14-21 (DSN diagnostic logging)
   - Keep: Sentry.init() and all configuration

3. **apps/api/src/routes/health.ts**
   - Remove lines ~5-6 (Sentry import)
   - Remove lines ~25-40 (hard test event in healthCheck function)
   - Keep: All health check logic

4. **apps/web/src/App.jsx**
   - Remove line ~105 (Sentry import)
   - Remove lines ~284-302 (hard test event useEffect)
   - Keep: All other App logic

### Search Pattern:
```bash
# Find all TEMPORARY code
grep -r "TEMPORARY.*SENTRY VERIFICATION" apps/
```

---

## ✅ Success Criteria

Sentry is verified when:
- [ ] Frontend logs show `hasDsn: true`
- [ ] Backend logs show `hasDsn: true`
- [ ] "Sentry backend HARD verification test" appears in Sentry dashboard
- [ ] "Sentry frontend HARD verification test" appears in Sentry dashboard
- [ ] Sentry dashboard shows "Verified" status (not "Waiting to verify")
- [ ] Real errors are captured (test with ErrorTestButton or /debug-sentry)

---

## 🚨 Troubleshooting

### Issue: DSN logs show `hasDsn: false`
**Solution:** Set environment variables in Vercel/Railway and redeploy

### Issue: DSN logs show `hasDsn: true` but no events
**Possible causes:**
1. Ad blocker blocking Sentry (test in incognito)
2. Network firewall blocking Sentry API
3. Sentry project settings filtering events
4. DSN mismatch (wrong project)

### Issue: Events appear but Sentry still shows "Waiting to verify"
**Solution:** This is normal - Sentry may take a few minutes to update status after first events

### Issue: Backend events work but frontend doesn't (or vice versa
**Solution:** Check:**
- Separate DSNs for frontend/backend projects
- Environment variables set in correct deployment platform
- Browser console for frontend errors
- Server logs for backend errors

