# 🔧 EMERGENCY RECOVERY PROCEDURE

**Status:** Ready to Execute  
**Estimated Duration:** 30-45 minutes  
**Risk Level:** MEDIUM (requires maintenance window)

---

## ✅ PREREQUISITES CHECKLIST

Before executing recovery, confirm:

- [ ] Neon PITR support confirmed available
- [ ] Recovery point identified (before 15:00 UTC Jan 11)
- [ ] Stakeholders notified of maintenance window
- [ ] Current database backed up (screenshots taken)
- [ ] Rollback plan documented
- [ ] Team standing by

---

## 🚀 RECOVERY EXECUTION (STEP-BY-STEP)

### STEP 1: Verify PITR Availability (5 minutes)

**Execute:**
```bash
# Log into https://console.neon.tech
# Navigate to: Project → Settings → Billing/PITR
# Confirm: "PITR backups enabled - retention: 7 days"

# Alternatively, contact Neon support
curl -X GET https://api.neon.tech/api/v1/projects \
  -H "Authorization: Bearer $NEON_API_KEY" | jq '.projects[0].backup_settings'
```

**Expected Output:**
```json
{
  "pitr_enabled": true,
  "retention_days": 7,
  "latest_backup": "2026-01-11T14:30:00Z"
}
```

**If PITR unavailable:**
- Contact Neon Premium Support immediately
- Proceed to Option 2: Staging DB restore
- Document timeline for legal/compliance team

---

### STEP 2: Create Recovery Branch (10 minutes)

**In Neon Console:**

1. Click **Projects** → Your Project
2. Click **Databases** → `neondb`
3. Click **...** (three dots) → **Restore from backup**
4. Select restore point:
   - Date: January 11, 2026
   - Time: 14:30 UTC (30 min before data loss)
5. Name new branch: `recovery-2026-01-11-backup`
6. Click **Create Branch**

**Wait for branch creation:** ~2-3 minutes

**Verify branch created:**
```bash
psql "postgresql://recovered-connection-string/neondb" -c "
  SELECT COUNT(*) as talent_count FROM \"Talent\";
  SELECT COUNT(*) as deal_count FROM \"Deal\";
  SELECT COUNT(*) as user_count FROM \"User\";
"
```

**Expected Output:**
```
talent_count | deal_count | user_count
─────────────┼────────────┼───────────
    25 (or more) |    10 (or more) |    5+
```

---

### STEP 3: Validate Recovered Data (10 minutes)

**Safety Checks:**

```bash
#!/bin/bash
RECOVERY_URL="postgresql://neondb_owner:...@ep-recovery-branch.../neondb"

echo "🔍 VALIDATION CHECKS"
echo "===================="

# Check 1: Talent integrity
echo "✓ Checking Talent table..."
psql "$RECOVERY_URL" -c "
  SELECT COUNT(*) as total, 
         COUNT(DISTINCT \"userId\") as unique_users 
  FROM \"Talent\";
"

# Check 2: Deal integrity  
echo "✓ Checking Deal table..."
psql "$RECOVERY_URL" -c "
  SELECT COUNT(*) as total,
         COUNT(DISTINCT \"talentId\") as talent_references,
         COUNT(DISTINCT \"brandId\") as brand_references
  FROM \"Deal\";
"

# Check 3: User integrity
echo "✓ Checking User table..."
psql "$RECOVERY_URL" -c "
  SELECT COUNT(*) as total,
         COUNT(role) as users_with_roles
  FROM \"User\";
"

# Check 4: Referential integrity (sample)
echo "✓ Checking referential integrity..."
psql "$RECOVERY_URL" -c "
  SELECT COUNT(d.id) as orphaned_deals
  FROM \"Deal\" d
  LEFT JOIN \"Talent\" t ON d.\"talentId\" = t.id
  LEFT JOIN \"Brand\" b ON d.\"brandId\" = b.id
  WHERE t.id IS NULL OR b.id IS NULL;
"

echo "✓ All checks completed"
```

**If validation FAILS:**
- Do NOT proceed to production swap
- Investigate backup integrity
- Contact Neon support
- Try earlier backup point

**If validation PASSES:**
- Proceed to Step 4

---

### STEP 4: Announce Maintenance Window (5 minutes)

**Notify stakeholders:**
```
🔴 MAINTENANCE ALERT

Break Agency Platform will be offline for 15 minutes starting at [TIME] for critical database recovery.

Impact: API unavailable, no logins possible during maintenance
Duration: ~15 minutes
Expected Resume: [TIME + 15 min]

We are restoring customer data from a secure backup.
No data loss expected for restored time period.

Thank you for your patience.
```

---

### STEP 5: Execute Production Swap (10 minutes)

**⚠️  CRITICAL: This operation affects all users**

**Option A: Neon Branch Swap (RECOMMENDED - Safest)**

```bash
# 1. In Neon console, go to recovered branch settings
# 2. Click "Make primary" or "Promote to production"
# 3. Confirm: "Switch main branch from ep-nameless-frog to recovery-branch"
# 4. Wait for DNS propagation (~30 seconds)

# Verify production now points to recovery:
psql "postgresql://neondb_owner:...@ep-nameless-frog.../neondb" -c "
  SELECT COUNT(*) FROM \"Talent\";
"
# Expected: Non-zero count
```

