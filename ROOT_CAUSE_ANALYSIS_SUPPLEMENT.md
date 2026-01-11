# ROOT CAUSE ANALYSIS SUPPLEMENT

## Code Audit Findings

### **Most Likely Cause: User Deletion Cascading**

**Evidence:**
1. The Talent table has:
   ```sql
   FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
   ```

2. Only 2 User records exist:
   - `lila@thebreakco.com` (SUPERADMIN)
   - `admin@thebreakco.com` (ADMIN)

3. **ALL Talent records are gone (0 rows)** - This suggests:
   - The User records that originally owned the Talents have been deleted
   - When User records were deleted, PostgreSQL's CASCADE constraint automatically deleted all associated Talents
   - The 2 remaining users were the last to be created, so their Talents still exist (if any)

### **Mechanism of Data Loss**

```
Timeline:
1. System boots up
2. User deletion command executed (unclear source)
3. PostgreSQL constraint triggers: ON DELETE CASCADE
4. All Talent records with userId → DELETED
5. Each deleted Talent triggers ON DELETE CASCADE on dependent tables
6. Result: Talent→Deal→CommissionHistory→Payout cascade deletion
```

### **Why mergeService is NOT the cause:**

The mergeService.ts file contains deleteMany() calls, BUT they are:
- Protected by validation (lines 36-76)
- Only delete records explicitly passed in `mergeIds`
- Would require an API call to `/api/admin/merge` endpoint

**No evidence that merge endpoint was called** - no User table changes suggesting merge activity.

---

## Where the Deletion Likely Occurred

### **Option 1: Database Event (Most Probable)**

A direct SQL DELETE or database manipulation:
```sql
-- This would trigger CASCADE
DELETE FROM "User" WHERE id = 'some-user-id';

-- Or if empty WHERE clause:
DELETE FROM "User";  -- Would NOT delete if it deleted both admins too
```

**Against this theory:** The 2 admin users still exist, so it wasn't a blanket `DELETE FROM User`

### **Option 2: Seeding/Migration Script (Less Probable)**

One of the seed files could have run a delete operation:
- `/prisma/seeds/seedRoles.ts` - NO delete operations (checked, only upsert)
- `/prisma/seeds/seedCmsPages.ts` - Need to check
- `/prisma/seeds/seedOpportunities.ts` - Need to check

### **Option 3: Manual Neon Dashboard Action (Possible)**

User could have:
- Connected to Neon dashboard
- Run manual SQL to delete users/talents
- Or restored from a blank backup

---

## Recovery Action Items

### **CRITICAL - DO IMMEDIATELY:**

1. **Check Neon Backup Points**
   ```bash
   # Is there a backup from before 2026-01-11 15:03?
   # If yes → restore to temp branch → verify data → export
   ```

2. **Check if staging/preview databases have the data**
   ```bash
   psql $STAGING_DB_URL -c "SELECT COUNT(*) FROM Talent;"
   ```

3. **Check git history for when Talents were created**
   ```bash
   git log --all --oneline -- apps/api/prisma/migrations/ | head -20
   # Look for migrations that created Talent table or added schema
   ```

4. **Check application logs**
   - Are there DELETE statements in the API request logs?
   - Any Sentry error events around 15:03-15:15 on 2026-01-11?
   - Any CI/CD deployment logs showing `migrate reset` or `delete` operations?

### **PREVENT Future Incidents:**

Update `mergeService.ts` to require explicit confirmation:
```typescript
// Add this guard
if (process.env.NODE_ENV === 'production' && !process.env.CONFIRM_MERGE_DELETE) {
  throw new Error('Merge delete operations require CONFIRM_MERGE_DELETE=true');
}
```

Update schema to use soft deletes for Talent:
```prisma
model Talent {
  id String @id @default(cuid())
  userId String
  user User @relation(fields: [userId], references: [id]) // Remove: on Delete: Cascade
  deletedAt DateTime? // Soft delete instead of hard delete
  
  @@index([deletedAt]) // Index for soft-delete queries
}
```

---

## Database Audit Summary

### Schema Findings:
- **Talent table:** 
  - Has 27 columns (id, userId, name, displayName, etc)
  - Has 25+ dependent tables (Deal, Commission, CreatorTask, etc)
  - **CRITICAL:** Uses `ON DELETE CASCADE` - very dangerous pattern

- **Dependent tables affected by cascade:**
  - Deal (0 rows now) ← Talent.onDelete:Cascade  
  - Commission (should have records)
  - Payout (should have records)
  - CreatorTask (should have records)

### Foreign Key Cascade Chain:

```
User --(ON DELETE CASCADE)--> Talent
                              ↓
                    25+ tables cascade from Talent:
                    - Deal (ON DELETE CASCADE)
                    - Commission (ON DELETE CASCADE)
                    - CreatorTask (ON DELETE CASCADE)
                    - Payout (ON DELETE CASCADE)
                    - BrandSavedTalent
                    - WellnessCheckin
                    ... etc
```

**One User deletion = Entire talent record ecosystem deleted**

---

## Neon-Specific Considerations

1. **Neon PITR (Point-in-Time Recovery):**
   - Available on all branches with 7-day retention (typical)
   - Can restore to specific timestamp
   - Must restore to NEW branch first (non-destructive)

2. **Neon Backups:**
   - Automatic hourly backups
   - Backup retention depends on plan
   - Can restore from Neon UI dashboard

3. **Neon Branch Management:**
   - Production branch should be read-only if possible
   - Preview/dev branches can be ephemeral

---

## Next Steps

### **Within 1 Hour:**
- [ ] Contact Neon support: "Can we restore production db from point-in-time backup to 2026-01-11 14:55?"
- [ ] Check if staging DB has Talent/Deal records
- [ ] Search application logs for DELETE operations

### **Within 4 Hours:**
- [ ] If Neon backup available: Restore to temp branch, verify data
- [ ] If staging has data: Dump and restore to production
- [ ] If neither available: Rebuild from Commission/Deal/Payment records

### **Post-Recovery (24 hours):**
- [ ] Implement soft-delete columns on Talent/User
- [ ] Change `ON DELETE CASCADE` to `ON DELETE RESTRICT`
- [ ] Add audit logging for delete operations
- [ ] Implement role-based access controls on dangerous endpoints

