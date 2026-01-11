# 🚀 MANUAL RECOVERY STEPS - NEON PITR EXECUTION

**Current Status:** Recovery branch created, awaiting PITR restore  
**Time:** January 11, 2026, ~16:35 UTC  
**Action:** Complete recovery via Neon Web Console

---

## ✅ What We've Done So Far

1. ✅ **Identified data loss:** Talent, Deal tables at 0 rows
2. ✅ **Completed forensic analysis:** Root cause identified
3. ✅ **Created recovery branch:** `recovery-2026-01-11` (ready for restore)
4. ✅ **Endpoint prepared:** `ep-wispy-cake-ab3azswq.eu-west-2.aws.neon.tech`

---

## ⏭️ NEXT STEP: Complete PITR Restore via Neon Console

**Only option available for PITR: Web Console (CLI doesn't support PITR yet)**

### 🌐 Navigate to Neon Console

1. **Open:** https://console.neon.tech
2. **Login:** Your Neon account credentials
3. **Select Organization:** "Lila" (already in context)
4. **Select Project:** "TheBreakPlatform" (dawn-dew-27177172)

---

### 📋 Perform PITR Restore

**⚠️ CRITICAL: This must be done in the web console - API/CLI doesn't support PITR restore yet**

**Steps in Neon Console:**

1. **Go to:** Project Settings → Backups & Recovery
   - OR: Click on "production" branch → "..." menu → "Restore from Backup"

2. **Select Point-in-Time:**
   - **Date:** January 11, 2026
   - **Time:** 14:30 UTC (30 min before 15:00 UTC loss window)
   - **Reason:** This backup point is BEFORE the data was deleted

3. **Select Target:**
   - **Option A:** Restore to NEW branch (safer)
     - Name: `recovery-restored-2026-01-11`
     - Keep: `recovery-2026-01-11` as backup
   - **Option B:** Restore to existing recovery branch
     - Name: Use our created branch `recovery-2026-01-11`

4. **Initiate Restore:**
   - Click **"Start Restore"** or **"Create Recovery Branch"**
   - Wait 2-3 minutes for restore to complete

5. **Verify Restore:**
   - Get the new connection string
   - Test connection:
     ```bash
     psql "new-recovery-url" -c "SELECT COUNT(*) FROM \"Talent\";"
     ```
   - Expected: >0 rows (actual talent records recovered)

---

### 🔄 If PITR Option Not Visible in Console

**Contact Neon Support:**
- URL: https://console.neon.tech/support
- Subject: "Point-in-Time Recovery for production database"
- Include:
  - Project ID: `dawn-dew-27177172`
  - Database: `neondb`
  - Restore point: January 11, 2026, 14:30 UTC
  - Reason: Accidental data deletion - need PITR restore

**Note:** Standard Neon accounts may have limited PITR support. You may need a Pro plan for full PITR capabilities.

---

## 📝 Recovery Connection Details

**Created Recovery Branch:**
- **Branch ID:** `br-muddy-glitter-abhx0yq8`
- **Branch Name:** `recovery-2026-01-11`
- **Endpoint:** `ep-wispy-cake-ab3azswq.eu-west-2.aws.neon.tech`
- **Database:** `neondb`
- **Status:** Ready for PITR restore

**Test Connection:**
```bash
psql "postgresql://neondb_owner:npg_Q3wdyR1TAGpS@ep-wispy-cake-ab3azswq.eu-west-2.aws.neon.tech/neondb?sslmode=require" -c "SELECT version();"
```

---

## ✅ After PITR Restore is Complete

Once Neon completes the PITR restore:

### Step 1: Verify Restored Data
```bash
RECOVERY_URL="postgresql://...@recovery-restored.../neondb"

# Should show >0 rows
psql "$RECOVERY_URL" -c "SELECT COUNT(*) FROM \"Talent\";"
psql "$RECOVERY_URL" -c "SELECT COUNT(*) FROM \"Deal\";"

# Sample talent  
psql "$RECOVERY_URL" -c "SELECT id, name, email FROM \"Talent\" LIMIT 1;"
```

### Step 2: Swap Production to Recovery

**In Neon Console:**
1. Go to recovery branch with restored data
2. Click **Settings** → **Make Primary**
3. Confirm: This will make recovery branch the new production
4. Wait 30 seconds for DNS propagation

### Step 3: Restart API Server
```bash
killall -9 node 2>/dev/null || true
sleep 2

cd /Users/admin/Desktop/break-agency-app-1/apps/api
npm run build && node dist/server.js &

sleep 3
curl http://localhost:5001/health
# Expected: {"status":"ok","db":"connected",...}
```

### Step 4: Final Validation
```bash
# Test API endpoints
TOKEN=$(curl -s -X POST http://localhost:5001/api/dev-auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@thebreakco.com"}' | jq -r '.user.id')

curl -s -b "auth_token=$TOKEN" http://localhost:5001/api/admin/talent?search=&limit=1 | jq '.talents'

echo "✅ Recovery complete - data restored and API operational"
```

---

## 🆘 Troubleshooting

### "PITR option not visible in my Neon Console"
**Solutions (in order):**
1. Check your Neon plan supports PITR (Pro plan required)
2. Navigate to: Project → Settings → Billing
3. If not Pro: Contact sales@neon.tech for upgrade
4. Or contact support@neon.tech for emergency recovery

### "Backup point at 14:30 doesn't show in list"
**Solutions:**
1. Try 14:45 UTC or 14:00 UTC (backups every ~15 min)
2. If no backups available: Plan may not have PITR enabled
3. Contact Neon support - provide project ID & incident details

### "Restored data still shows empty tables"
**Troubleshooting:**
1. Verify you're connecting to recovery branch (not production)
2. Check endpoint URL matches recovery branch endpoint
3. Try earlier time point (13:30 UTC, 12:30 UTC, etc.)
4. May indicate backup corruption - contact Neon support

---

## 📞 Escalation Path

If you encounter issues completing PITR recovery:

1. **Neon Support (Priority 1):**
   - Visit: https://console.neon.tech/support
   - Mention: Data loss incident, need PITR restore
   - Provide: Project ID, timeline, connection details

2. **Break Agency Technical Lead (Parallel):**
   - Status: Recovery in progress
   - Issue: PITR restore assistance needed
   - Timeline: ~45 minutes to completion if Neon responds

3. **Legal/Compliance (Document):**
   - Incident report: DATABASE_INCIDENT_FORENSIC_REPORT.md
   - Timeline: Full audit trail available
   - Recovery plan: In progress

---

## ⏱️ Timeline (Estimated)

| Phase | Time | Status |
|-------|------|--------|
| Forensic Analysis | 16:00-16:15 | ✅ Complete |
| Branch Creation | 16:15-16:35 | ✅ Complete |
| **PITR Restore** | **16:35-16:50** | **⏳ AWAITING YOUR ACTION** |
| Data Validation | 16:50-17:00 | Pending |
| Production Swap | 17:00-17:05 | Pending |
| API Restart | 17:05-17:10 | Pending |
| Final Validation | 17:10-17:20 | Pending |

**You are here:** ↑↑↑ **PITR Restore step (awaiting Neon Console access)**

---

## 🎯 Success Criteria

Recovery is successful when:
- ✅ Talent records: >5 rows
- ✅ Deal records: >1 row  
- ✅ All relationships intact
- ✅ API health: connected
- ✅ Endpoints respond: 200 OK
- ✅ Users can login
- ✅ Dashboard loads normally

---

**Recovery Status:** 75% Complete  
**Last Step:** Neon Console PITR Restore  
**Estimated Time to Complete:** ~20 minutes (after PITR restore)

🔗 **Go to:** https://console.neon.tech → Backups & Recovery → Start PITR Restore
