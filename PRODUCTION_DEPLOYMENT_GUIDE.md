# PRODUCTION DEPLOYMENT GUIDE - IMPERSONATION FEATURE

**Status:** Ready for production deployment with safety guards  
**Date:** January 9, 2026  
**Feature:** View As Talent (JWT-based impersonation)  
**Safety Level:** HIGH (kill switch + write blocking + audit logging)

---

## ⚠️ CRITICAL: SAFETY FIRST

This deployment uses THREE safety layers:

1. **Kill Switch** - Disable feature instantly without redeploying
2. **Write Blocker** - Only read operations allowed while impersonating
3. **Audit Logging** - Every request logged for monitoring

**Rule:** If anything suspicious appears → Set IMPERSONATION_ENABLED=false and restart

---

## STEP 1: Pre-Deployment Verification

Before deploying to production, run these checks:

### 1.1 Compile Check
```bash
cd /Users/admin/Desktop/break-agency-app-1
npm run build 2>&1 | tail -20
# Expected: No errors, clean exit
```

### 1.2 Environment Check
```bash
# Verify .env.production exists and IMPERSONATION_ENABLED=false
cat .env.production | grep IMPERSONATION_ENABLED
# Expected output: IMPERSONATION_ENABLED=false
```

### 1.3 Code Review Check
```bash
# Verify kill switch is in place
grep -n "IMPERSONATION_ENABLED" apps/api/src/routes/impersonate.ts
grep -n "impersonationWriteBlocker" apps/api/src/server.ts
grep -n "impersonationAuditLog" apps/api/src/server.ts
# Expected: All found with line numbers
```

---

## STEP 2: Deploy to Production

**Ensure IMPERSONATION_ENABLED=false in .env.production**

```bash
# Deploy backend (use your deployment tool)
# - Build Docker image
# - Push to registry
# - Deploy to production
# - Start health checks

# Verify deployment
curl -s https://api.thebreakco.com/api/health
# Expected: {"status":"ok","timestamp":"..."}
```

**Also deploy frontend** (standard deployment)

```bash
# Frontend deployment (Netlify/Vercel/your platform)
# No special configuration needed
# Just normal deployment process
```

### Deployment Checklist

- [ ] Build completed without errors
- [ ] Docker image pushed successfully
- [ ] Backend service started
- [ ] `curl /api/health` returns 200
- [ ] No startup errors in logs
- [ ] Frontend deployed successfully
- [ ] Website loads at https://www.thebreakco.com
- [ ] Admin can login normally

---

## STEP 3: Verify Safe State (Feature Disabled)

After deployment, verify feature is disabled:

```bash
# Try to start impersonation (should fail with 403)
curl -X POST https://api.thebreakco.com/api/impersonate/start \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"talentId":"some-talent-id"}'

# Expected response:
# {
#   "error": "Impersonation temporarily disabled",
#   "message": "The impersonation feature is currently disabled..."
# }
```

**If you get a 403 with "temporarily disabled"** → Feature is safely disabled ✅

**If you get a different error** → Something is wrong, investigate before proceeding

---

## STEP 4: Manual Testing (Production Environment)

### Test 4.1: Test as Super Admin (No Impersonation)

**Objective:** Verify admin functionality works normally

```
1. Login as super admin
   - Email: admin@thebreakco.com
   - Can see admin dashboard
   - Can see all talents/deals/contracts
2. Test normal operations
   - Create a deal
   - Modify a contract
   - View all talent data
   - Everything should work normally
```

**Expected Results:**
- ✅ Admin dashboard loads
- ✅ Can see all data
- ✅ Can create/edit/delete normally
- ✅ No "View As" button appears (feature disabled)

---

### Test 4.2: Verify Feature is Disabled

**Objective:** Confirm impersonation is blocked

```
1. Look for "View As Talent" button on talent profiles
   - Should NOT appear (feature disabled)
2. Try accessing /impersonate/start endpoint directly
   - Should return 403 "Impersonation temporarily disabled"
```

**Expected Results:**
- ✅ No "View As" UI visible
- ✅ API returns 403 when trying to impersonate
- ✅ Error message says feature is disabled

---

### Test 4.3: Monitor for Errors

**Objective:** Ensure no unexpected errors during normal usage

```
1. Monitor production logs for 30 minutes
   - Check for JavaScript errors
   - Check for API crashes
   - Check for database errors
2. Watch for:
   - 500 errors
   - Unhandled exceptions
   - Slow queries
```

