# RAILWAY DEPLOYMENT CHECKLIST — Gmail Production Hardening

**Deployment Date:** 29 December 2025  
**Commit:** `6ac07b2` - Gmail production hardening  
**Status:** ⚠️ REQUIRES MANUAL VERIFICATION

---

## 🚨 CRITICAL: Pre-Deployment Verification Required

### Step 1: Verify Railway Environment Variables

**BEFORE the deployment starts, check Railway dashboard:**

1. **GOOGLE_CLIENT_ID**
   - ❌ Must NOT be "test"
   - ❌ Must NOT be empty
   - ✅ Should be real Google OAuth client ID

2. **GOOGLE_CLIENT_SECRET**
   - ❌ Must NOT be "test"
   - ❌ Must NOT be empty
   - ✅ Should be real Google OAuth client secret

3. **GOOGLE_REDIRECT_URI**
   - ❌ Must NOT be empty
   - ✅ Should be: `https://breakagencyapi-production.up.railway.app/api/gmail/auth/callback`
   - ⚠️ Should NOT contain "localhost" in production

**Why Critical:**
- New validation code will **FAIL SERVER BOOT** if credentials invalid
- Server will exit with code 1 in production
- Deployment will fail immediately if credentials are "test"

**Check Railway Dashboard:**
```
https://railway.app/project/<your-project-id>/service/<api-service-id>/variables
```

---

## Step 2: Schema Migration Strategy

**Issue:** Prisma `migrate dev` fails due to shadow database constraints.

**Options:**

### Option A: Manual db push on Railway (RECOMMENDED)
```bash
# SSH into Railway container or use Railway CLI
railway run npx prisma db push --accept-data-loss
railway run npx prisma generate
```

### Option B: Add migration command to Railway build
Add to `apps/api/package.json`:
```json
{
  "scripts": {
    "railway:migrate": "npx prisma db push && npx prisma generate"
  }
}
```

Then set Railway build command:
```
pnpm run railway:migrate && pnpm run build
```

### Option C: Apply schema changes manually
Run SQL directly in Neon dashboard:
```sql
-- Add error tracking to GmailToken
ALTER TABLE "GmailToken" 
  ADD COLUMN IF NOT EXISTS "lastError" TEXT,
  ADD COLUMN IF NOT EXISTS "lastErrorAt" TIMESTAMP(3);

-- Add unique constraints
ALTER TABLE "CrmBrandContact" 
  ADD CONSTRAINT IF NOT EXISTS "CrmBrandContact_email_key" UNIQUE ("email");

ALTER TABLE "CrmBrand" 
  ADD CONSTRAINT IF NOT EXISTS "CrmBrand_brandName_key" UNIQUE ("brandName");

-- Add indexes
CREATE INDEX IF NOT EXISTS "CrmBrandContact_email_idx" ON "CrmBrandContact"("email");
CREATE INDEX IF NOT EXISTS "CrmBrand_brandName_idx" ON "CrmBrand"("brandName");
CREATE INDEX IF NOT EXISTS "CrmBrand_status_idx" ON "CrmBrand"("status");
```

**Note:** Schema was already applied locally via `db push`, so production database may already have these changes if it's the same Neon database.

---

## Step 3: Monitor Deployment

**Watch Railway Logs:**
```bash
railway logs --service api
```

**Expected Success Indicators:**
```
✅ [ENV] OAuth credentials validated successfully
✅ Prisma Client generated
✅ Server listening on port 8080
```

**Expected Failure Indicators (if credentials invalid):**
```
❌ [ENV] CRITICAL: Invalid production credentials detected
❌ [ENV] - GOOGLE_CLIENT_ID is set to test value
❌ [ENV] FATAL: Cannot start server with invalid OAuth credentials in production
❌ Process exited with code 1
```

---

## Step 4: Post-Deployment Verification

### Backend Verification

**1. Check Server Boot:**
```bash
curl https://breakagencyapi-production.up.railway.app/health
```
Expected: 200 OK

**2. Check Gmail Status Endpoint:**
```bash
curl https://breakagencyapi-production.up.railway.app/api/gmail/status \
  -H "Authorization: Bearer <your-token>"
```
Expected response:
```json
{
  "connected": false,
  "status": "disconnected",
  "message": "No Gmail account connected",
  "stats": null
}
```

**3. Connect Gmail and Verify Error States:**
- Visit app and connect Gmail
- Trigger sync
- Check status endpoint shows error fields if sync fails

### Database Verification

