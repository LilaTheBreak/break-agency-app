# Brands Data Loss - Quick Checklist

**Objective:** Recover missing brands data  
**Estimated Time:** 5-30 minutes  
**Created:** January 11, 2026

---

## 📋 DIAGNOSIS CHECKLIST (5 minutes)

### Task 1: Check Browser localStorage
- [ ] Open AdminBrandsPage in browser
- [ ] Press F12 to open DevTools
- [ ] Click "Console" tab
- [ ] Paste this code:
```javascript
const b = JSON.parse(localStorage.getItem('break_admin_brands_v1')||'[]');
console.log('localStorage brands:', b.length);
if(b.length > 0) console.log('Sample:', b[0].brandName);
```
- [ ] Note the count: _____ brands in localStorage

**Result:**
- [ ] 0 brands → Go to Task 2
- [ ] > 0 brands → **Go to RECOVERY Scenario A**

---

### Task 2: Check Database
- [ ] Open terminal
- [ ] Run:
```bash
cd /Users/admin/Desktop/break-agency-app-1
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"CrmBrand\";" 2>&1
```
- [ ] Note the count: _____ brands in database

**Result:**
- [ ] 0 brands → Data probably in localStorage (Scenario A) OR deleted (Scenario D)
- [ ] > 0 brands → Data exists but not displaying (Scenario B)
- [ ] Error/no connection → Database issue (Scenario C)

---

### Task 3: Check API Response
- [ ] Open terminal
- [ ] Get your auth token from browser (DevTools → Network → Authorization header)
- [ ] Run:
```bash
TOKEN="your-auth-token-here"
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/crm-brands | head -100
```
- [ ] Does it return data?

**Result:**
- [ ] Returns `[...]` with brands → Data exists, display issue (Scenario B)
- [ ] Returns `[]` → No brands in database (Scenario A or D)
- [ ] Returns error → API issue (Scenario B)

---

## 🚀 RECOVERY CHECKLIST

### Scenario A: Data in localStorage (Most Likely)

**Prerequisites checked:**
- [ ] localStorage shows > 0 brands
- [ ] Database shows 0 brands

**Recovery Steps:**

1. [ ] Navigate to AdminBrandsPage
   - URL: `http://localhost:3000/admin/crm/brands`

2. [ ] Look for migration message
   - [ ] Banner says "You have X brands in browser"?
   - [ ] "Migrate" button visible?

3. [ ] Click "Migrate" button
   - [ ] Shows "Migrating brands..." message?
   - [ ] No errors in console?

4. [ ] Verify data imported
   - [ ] Check console: `"Initial brands loaded: X brands"`
   - [ ] Run database query again:
   ```bash
   psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"CrmBrand\";"
   ```
   - [ ] Count should now be > 0

5. [ ] Confirm UI shows brands
   - [ ] AdminBrandsPage table shows brands?
   - [ ] Can click on a brand?
   - [ ] Can search for brands?

6. [ ] Cleanup
   - [ ] Refresh page → brands still appear?
   - [ ] localStorage cleared? (console check: `localStorage.getItem('break_admin_brands_v1')` returns null?)

**✅ Success when:**
- [ ] AdminBrandsPage shows list of brands
- [ ] Can interact with brands (create, edit, delete)
- [ ] Data persists after refresh

**If failed:** Go to Recovery Scenario B

---

### Scenario B: Data Exists but Not Displaying

**Prerequisites checked:**
- [ ] Database shows > 0 brands
- [ ] AdminBrandsPage shows "No brands"

**Recovery Steps:**

1. [ ] Clear browser cache
   - [ ] Open DevTools (F12)
   - [ ] Right-click refresh button
   - [ ] Select "Empty cache and hard refresh"
   - [ ] Wait for page to load

2. [ ] Check browser console for errors
   - [ ] F12 → Console tab
   - [ ] Any red error messages?
   - [ ] Error message: _______________________
   - [ ] If error, screenshot for support

3. [ ] Check authentication
   - [ ] Are you logged in?
   - [ ] Check localStorage for auth token:
   ```javascript
   // In console
   const token = localStorage.getItem('auth-token');
   console.log('Has token:', !!token);
   ```
   - [ ] Token exists? (Y/N)

4. [ ] Test API directly
   - [ ] Get auth token from browser
   - [ ] Run in terminal:
   ```bash
   TOKEN="your-token"
   curl -s -H "Authorization: Bearer $TOKEN" \
     http://localhost:3001/api/crm-brands | jq 'length'
   ```
   - [ ] Shows number of brands? _____
   - [ ] Shows error? ________________

5. [ ] Check network requests
   - [ ] F12 → Network tab
   - [ ] Filter: "crm-brands"
   - [ ] Refresh page
   - [ ] See GET /api/crm-brands request?
   - [ ] Response status: _____
   - [ ] Response has data? (Y/N)

6. [ ] If API returns data but UI doesn't:
   - [ ] Check browser console for warnings
   - [ ] Look for lines like: `[CRM] Initial brands loaded: X brands`
   - [ ] If missing, something is wrong with initial load
   - [ ] Screenshot console and get support

**✅ Success when:**
- [ ] API returns brands: `[{...}, {...}, ...]`
- [ ] AdminBrandsPage displays brands
- [ ] No errors in console

**If failed:** Escalate to support with:
- [ ] Database count: _____
- [ ] API response count: _____
- [ ] Console errors (screenshot)
- [ ] Network tab response (screenshot)

---

### Scenario C: Database Connection Issue

**Prerequisites checked:**
- [ ] Cannot query database
- [ ] Error like "ECONNREFUSED" or "password auth failed"

