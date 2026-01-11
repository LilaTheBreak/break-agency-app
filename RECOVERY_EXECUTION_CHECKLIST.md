# 🚀 NEON PITR RECOVERY - EXECUTION CHECKLIST

**Status:** Ready to Execute  
**Initiated:** January 11, 2026, ~16:00 UTC  
**Estimated Duration:** 45 minutes  

---

## ✅ STEP 1: Access Neon Console (5 minutes)

**URL:** https://console.neon.tech

1. Log in to Neon account
2. Select Project: **Break Agency**
3. Select Database: **neondb**
4. Go to **Databases** section

---

## ✅ STEP 2: Initiate Point-in-Time Recovery (10 minutes)

**In Neon Console:**

1. Click on **neondb** database
2. Find **Backup & Recovery** section (or **...** menu → Restore)
3. Click **Restore from backup** or **Point-in-Time Recovery**

**Select restore point:**
- **Date:** January 11, 2026
- **Time:** 14:30 UTC (30 minutes before data loss at 15:11 UTC)
- **Confidence:** HIGH - Recovery point before deletion window

4. **Branch name:** `recovery-2026-01-11`
5. Click **Create Recovery Branch**

**⏳ Wait 2-3 minutes** for branch to be created

---

## ✅ STEP 3: Get Recovery Connection String

Once recovery branch is created:

1. Go to **Connection** section of recovery branch
2. Copy full connection string (PostgreSQL format)
3. Store temporarily: `RECOVERY_DB_URL="postgresql://..."`

**Example format:**
```
postgresql://neondb_owner:[password]@[recovery-branch-endpoint].neon.tech/neondb?sslmode=require
```

---

## ✅ STEP 4: Validate Recovered Data (10 minutes)

**Execute these commands:**

```bash
# Test connection
psql "[RECOVERY_DB_URL]" -c "SELECT COUNT(*) FROM \"Talent\";"

# Expected output: Non-zero (e.g., 25 or more)
```

**If you see 0 rows:**
- ❌ Recovery failed - try earlier time point
- 🔄 Repeat STEP 2 with time: 14:00 UTC

**If you see >0 rows:**
- ✅ Recovery successful! Proceed to STEP 5

---

## ✅ STEP 5: Run Full Validation Tests

**Copy this script and run it:**

```bash
#!/bin/bash
RECOVERY_URL="[YOUR_RECOVERY_DB_URL]"

echo "🔍 VALIDATING RECOVERED DATA"
echo "=============================="
echo ""

# Test 1: Talent count
echo "✓ Talent records:"
psql "$RECOVERY_URL" -c "SELECT COUNT(*) as count FROM \"Talent\";"

# Test 2: Deal count
echo "✓ Deal records:"
psql "$RECOVERY_URL" -c "SELECT COUNT(*) as count FROM \"Deal\";"

# Test 3: User count
echo "✓ User records:"
psql "$RECOVERY_URL" -c "SELECT COUNT(*) as count FROM \"User\";"

# Test 4: Sample talent details
echo "✓ Sample talent (first record):"
psql "$RECOVERY_URL" -c "SELECT id, name, email FROM \"Talent\" LIMIT 1;"

# Test 5: Referential integrity
echo "✓ Orphaned deals (should be 0):"
psql "$RECOVERY_URL" -c "
  SELECT COUNT(*) as orphaned_count
  FROM \"Deal\" d
  LEFT JOIN \"Talent\" t ON d.\"talentId\" = t.id
  WHERE t.id IS NULL;
"

echo ""
echo "✅ Validation complete!"
```

**Success criteria (all must be true):**
- [ ] Talent count > 5
- [ ] Deal count > 1
- [ ] User count > 2
- [ ] Sample talent returns non-null values
- [ ] Orphaned deals = 0

---

## ✅ STEP 6: Prepare for Production Swap

**CRITICAL: Before swapping to production**

1. **Notify team:** "Database recovery in progress - expect brief maintenance window"

2. **Get current production endpoint:**
   ```bash
   echo $DATABASE_URL
   ```
   Expected: `postgresql://...@ep-nameless-frog-abfzlise-pooler.eu-west-2.aws.neon.tech/neondb`

3. **Prepare rollback plan:**
   - Keep current DATABASE_URL accessible
   - Know how to revert connection string
   - Have 5 minutes available for swap

---

## ✅ STEP 7: Swap Production Database

**Option A: Neon Console Branch Swap (Recommended)**

In Neon Console:
1. Go to recovery branch (`recovery-2026-01-11`)
2. Click **Settings** or **...** menu
3. Select **Make Primary** or **Promote to Production**
4. Confirm: "Switch main branch from `ep-nameless-frog` to recovery-branch"
5. Wait 30 seconds for DNS propagation

