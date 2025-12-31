# Sentry Environment Variables Checklist

**Quick Reference for Production Setup**

---

## ✅ Vercel (Frontend) - Environment Variables

**Location:** Vercel Dashboard → Project → Settings → Environment Variables

| Variable | Value | Required | Environment |
|----------|-------|----------|-------------|
| `VITE_SENTRY_DSN` | `<Frontend DSN from Sentry>` | ✅ Yes | Production |
| `VITE_SENTRY_ENVIRONMENT` | `production` | ✅ Yes | Production |
| `VITE_SENTRY_RELEASE` | `<optional>` | ❌ No | Production |

**Where to find Frontend DSN:**
1. Sentry Dashboard → Frontend/React Project
2. Settings → Client Keys (DSN)
3. Copy the DSN URL

**Verification:**
- Browser console shows: `[Sentry] Frontend DSN check: { hasDsn: true, ... }`
- Sentry dashboard receives: "Sentry frontend HARD verification test - app mount"

---

## ✅ Railway (Backend) - Environment Variables

**Location:** Railway Dashboard → Project → Variables

| Variable | Value | Required | Notes |
|----------|-------|----------|-------|
| `SENTRY_DSN` | `<Backend DSN from Sentry>` | ✅ Yes | Separate from frontend DSN |
| `SENTRY_ENVIRONMENT` | `production` | ✅ Yes | Environment identifier |
| `SENTRY_RELEASE` | `<optional>` | ❌ No | For release tracking |

**Where to find Backend DSN:**
1. Sentry Dashboard → Backend/Node Project
2. Settings → Client Keys (DSN)
3. Copy the DSN URL

**Verification:**
- Railway logs show: `[Sentry] Backend DSN check: { hasDsn: true, ... }`
- Sentry dashboard receives: "Sentry backend HARD verification test - health check"

---

## 📋 Setup Steps

### Step 1: Vercel Setup
- [ ] Open Vercel Dashboard
- [ ] Navigate to project settings
- [ ] Go to Environment Variables
- [ ] Add `VITE_SENTRY_DSN` = `<your frontend DSN>`
- [ ] Add `VITE_SENTRY_ENVIRONMENT` = `production`
- [ ] Select "Production" environment
- [ ] Save and redeploy

### Step 2: Railway Setup
- [ ] Open Railway Dashboard
- [ ] Navigate to project
- [ ] Go to Variables tab
- [ ] Add `SENTRY_DSN` = `<your backend DSN>`
- [ ] Add `SENTRY_ENVIRONMENT` = `production`
- [ ] Save and redeploy

### Step 3: Verify
- [ ] Check frontend console for `hasDsn: true`
- [ ] Check Railway logs for `hasDsn: true`
- [ ] Verify events in Sentry dashboard
- [ ] Confirm Sentry status shows "Verified"

---

## 🚨 Common Mistakes

❌ **Wrong variable name:**
- Frontend: Must be `VITE_SENTRY_DSN` (not `SENTRY_DSN`)
- Backend: Must be `SENTRY_DSN` (not `VITE_SENTRY_DSN`)

❌ **Wrong environment:**
- Variables set for "Development" but app runs in "Production"
- Fix: Set variables for "Production" environment

❌ **Using same DSN for both:**
- Frontend and backend should use separate Sentry projects with different DSNs
- Fix: Create separate projects in Sentry

❌ **Not redeploying:**
- Variables added but app not redeployed
- Fix: Trigger redeploy after setting variables

---

## ✅ Success Indicators

**Frontend:**
- ✅ Console: `hasDsn: true`
- ✅ Sentry: "Sentry frontend HARD verification test" event appears

**Backend:**
- ✅ Logs: `hasDsn: true`
- ✅ Sentry: "Sentry backend HARD verification test" event appears

**Both:**
- ✅ Sentry dashboard shows "Verified" status
- ✅ Real errors are captured (test with ErrorTestButton or /debug-sentry)