**Option B: Environment Variable Swap (Requires Deploy)**

```bash
# 1. Update production DATABASE_URL
export DATABASE_URL="postgresql://neondb_owner:...@ep-recovery-2026-01-11.../neondb"

# 2. Verify API server can connect
npm run build && node dist/server.js

# 3. Test endpoints
curl http://localhost:5001/api/admin/talent | jq '.length'
# Expected: Non-zero

# 4. Deploy to production
npm run deploy
```

---

### STEP 6: Full Validation Post-Recovery (5 minutes)

**Critical checks after swap:**

```bash
#!/bin/bash
API_URL="https://api.thebreak.co"
AUTH_TOKEN=$(curl -s -X POST "$API_URL/api/dev-auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@thebreakco.com"}' | jq -r '.token')

echo "🔍 POST-RECOVERY VALIDATION"
echo "============================"

# Check 1: API responds
echo "✓ API Health..."
curl -s "$API_URL/health" | jq '.status'

# Check 2: Talent accessible
echo "✓ Talent endpoint..."
curl -s -H "Authorization: Bearer $AUTH_TOKEN" \
  "$API_URL/api/admin/talent?search=&limit=10" | jq '.talents | length'

# Check 3: Deal accessible
echo "✓ Deal endpoint..."
curl -s -H "Authorization: Bearer $AUTH_TOKEN" \
  "$API_URL/api/admin/deals" | jq '.deals | length'

# Check 4: Sample talent integrity
echo "✓ Sample talent details..."
TALENT_ID=$(curl -s -H "Authorization: Bearer $AUTH_TOKEN" \
  "$API_URL/api/admin/talent?search=&limit=1" | jq -r '.talents[0].id')
curl -s -H "Authorization: Bearer $AUTH_TOKEN" \
  "$API_URL/api/admin/talent/$TALENT_ID" | jq '.id, .name, .email'

echo "✓ All post-recovery checks passed"
```

---

### STEP 7: Rollback Plan (Keep Available)

**If validation FAILS after swap:**

```bash
# IMMEDIATE: Revert to previous branch
# In Neon console: Select previous branch → Make primary

# OR: Restore environment variable to old DATABASE_URL
export DATABASE_URL="postgresql://neondb_owner:...@ep-nameless-frog.../neondb"
npm run deploy

# Wait for API to reconnect to original database
sleep 10

# Verify rollback
curl http://localhost:5001/health
# Expected: Connected to original database
```

---

## 🎯 SUCCESS CRITERIA

Recovery is successful when:

✅ Talent table has >5 records  
✅ Deal table has >1 record  
✅ User table has >2 records  
✅ API endpoints respond 200  
✅ Web app loads without errors  
✅ Users can log in normally  
✅ Admin dashboards display data  
✅ No referential integrity errors  
✅ Audit logs resume recording  

---

## 📊 RECOVERY TIMELINE

```
Start Recovery: 15:50 UTC
├─ Step 1: Verify PITR (5 min)  → 15:55 UTC
├─ Step 2: Create branch (10 min) → 16:05 UTC
├─ Step 3: Validate (10 min) → 16:15 UTC
├─ Step 4: Announce (5 min) → 16:20 UTC
├─ Step 5: Swap (10 min) → 16:30 UTC [MAINTENANCE WINDOW]
├─ Step 6: Post-validation (5 min) → 16:35 UTC
└─ System Online: 16:35 UTC

Total Duration: ~45 minutes
Downtime: ~15 minutes (Steps 4-5)
```

---

## 🚨 TROUBLESHOOTING

### "PITR backup not available"
→ **Action:** Contact Neon Premium Support immediately  
→ **Workaround:** Restore from staging database (slower, manual merge)  
→ **Timeline:** +30 minutes

### "Recovery branch creation failed"
→ **Action:** Check Neon account storage limits  
→ **Workaround:** Delete old test branches first  
→ **Escalate:** Neon support team

### "Data validation shows orphaned records"
→ **Action:** Do NOT swap to production  
→ **Investigate:** Which foreign keys are broken?  
→ **Decision:** Manually fix or try earlier backup point

### "API can't connect after swap"
→ **Action:** Verify DATABASE_URL updated correctly  
→ **Check:** `echo $DATABASE_URL` shows recovery branch  
→ **Rollback:** Revert to previous branch immediately  
→ **Contact:** Database admin + Neon support

---

## 📝 DOCUMENTATION TO UPDATE

After recovery completes:

- [ ] Update incident timeline in GitHub
- [ ] Document root cause findings
- [ ] Create post-mortem ticket
- [ ] Review prevention measures
- [ ] Update runbooks
- [ ] Notify security team
- [ ] Archive forensic reports

---

**Recovery Plan v1.0**  
**Last Updated:** January 11, 2026, 15:50 UTC  
**Owner:** Database Admin  
**Status:** READY TO EXECUTE
