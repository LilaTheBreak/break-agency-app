# 🚨 IMMEDIATE RECOVERY GUIDE - Data Loss Incident
**Status:** CRITICAL - EXECUTE NOW  
**Priority:** P0 - User/Talent data recovery  
**Time Window:** Recovery decisions needed within 2 hours

---

## ⏱️ CRITICAL DECISION TREE

```
DO WE HAVE A WORKING BACKUP?
│
├─ YES → NEON PITR available (backup from before 15:03 on Jan 11)
│  └─→ GO TO SECTION A: NEON POINT-IN-TIME RECOVERY
│
├─ MAYBE → Staging/Preview database might have data
│  └─→ GO TO SECTION B: STAGING DATA RECOVERY
│
└─ NO → No backups available
   └─→ GO TO SECTION C: PARTIAL REBUILD FROM RELATED TABLES
```

---

## SECTION A: NEON POINT-IN-TIME RECOVERY (RECOMMENDED)

### **Step 1: Check if Backup is Available [5 minutes]**

**Contact Neon Support or Check Dashboard:**

```bash
# Via Neon API (if you have API key)
curl https://api.neon.tech/v2/projects/<PROJECT_ID>/branches \
  -H "Authorization: Bearer $NEON_API_KEY" \
  -H "Content-Type: application/json"

# Look for: "created_at" timestamp before "2026-01-11T15:00:00Z"
```

**Alternatively, check Neon Dashboard:**
1. Go to neon.tech dashboard
2. Select project: `break-agency-app`
3. Look for branch list
4. Check if any restore points show times BEFORE 15:03 UTC on Jan 11

**If YES backups exist → Continue to Step 2**

---

### **Step 2: Create Recovery Branch from Backup [10 minutes]**

**Option A: Via Neon Dashboard (Easiest)**

1. Go to Project → Branches → Production branch
2. Click "Restore from point-in-time"
3. Select timestamp: `2026-01-11 14:55:00 UTC` (before incident)
4. Create NEW branch named: `recovery-2026-01-11-backup`
5. Wait for restore to complete (2-5 minutes)

**Option B: Via Neon CLI (if available)**

```bash
# Install Neon CLI
npm install -g neonctl

# Authenticate
neonctl auth

# List restore points
neonctl branches list

# Restore to new branch (check Neon CLI docs for exact syntax)
neonctl branch create recovery-backup --restore-from-point-in-time "2026-01-11T14:55:00Z"

# Get connection string for recovery branch
neonctl connection-string recovery-backup
```

---

### **Step 3: Verify Data in Recovery Branch [10 minutes]**

**DO NOT modify production yet - verify recovery branch first!**

```bash
# Get recovery branch connection string from Neon dashboard
export RECOVERY_DB="postgresql://user:pass@branch-pool.neon.tech/neondb"

# Check row counts in recovery branch
psql "$RECOVERY_DB" << 'SQL'
SELECT 
  'Talent' as table_name,
  COUNT(*) as row_count
FROM "Talent"
UNION ALL
SELECT 
  'Deal' as table_name,
  COUNT(*) as row_count
FROM "Deal"
UNION ALL
SELECT 
  'User' as table_name,
  COUNT(*) as row_count
FROM "User"
UNION ALL
SELECT 
  'Commission' as table_name,
  COUNT(*) as row_count
FROM "Commission"
ORDER BY table_name;
SQL

# Expected output:
# Commission | 100+ rows
# Deal | 50+ rows  
# Talent | 20+ rows
# User | multiple rows

# If all counts are > 0 → Recovery branch is good! Continue to Step 4
# If counts are still 0 → Backup also corrupted, go to SECTION B
```

---

### **Step 4: Export Data from Recovery Branch [15 minutes]**

```bash
# Step 4A: Dump entire recovery database
export RECOVERY_DB="postgresql://user:pass@recovery-branch..."
export PROD_DB="postgresql://user:pass@prod-branch..."

# Dump only the data tables we need
pg_dump "$RECOVERY_DB" \
  --table="Talent" \
  --table="Deal" \
  --table="Commission" \
  --table="Payout" \
  --table="CreatorTask" \
  --table="CreatorGoal" \
  --table="AIPromptHistory" \
  --data-only \
  > /tmp/recovered_data.sql

echo "✅ Data dump complete: /tmp/recovered_data.sql"
ls -lh /tmp/recovered_data.sql
```

---

### **Step 5: Restore Data to Production [15 minutes]**

**⚠️ CRITICAL: Disable foreign key checks during restore**

```bash
# Step 5A: Create backup of current prod (just in case)
export PROD_DB="postgresql://user:pass@prod..."
pg_dump "$PROD_DB" \
  --table="Talent" \
  --table="Deal" \
  > /tmp/prod_before_restore_$(date +%s).sql

echo "✅ Production backup saved"

# Step 5B: Restore recovered data
# OPTION 1: If tables are empty (which they are), safe to restore directly
psql "$PROD_DB" -f /tmp/recovered_data.sql

# OPTION 2: If conflict with existing records
# psql "$PROD_DB" << 'SQL'
# BEGIN;
# SET session_replication_role = 'replica'; -- Disable triggers
# TRUNCATE "Talent" CASCADE;
# COMMIT;
# SQL
# psql "$PROD_DB" -f /tmp/recovered_data.sql

echo "✅ Data restored to production"
```

---

### **Step 6: Verify Restored Data [10 minutes]**