**Expected Results:**
- ✅ No 500 errors
- ✅ No exceptions in logs
- ✅ Response times normal
- ✅ User reports no issues

**If errors appear:**
- → Disable deployment or roll back
- → Investigate root cause
- → Fix and redeploy

---

## STEP 5: Enable Feature in Production

**Only proceed if all tests in STEP 4 passed ✅**

### 5.1 Update Environment Variable

```bash
# Update production environment
# Method depends on your platform:

# If using Railway:
# railway variables set IMPERSONATION_ENABLED true

# If using Heroku:
# heroku config:set IMPERSONATION_ENABLED=true -a your-app

# If using manual deployment:
# Update .env.production file to IMPERSONATION_ENABLED=true
# Then restart service
```

### 5.2 Restart Backend Service ONLY

```bash
# Restart backend (use your deployment tool)
# - Do NOT redeploy frontend
# - Do NOT rebuild Docker image
# - Just restart the service with new env var

# Railway example:
railway service restart api

# Heroku example:
heroku dyno:restart -a your-app

# Manual/VM:
systemctl restart breakagency-api
# or: kill -9 <pid> && npm run start
```

### 5.3 Verify Feature is Now Enabled

```bash
# Check that feature is enabled
curl https://api.thebreakco.com/api/impersonate/status
# Should return something like:
# { "enabled": true, "readOnlyMode": true }

# OR try to start impersonation (should succeed)
curl -X POST https://api.thebreakco.com/api/impersonate/start \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"talentId":"a-valid-talent-id"}'

# Expected: 200 OK with JWT token in response
```

---

## STEP 6: Manual Production Testing (Feature Enabled)

### Test 6.1: Start Impersonation

```
1. Login as super admin
2. Go to talent profile
3. Click "View As Talent" button
4. Expected:
   - ✅ Impersonation banner appears at top
   - ✅ Banner shows: "Viewing as [Talent Name]"
   - ✅ Admin UI is hidden/disabled
   - ✅ You're redirected to talent dashboard
```

### Test 6.2: Verify Data is Scoped

While impersonating Talent A:

```
1. View deals
   - Should see ONLY Talent A's deals
   - Should NOT see other talents' deals
   - Snapshot should only show Talent A's metrics

2. View contracts
   - Should see ONLY Talent A's contracts
   - Cannot see other talents' contracts

3. View payments
   - Should see ONLY Talent A's payments
   - Cannot see other talents' payments

4. View profile
   - Shows Talent A's profile
   - Cannot see other talents' profiles

Expected: Any attempt to access other talent's data returns 403
```

### Test 6.3: Verify Write Blocking

While impersonating:

```
1. Try to CREATE a deal
   - POST /api/crm-deals
   - Should return 403 "Write operations disabled"

2. Try to EDIT a contract
   - PUT /api/crm-contracts/id
   - Should return 403 "Write operations disabled"

3. Try to DELETE a payment
   - DELETE /api/payments/id
   - Should return 403 "Write operations disabled"

4. Try to READ a deal
   - GET /api/crm-deals/id
   - Should return 200 OK ✅

Expected: All writes blocked, all reads allowed
```

### Test 6.4: Test Exit/Restore

```
1. Click "Exit Impersonation" button
2. Expected:
   - ✅ Banner disappears
   - ✅ Redirected to admin dashboard
   - ✅ Admin UI visible again
   - ✅ Can see all talents' data again
   - ✅ Can make write operations again
```

### Test 6.5: Monitor Audit Logs

While impersonating:

```
1. Check production logs
   - Should see [IMPERSONATION] log entries
   - Should show: adminId, talentId, route, method
   - Example:
     [IMPERSONATION] {
       "timestamp": "2026-01-09T12:34:56Z",
       "adminId": "admin-123",
       "talentId": "talent-456",
       "route": "/api/crm-deals",
       "method": "GET"
     }
```

---

## STEP 7: Immediate Rollback (If Issues)

If ANY of the following occur, immediately disable the feature:

### 🔴 Issue: Cross-Talent Data Visible

```
Symptom: While impersonating Talent A, you can see Talent B's deals/contracts
Action: IMMEDIATELY disable feature

curl https://api.thebreakco.com/api/health
# Should return current data

# Disable:
# Set IMPERSONATION_ENABLED=false
# Restart backend

# Verify disabled:
curl -X POST https://api.thebreakco.com/api/impersonate/start \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"talentId":"talent-id"}'
# Should return 403 "temporarily disabled"

# Log incident report
```

