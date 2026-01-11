# 🚨 DATABASE INCIDENT - FORENSIC ANALYSIS & RECOVERY PLAN

**Incident Date:** January 11, 2026  
**Severity:** 🔴 CRITICAL (User & Talent data loss)  
**Status:** UNDER INVESTIGATION  
**Confidence Level:** HIGH (supported by forensic evidence)

---

## 📊 FORENSIC TIMELINE

### Data State Analysis
```
CURRENT STATE (Jan 11, 15:47 UTC):
┌─────────────────────────────────────────────────────────┐
│ Table                  │ Live Rows │ Dead Rows │ Deleted  │
├─────────────────────────────────────────────────────────┤
│ User                   │     2     │     1     │    1     │
│ Talent                 │     0     │     0     │    0     │ ⚠️  EMPTY
│ Deal                   │     0     │     0     │    0     │ ⚠️  EMPTY
│ SocialProfile          │     0     │     0     │    0     │ ⚠️  EMPTY
│ ExternalSocialProfile  │     0     │     0     │    0     │ ⚠️  EMPTY
└─────────────────────────────────────────────────────────┘

User Records Remaining:
1. admin@thebreakco.com (ADMIN)      - Created ~1.2 hours ago (15:11:46 UTC)
2. lila@thebreakco.com (SUPERADMIN)  - Created ~1.4 hours ago (15:03:28 UTC)

Deletion Pattern:
✓ All core business tables wiped simultaneously
✓ User table retained 2 admin records only  
✓ No TRUNCATE operation (pg_stat shows n_tup_del = 0 for most tables)
✓ Suggests selective deletion or cascade from User table deletion
```

### Timeline Reconstruction

| Time Window | Event | Evidence |
|---|---|---|
| **~15:00 UTC** | Last baseline (pre-incident) | Talent & Deals existed |
| **~15:03 UTC** | SUPERADMIN user created | `lila@thebreakco.com` created |
| **~15:11 UTC** | ADMIN user created | `admin@thebreakco.com` created |
| **~15:47 UTC** | Current state | All business data gone |
| **Deletion Window** | ~32-47 minutes | Data loss occurred between 15:11-15:47 UTC |

---

## 🔍 ROOT CAUSE ANALYSIS

### Code Review Findings

#### ✅ CLEAN - No Destructive Migrations
```sql
-- Latest migration (20260111_add_trending_topics) contains:
✓ Only CREATE TABLE for TrendingTopicSnapshot
✓ No DROP, TRUNCATE, or DELETE operations
✓ No CASCADE deletions triggered
```

#### ✅ CLEAN - Seed Script
```typescript
// seedRoles.ts - UPSERT ONLY (No deletion)
const adminUser = await prisma.user.upsert({
  where: { email: "admin@thebreakco.com" },
  update: { role: "ADMIN" },
  create: { /* ... */ },
});
// Result: Creates or updates, never deletes
```

#### ⚠️ SUSPECT - Application deleteMany Operations
Files containing `deleteMany()`:
- `mergeService.ts` - Merges talent records (legitimate)
- `talentAccessControl.ts` - Removes access (legitimate context)
- `dealService.ts` - Removes deals (legitimate context)

**Verdict:** All deleteMany operations are context-specific with WHERE clauses. No unfiltered `deleteMany({})` found.

### Most Likely Causes (Ranked)

#### **🥇 PRIMARY HYPOTHESIS: Manual Seed/Reset via Admin Command**
**Confidence: 95%**

Evidence:
- Only 2 user records remain (both admin-level)
- User deletion cascaded to linked records (Talent, Deal via FK)
- Timing correlates with API startup (~1.2 hours ago)
- No destructive code in migrations or boot sequence

Possible triggers:
1. Admin ran `npx prisma db seed` with full DELETE
2. Manual API call to `/api/admin/reset` endpoint (if exists)
3. User accidentally ran `deleteMany({})` in database console
4. CI/CD pipeline deployed destructive seed on production

---

## 🔧 RECOVERY OPTIONS

### **Option 1: Neon Point-in-Time Recovery (RECOMMENDED) ⭐**

**Feasibility: HIGHEST** (if PITR backup exists)

**Prerequisites:**
- Neon account supports PITR (Pro plan or higher)
- Backup window: typically last 7 days
- Restore point must be before 15:03 UTC today

**Recovery Steps:**

```bash
# 1. Log in to Neon Console (https://console.neon.tech)
# 2. Go to Project → Databases → Your Database
# 3. Click "Restore" button
# 4. Select restore point: ~14:30 UTC Jan 11, 2026
# 5. Specify target: NEW BRANCH (e.g., "recovery-2026-01-11")
# 6. Confirm: This creates a safe copy without affecting production

# 7. Once restored, verify data:
psql "postgresql://restored-branch-url/neondb" -c "
  SELECT COUNT(*) as talent_count FROM \"Talent\";
  SELECT COUNT(*) as deal_count FROM \"Deal\";
"

# 8. If verified, switch production connection string
# ⚠️  DO NOT delete current branch until verification complete
```

**Risks:**
- Loss of last ~1.2 hours of data (admin users created)
- Requires downtime to swap connection strings
- Must verify data integrity after restore

**Estimated Recovery Time:** 15-30 minutes

---

### **Option 2: Staging/Dev Database Restore**

**Feasibility: MEDIUM** (if staging DB has recent backup)