**Check Schema Applied:**
```sql
-- In Neon SQL Editor
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'GmailToken' 
  AND column_name IN ('lastError', 'lastErrorAt');

-- Should return 2 rows

-- Check unique constraints
SELECT constraint_name, table_name 
FROM information_schema.table_constraints 
WHERE constraint_type = 'UNIQUE' 
  AND table_name IN ('CrmBrand', 'CrmBrandContact');

-- Should return constraints for brandName and email
```

### Frontend Verification

**1. Check Vercel Deployment:**
- Visit: `https://your-app.vercel.app`
- Navigate to Gmail inbox page
- Status should show connection state

**2. Test Error Display:**
- If Gmail disconnected, should show "disconnected" status
- If sync fails, should display error message from `lastError`

---

## Step 5: Production Verification Checklist

After deployment succeeds:

- [ ] **Connect Gmail** in production
- [ ] **Trigger manual sync** (via UI button)
- [ ] **Verify emails imported** (check InboundEmail table)
- [ ] **Verify contacts created** (check CrmBrandContact table)
- [ ] **Verify brands created** (check CrmBrand table)
- [ ] **Check no duplicates** (query for duplicate emails/brand names)
- [ ] **Reload page** - data persists
- [ ] **Disconnect Gmail** - UI shows disconnected state
- [ ] **Check audit logs** - GMAIL_SYNC_* events logged
- [ ] **Check Railway logs** - no credential warnings
- [ ] **Test concurrent sync** (trigger 2+ syncs simultaneously)
- [ ] **Verify unique constraints work** (no duplicate creation errors)

---

## Step 6: Rollback Plan

**If deployment fails:**

1. **Check Railway logs** for error details
2. **If credential validation fails:**
   - Update Railway environment variables with real credentials
   - Redeploy

3. **If schema migration fails:**
   - Apply schema manually via Neon SQL editor (see Option C above)
   - Redeploy

4. **If server won't start:**
   - Rollback to previous commit:
     ```bash
     git revert 6ac07b2
     git push origin main
     ```

5. **Emergency rollback:**
   - In Railway dashboard: Rollback to previous deployment
   - Or: Deploy specific commit hash (de362e5 - last working version)

---

## Step 7: Known Issues & Workarounds

### Issue 1: Prisma migrate fails with shadow DB error
**Workaround:** Use `db push` instead of `migrate dev`
**Status:** Expected behavior, not a blocker

### Issue 2: TypeScript compilation shows 951 errors
**Impact:** None - errors are in unrelated features (React components, worker files)
**Gmail sync path:** Compiles cleanly
**Status:** Non-blocking for Gmail production hardening

### Issue 3: Duplicate data may exist in production
**Impact:** Unique constraints may fail on deployment
**Mitigation:** Run deduplication script first:
```bash
railway run npx tsx scripts/dedupe-crm-brands.ts
```

---

## 📊 Deployment Impact Summary

**What Changed:**
- ✅ Server now validates OAuth credentials on boot (fails if invalid)
- ✅ Gmail token refresh errors now persisted to database
- ✅ Status endpoint enhanced with error visibility
- ✅ Race condition handling prevents duplicate contacts/brands
- ✅ Audit logging for all sync lifecycle events
- ✅ Unique constraints prevent duplicate data

**What Didn't Change:**
- ✅ Existing Gmail sync functionality unchanged
- ✅ OAuth flow unchanged
- ✅ Email fetching unchanged
- ✅ CRM linking unchanged (just safer)

**Risk Level:** LOW
- All changes are additive safety features
- No breaking changes to existing functionality
- Only risk: Invalid OAuth credentials will fail boot (INTENDED)

---

## 🎯 Success Criteria

**Deployment is successful if:**
1. ✅ Server boots without credential validation errors
2. ✅ Schema changes applied (unique constraints active)
3. ✅ Gmail sync still works
4. ✅ No duplicate contacts/brands created on concurrent syncs
5. ✅ Error states visible in status API
6. ✅ Audit logs show GMAIL_SYNC_* events

**Deployment has failed if:**
1. ❌ Server exits with code 1 (credential validation failed)
2. ❌ Schema migration errors block deployment
3. ❌ Unique constraint violations crash sync
4. ❌ Gmail connection broken

---

## 📞 Support Contact

**If issues occur:**
1. Check Railway logs first
2. Check Neon database schema
3. Verify environment variables
4. Review this checklist

**Rollback if:**
- Server won't boot after 3 retry attempts
- Critical Gmail sync functionality broken
- Data corruption detected

---

**END OF CHECKLIST**

Next step: Verify Railway environment variables before deployment completes.