### 🔴 Issue: Write Operation Succeeds While Impersonating

```
Symptom: POST/PUT/DELETE returns 200 OK instead of 403

Action: IMMEDIATELY disable feature
(Same rollback as above)

Log incident:
- What operation?
- What data was changed?
- What talent's data was affected?
- Potential impact?
```

### 🔴 Issue: Admin Cannot Access Own Data After Exit

```
Symptom: After clicking "Exit", admin sees "403 Forbidden" or incomplete data

Action: Disable feature and investigate

Check:
- Is session properly restored?
- Did JWT clear correctly?
- Is backend session manager working?
```

### 🔴 Issue: Multiple Simultaneous Impersonations

```
Symptom: Two admins can impersonate at same time, causing data conflicts

Action: This shouldn't happen with JWT, but if it does:
- Disable feature
- Investigate JWT claims
- Check token validation
```

---

## STEP 8: Success Confirmation

After all tests pass for 30+ minutes, create status report:

```markdown
# DEPLOYMENT SUCCESS REPORT

**Date:** January 9, 2026
**Time:** [deployment completion time]
**Feature:** View As Talent Impersonation

## Pre-Deployment
- [x] Code compiles without errors
- [x] All imports resolved
- [x] Kill switch in place (IMPERSONATION_ENABLED=false)
- [x] Write blockers active
- [x] Audit logging functional

## Deployment
- [x] Backend deployed successfully
- [x] Frontend deployed successfully
- [x] /api/health returns 200
- [x] No startup errors
- [x] Feature disabled at deployment

## Initial Testing (Feature Disabled)
- [x] Admin dashboard works normally
- [x] Cannot access /impersonate endpoints (403)
- [x] No "View As" button visible
- [x] All admin operations work

## Monitoring (30 minutes)
- [x] No 500 errors observed
- [x] No exceptions in logs
- [x] Response times normal
- [x] Users report no issues

## Feature Enabled
- [x] Set IMPERSONATION_ENABLED=true
- [x] Restarted backend only
- [x] Feature now accessible

## Production Testing (Feature Enabled)
- [x] Can start impersonation (banner appears)
- [x] Data properly scoped (only see impersonated user's data)
- [x] Writes blocked (403 on POST/PUT/DELETE)
- [x] Reads allowed (200 on GET)
- [x] Exit works (admin restored, UI restored)
- [x] Audit logs recording requests properly

## Risk Assessment
- [x] No data leaks observed
- [x] No accidental mutations detected
- [x] Admin operations secure
- [x] JWT validation working
- [x] Session management working

## Recommendation
✅ **FEATURE SAFE FOR PRODUCTION**

Continue monitoring for 7 days for any issues.
If any incidents occur, disable immediately via IMPERSONATION_ENABLED=false.
```

---

## Emergency Procedures

### Quick Disable (No Data Loss)

If you need to instantly disable the feature:

```bash
# Set environment variable to false
export IMPERSONATION_ENABLED=false

# Restart backend
# (exact command depends on your deployment platform)

# Verify disabled
curl -X POST https://api.thebreakco.com/api/impersonate/start \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"talentId":"any-talent"}'

# Should see: "Impersonation temporarily disabled"
```

### Full Rollback (If Needed)

```bash
# Use your deployment platform to rollback to previous version
# Example for Railway:
railway rollback

# Example for Heroku:
heroku releases:rollback

# Then verify:
curl https://api.thebreakco.com/api/health
```

---

## Monitoring Checklist (Daily, First Week)

- [ ] Check logs for [IMPERSONATION] entries
- [ ] Monitor for 403 errors
- [ ] Monitor for unexpected route access
- [ ] Check admin login/logout working
- [ ] Verify audit logs are captured
- [ ] Check database for unexpected changes
- [ ] Review error rates

---

## Success Criteria

Feature is successfully deployed when:

✅ All tests pass without cross-tenant data access  
✅ All writes properly blocked  
✅ Admin can exit impersonation cleanly  
✅ Audit logs show proper request details  
✅ No 500 errors related to impersonation  
✅ Feature can be disabled instantly via IMPERSONATION_ENABLED=false  
✅ Zero incidents in first 24 hours  
✅ User feedback positive  

---

**Contact:** Engineering team  
**Escalation:** If critical issues arise, disable feature immediately  
**Review Date:** January 16, 2026 (1 week after deployment)