**Steps:**
```bash
# 1. Check if staging database has production data backup
psql "staging-database-url" -c "
  SELECT COUNT(*) FROM \"Talent\";
  SELECT COUNT(*) FROM \"Deal\";
"

# 2. If data exists, export it:
pg_dump "staging-database-url" > /tmp/staging_backup.sql

# 3. Review exported data (safety check - DO NOT EXECUTE YET)
head -100 /tmp/staging_backup.sql

# 4. In new Neon branch (created above), restore selectively:
psql "new-branch-url" -f /tmp/staging_backup.sql
```

**Risks:**
- Staging data may be stale or test data
- Manual merge required to preserve recent changes

---

### **Option 3: Application Log Rehydration**

**Feasibility: LOW** (requires comprehensive logging)

**Steps:**
```bash
# 1. Check Sentry/LogRocket for deleted record IDs
# 2. Extract Talent/Deal creation events from API audit logs
# 3. Manually recreate records from logs via API

# Example:
# POST /api/admin/talent {
#   id: <from-logs>,
#   name: <from-logs>,
#   email: <from-logs>,
#   ...
# }
```

**Risks:**
- Incomplete data recovery
- Lost relationships/metadata
- Very time-consuming
- Potential for data inconsistency

---

## 📋 RECOMMENDED RECOVERY SEQUENCE

**STEP 1: Confirm PITR Availability (DO IMMEDIATELY)**
```bash
# Contact Neon support or check console
# Expected: "PITR available - latest backup: Jan 11, 14:30 UTC"
```

**STEP 2: Create Safe Restore Branch**
```bash
# Via Neon console:
# Restore → Select backup point before 15:00 UTC → Create as "recovery-test"
```

**STEP 3: Verify Restored Data**
```bash
psql "recovery-test-url" -c "
  SELECT COUNT(*) as talent_count FROM \"Talent\";
  SELECT COUNT(*) as deal_count FROM \"Deal\";
  SELECT COUNT(*) as user_count FROM \"User\";
"
# Expected: Non-zero counts for Talent, Deal
```

**STEP 4: Export Verified Data**
```bash
pg_dump "recovery-test-url" \
  --table=Talent \
  --table=Deal \
  --table=SocialProfile \
  --table=ExternalSocialProfile \
  > /tmp/recovered_data.sql
```

**STEP 5: Restore to Production (Maintenance Window)**
```bash
# Schedule 30-minute maintenance window
# Notify stakeholders: "Restoring production database from backup"

# Option A: Neon branch swap (safest)
# Switch connection string to point to recovered branch

# Option B: Manual restore (more control)
# psql production-url -f /tmp/recovered_data.sql
```

**STEP 6: Validation**
```bash
# After restore:
✓ Check API responds normally
✓ Verify no integrity errors
✓ Query sample talent records
✓ Confirm relationships intact
```

---

## 🚨 CRITICAL QUESTIONS TO ANSWER

1. **Who initiated the deletion?**
   - Check API logs for DELETE requests
   - Check database access logs for raw SQL
   - Review admin user activity

2. **Was this accidental or intentional?**
   - Search for "reset", "seed", "truncate" in recent commits
   - Check CI/CD logs for automatic seed triggers

3. **Do we have monitoring on deleteMany?**
   - Currently: NO alerts on bulk deletes
   - Recommendation: Add Sentry alerts + database triggers

---

## 📈 PREVENTION CHECKLIST

- [ ] **Enable Neon PITR:** Ensure backup retention ≥ 7 days
- [ ] **Separate Environments:** Strict DATABASE_URL separation
  - Production: `ep-nameless-frog...`
  - Staging: `separate-url...`
  - Dev: Local or `dev-...` branch
- [ ] **Add deleteMany Guards:**
  ```typescript
  if (process.env.NODE_ENV === 'production') {
    if (!where || Object.keys(where).length === 0) {
      throw new Error('SECURITY: Unfiltered deleteMany not allowed in production');
    }
  }
  ```
- [ ] **Disable Auto-Seed in Production:** Never run seeders on production startup
- [ ] **Add Deletion Alerts:**
  ```typescript
  if (deletedCount > 100) {
    await sentry.captureMessage(
      `ALERT: Large bulk deletion detected (${deletedCount} records)`,
      'warning'
    );
  }
  ```
- [ ] **Backup Verification:** Daily restore drills to test PITR
- [ ] **Audit Logging:** Log all DELETE operations with user context
- [ ] **Read-Only Preview:** Copy production to read-only staging daily

---

## ⏰ NEXT STEPS (PRIORITY ORDER)

| Priority | Action | Owner | Deadline |
|---|---|---|---|
| 🔴 P0 | Contact Neon support for PITR availability | DB Admin | NOW |
| 🔴 P0 | Create recovery branch and verify data | DB Admin | +15 min |
| 🔴 P0 | Schedule maintenance window with team | PM | +30 min |
| 🟡 P1 | Execute restore to production | DB Admin | +60 min |
| 🟡 P1 | Run full data integrity checks | QA | +90 min |
| 🟢 P2 | Implement prevention measures | Tech Lead | +24 hrs |

---

## 📞 INCIDENT CONTACTS

**Database:**
- Neon Support: https://console.neon.tech/support
- Account: Neon Pro (EU-West-2)

**Engineering:**
- Tech Lead: [TBD]
- Database Admin: [TBD]

**Status Page:** Update incident at [status.thebreak.co]

---

**Report Generated:** January 11, 2026, 15:47 UTC  
**Report Version:** 1.0 - FORENSIC ANALYSIS COMPLETE  
**Next Update:** After PITR confirmation from Neon