**Verify swap succeeded:**
```bash
psql "postgresql://neondb_owner:npg_Q3wdyR1TAGpS@ep-nameless-frog-abfzlise-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require" -c "SELECT COUNT(*) FROM \"Talent\";"

# Should now show recovered data (>0 rows)
```

---

## ✅ STEP 8: Restart API Server

```bash
# Stop old server
killall -9 node 2>/dev/null || true
sleep 2

# Start new server with swapped database
cd /Users/admin/Desktop/break-agency-app-1/apps/api
npm run build && node dist/server.js &

# Wait for startup
sleep 3

# Test health
curl http://localhost:5001/health
# Expected: {"status":"ok","db":"connected",...}
```

---

## ✅ STEP 9: Full Post-Recovery Validation

**Test critical endpoints:**

```bash
# 1. Login to get auth token
TOKEN=$(curl -s -X POST http://localhost:5001/api/dev-auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@thebreakco.com"}' | jq -r '.user.id')

echo "✅ Auth token obtained"

# 2. Test talent endpoint
curl -s -b "auth_token=$TOKEN" http://localhost:5001/api/admin/talent?search=&limit=5 | jq '.talents | length'
# Expected: >0

# 3. Test deal endpoint
curl -s -b "auth_token=$TOKEN" http://localhost:5001/api/admin/deals | jq '.deals | length'
# Expected: >0

# 4. Test analytics
curl -s -b "auth_token=$TOKEN" http://localhost:5001/api/admin/analytics?talentId=test | jq '.platforms'
# Expected: array response

echo "✅ All critical endpoints operational"
```

---

## ❌ ROLLBACK (If Something Goes Wrong)

**If validation FAILS at any step:**

### Quick Rollback (Option 1 - Neon Console)
1. In Neon Console, go to previous branch
2. Click **Make Primary**
3. Confirm: Switch back to original branch
4. Wait 30 seconds
5. API will automatically reconnect

### Full Rollback (Option 2 - Manual)
```bash
# Revert DATABASE_URL to original
export DATABASE_URL="postgresql://neondb_owner:npg_Q3wdyR1TAGpS@ep-nameless-frog-abfzlise-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require"

# Restart server
killall -9 node
sleep 2
cd /Users/admin/Desktop/break-agency-app-1/apps/api
npm run build && node dist/server.js &

# Verify
sleep 3
curl http://localhost:5001/health
```

---

## 📊 Expected Timeline

| Step | Time | Duration | Status |
|------|------|----------|--------|
| 1. Access Neon | 16:00 | 5 min | ⏳ START HERE |
| 2. Create recovery branch | 16:05 | 10 min | Wait for Neon |
| 3. Get connection string | 16:15 | 2 min | Copy string |
| 4. Validate data | 16:17 | 10 min | Run validation |
| 5. Full validation tests | 16:27 | 5 min | Check results |
| 6. Prepare for swap | 16:32 | 3 min | Notify team |
| 7. Swap production | 16:35 | 5 min | **PRODUCTION CHANGE** |
| 8. Restart API | 16:40 | 5 min | New server online |
| 9. Post-recovery tests | 16:45 | 10 min | ✅ COMPLETE |

**Total: ~45 minutes**  
**Production Downtime: ~5 minutes (Step 7)**

---

## 🆘 Troubleshooting

### "Cannot find Restore option in Neon Console"
→ Your Neon plan may not support PITR  
→ **Action:** Upgrade to Neon Pro or contact support  
→ **Workaround:** Use Option 2 (Staging DB restore)

### "Recovery shows 0 rows at earlier times too"
→ PITR backups may be corrupted or unavailable  
→ **Action:** Contact Neon support immediately  
→ **Evidence:** Send them this incident report

### "Connection works but shows empty tables"
→ You may be connecting to wrong branch  
→ **Action:** Double-check connection string endpoint  
→ **Verify:** `psql "url" -c "SELECT version();"`

### "API won't start after swap"
→ DATABASE_URL may not have updated  
→ **Action:** Kill old process, set env var, restart  
→ **Verify:** `echo $DATABASE_URL | grep recovery`

---

## ✨ Success Checklist (Final)

After completing all 9 steps, verify:

- [ ] Neon recovery branch created successfully
- [ ] Talent records restored (>5 rows)
- [ ] Deal records restored (>1 row)
- [ ] All validation tests passed
- [ ] API server online and healthy
- [ ] /health endpoint returns 200
- [ ] Users can log in
- [ ] Admin dashboard loads without errors
- [ ] Sample talent data displays correctly
- [ ] No 500 errors in API logs

---

## 📞 Support Resources

**Neon Support:**
- Console: https://console.neon.tech/support
- Email: support@neon.tech
- Docs: https://neon.tech/docs/manage/backups

**Break Agency:**
- Tech Lead: [Contact]
- Database Admin: [Contact]

---

**Recovery Procedure v1.1**  
**Ready to Execute**  
**Start with STEP 1 now →**