**Recovery Steps:**

1. [ ] Check DATABASE_URL is set
   - [ ] Run:
   ```bash
   echo $DATABASE_URL
   ```
   - [ ] Shows URL? (Y/N)
   - [ ] If no, set it:
   ```bash
   export DATABASE_URL="postgresql://user:pass@localhost:5432/break-crm"
   ```

2. [ ] Check if PostgreSQL is running
   - [ ] Run:
   ```bash
   lsof -i :5432
   ```
   - [ ] Shows postgres process? (Y/N)
   - [ ] If no, start:
   ```bash
   brew services start postgresql
   ```
   - [ ] Wait 10 seconds

3. [ ] Test connection
   - [ ] Run:
   ```bash
   psql $DATABASE_URL -c "SELECT 1;"
   ```
   - [ ] Returns "1"? (Y/N)
   - [ ] If error, check credentials in `.env`

4. [ ] Run migrations
   - [ ] Run:
   ```bash
   cd /Users/admin/Desktop/break-agency-app-1/apps/api
   npx prisma migrate deploy
   ```
   - [ ] Completes without error? (Y/N)

5. [ ] Query brands again
   - [ ] Run:
   ```bash
   psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"CrmBrand\";"
   ```
   - [ ] Returns a number? (Y/N)

6. [ ] Restart application
   - [ ] Kill backend: Ctrl+C
   - [ ] Kill frontend: Ctrl+C
   - [ ] Restart both:
   ```bash
   npm run dev  # in apps/api
   npm run dev  # in apps/web (new terminal)
   ```
   - [ ] Both started successfully? (Y/N)

7. [ ] Test in browser
   - [ ] Navigate to AdminBrandsPage
   - [ ] Brands appear? (Y/N)

**✅ Success when:**
- [ ] `psql` commands work
- [ ] Database shows brands
- [ ] AdminBrandsPage displays brands

**If failed:** Need help from DBA or DevOps

---

### Scenario D: Data Permanently Deleted

**Prerequisites checked:**
- [ ] Database shows 0 brands
- [ ] localStorage shows 0 brands
- [ ] No recent deletion audit logs

**Recovery Steps:**

1. [ ] Check audit logs for deletions
   - [ ] Run:
   ```bash
   psql $DATABASE_URL -c "
   SELECT \"action\", \"createdAt\", \"metadata\" 
   FROM \"AuditLog\" 
   WHERE \"action\" LIKE '%BRAND%' 
   ORDER BY \"createdAt\" DESC 
   LIMIT 10;
   "
   ```
   - [ ] Shows deletion events? (Y/N)
   - [ ] If yes, screenshot them

2. [ ] Find database backups
   - [ ] Check for backup files:
   ```bash
   ls -lh /path/to/backups/  # Or wherever backups are stored
   ```
   - [ ] Backups exist? (Y/N)

3. [ ] Restore from backup (⚠️ REQUIRES DBA)
   - [ ] Get most recent backup file
   - [ ] Run restore command (needs DBA):
   ```bash
   pg_restore -d break-crm /path/to/backup.dump
   ```

4. [ ] Verify restoration
   - [ ] Query database:
   ```bash
   psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"CrmBrand\";"
   ```
   - [ ] Shows brands now? (Y/N)

5. [ ] If restored, restart application
   - [ ] Kill and restart both apps
   - [ ] Test AdminBrandsPage
   - [ ] Brands appear? (Y/N)

**✅ Success when:**
- [ ] Database restored from backup
- [ ] Brands appear in AdminBrandsPage
- [ ] All data intact

**If failed:** Escalate to DevOps/DBA with backup info

---

## 📚 DOCUMENTATION REFERENCE

**For Detailed Help:**
- Full Audit Report: `BRANDS_DATA_LOSS_AUDIT_REPORT.md`
- Recovery Guide: `BRANDS_DATA_LOSS_RECOVERY_GUIDE.md`
- Executive Summary: `BRANDS_AUDIT_EXECUTIVE_SUMMARY.md`
- This Checklist: `BRANDS_DATA_LOSS_CHECKLIST.md`

**Key Files:**
- Database: `apps/api/prisma/schema.prisma` line 436
- API: `apps/api/src/routes/crmBrands.ts`
- Frontend: `apps/web/src/pages/AdminBrandsPage.jsx`
- Migration: `apps/web/src/lib/crmMigration.js`

---

## 🆘 SUPPORT INFO

**If you get stuck:**

1. [ ] Note your scenario: A / B / C / D
2. [ ] Collect information:
   - [ ] Database brand count: _____
   - [ ] localStorage brand count: _____
   - [ ] API response (first line): ________________
   - [ ] Console error (if any): ________________
   - [ ] Timeline of when brands disappeared: _______________

3. [ ] Screenshot:
   - [ ] Console errors
   - [ ] Network requests
   - [ ] UI state

4. [ ] Provide all above when requesting help

---

## ✅ FINAL CHECKLIST

- [ ] Completed Diagnosis Checklist (5 min)
- [ ] Identified your scenario (A, B, C, or D)
- [ ] Followed recovery steps for your scenario
- [ ] Verified brands appear in AdminBrandsPage
- [ ] Data persists after page refresh
- [ ] No errors in console
- [ ] Can interact with brands (create, edit, delete)

**Status:** 
- [ ] RESOLVED ✅
- [ ] PARTIALLY RESOLVED 🟡
- [ ] UNRESOLVED 🔴 (Need to escalate)

---

**Start here:** Go to DIAGNOSIS CHECKLIST above  
**Estimated completion time:** 5-30 minutes  
**Questions?** Refer to the detailed Recovery Guide