```bash
export PROD_DB="postgresql://user:pass@prod-branch..."

psql "$PROD_DB" << 'SQL'
-- Verify counts
SELECT 'Talent' as table_name, COUNT(*) as count FROM "Talent"
UNION ALL
SELECT 'Deal', COUNT(*) FROM "Deal"
UNION ALL
SELECT 'Commission', COUNT(*) FROM "Commission";

-- Sample data
SELECT id, "displayName", "createdAt" FROM "Talent" LIMIT 5;

-- Check for any data issues
SELECT COUNT(*) as orphaned_deals FROM "Deal" d
WHERE NOT EXISTS (SELECT 1 FROM "Talent" t WHERE t.id = d."talentId");

-- If any orphaned records, log them for manual review
SELECT id, "talentId" FROM "Deal" d
WHERE NOT EXISTS (SELECT 1 FROM "Talent" t WHERE t.id = d."talentId")
LIMIT 10;
SQL

echo "✅ Verification complete"
```

---

### **Step 7: Restart Application [5 minutes]**

```bash
# Kill old app process
killall -9 node

sleep 2

# Restart with restored database
cd /Users/admin/Desktop/break-agency-app-1
npm run build -w @breakagency/api
node apps/api/dist/server.js &

sleep 5

# Verify API responds
curl http://localhost:5001/health

echo "✅ Application restarted with recovered data"
```

---

## SECTION B: STAGING DATA RECOVERY

### **If Neon backup doesn't exist, try staging:**

```bash
# Step 1: Check if staging has the data
export STAGING_DB="[staging database URL]"

psql "$STAGING_DB" << 'SQL'
SELECT COUNT(*) as talent_count FROM "Talent";
SELECT COUNT(*) as deal_count FROM "Deal";
SQL

# If counts > 0 → Continue
# If counts = 0 → Go to SECTION C

# Step 2: Dump staging data
pg_dump "$STAGING_DB" \
  --table="Talent" \
  --table="Deal" \
  --table="Commission" \
  --table="Payout" \
  --data-only \
  > /tmp/staging_dump.sql

# Step 3: Restore to production (same as Section A, Step 5B)
psql "$PROD_DB" -f /tmp/staging_dump.sql
```

---

## SECTION C: PARTIAL REBUILD FROM RELATED TABLES

### **If no backups exist, rebuild from related table data:**

```bash
export PROD_DB="postgresql://user:pass@prod..."

psql "$PROD_DB" << 'SQL'
-- Step 1: Get unique talent IDs from Deal table
-- (Deals reference talents, so we can extract talent IDs)
SELECT DISTINCT "talentId" FROM "Deal" 
WHERE "talentId" IS NOT NULL;

-- Step 2: Get talent info from Commission table
SELECT DISTINCT 
  c."talentId",
  -- Extract display name from commission notes if available
  COALESCE(c.notes, '') as metadata
FROM "Commission" c
WHERE c."talentId" IS NOT NULL;

-- Step 3: Recreate minimal Talent records
-- (This is INCOMPLETE but maintains referential integrity)
INSERT INTO "Talent" (id, "userId", name, "displayName", "createdAt", "updatedAt")
SELECT DISTINCT 
  c."talentId",
  u.id,
  c."talentId" as name,
  'Recovered-' || c."talentId" as display_name,
  NOW() as created_at,
  NOW() as updated_at
FROM "Commission" c
CROSS JOIN "User" u
WHERE c."talentId" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "Talent" WHERE id = c."talentId")
LIMIT 10; -- Start with 10, then expand

-- This preserves:
-- ✅ Deal→Talent relationships
-- ✅ Commission→Talent relationships
-- ❌ Original talent data (names, emails, metrics) - LOST
SQL
```

**Limitations of Section C:**
- Only recovers Talent IDs, not original data
- Display names will be placeholder text
- No original email addresses recovered
- No social profile data recovered

**Use Section C ONLY if sections A & B fail**

---

## TESTING & VALIDATION

### **After ANY recovery method, test these endpoints:**

```bash
# Auth check
curl -X POST http://localhost:5001/api/dev-auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@thebreakco.com"}'

# Talent list
curl -H "Authorization: Bearer [token]" \
  http://localhost:5001/api/admin/talent?search=

# Deal list
curl -H "Authorization: Bearer [token]" \
  http://localhost:5001/api/admin/deals

# Analytics (should now work)
curl -H "Authorization: Bearer [token]" \
  "http://localhost:5001/api/admin/analytics?talentId=test"

echo "✅ All endpoints verified"
```

---

## TIMELINE & DECISION POINTS

```
NOW          T+5min       T+15min        T+30min      T+45min      T+90min
│            │            │              │            │            │
├─ Assess ───┼─ Contact ───┼─ Verify  ───┼─ Export ───┼─ Restore ───┼─ Test & Deploy
│ backup     │ Neon/stage  │ recovery    │ data       │ to prod     │ to users
│ status     │ data exists │ branch OK   │ export     │ database    │
│            │             │             │ complete   │ complete    │
└────────────┴─────────────┴─────────────┴────────────┴─────────────┴──────────────
```

---

## CRITICAL CONTACTS

**Neon Support:** https://console.neon.tech  
**GitHub:** Check git history for confirmation  
**Team:** Notify all users of recovery window  

---

## PREVENTION CHECKLIST

- [ ] After recovery: Implement soft-delete pattern
- [ ] After recovery: Change `ON DELETE CASCADE` to `ON DELETE RESTRICT`
- [ ] After recovery: Add audit logging for deletes
- [ ] After recovery: Test backup restoration monthly
- [ ] After recovery: Lock production DATABASE_URL to admins only

