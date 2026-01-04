# Migration Guide: Contract BrandId Backfill

**Date:** January 2025  
**Purpose:** Apply schema changes and backfill `brandId` for existing contracts

---

## PREREQUISITES

1. **Database Access:** Ensure you have access to the production database
2. **Environment:** Ensure `DATABASE_URL` is set in your environment or `.env` file
3. **Backup:** Consider backing up the database before running migrations (recommended)

---

## STEP 1: Apply Schema Changes

Run this command to apply the schema changes (adds `brandId` field to Contract model):

```bash
cd apps/api
npx prisma db push
```

**Expected Output:**
- Schema changes applied successfully
- New `brandId` column added to `Contract` table
- New `Contract` relation added to `Brand` table

**If you see errors:**
- Ensure `DATABASE_URL` is set correctly
- Ensure database is accessible
- Check Prisma schema is valid: `npx prisma validate`

---

## STEP 2: Backfill Existing Contracts

After schema changes are applied, run the backfill script to populate `brandId` for existing contracts:

```bash
cd apps/api
npx tsx scripts/backfillContractBrandIds.ts
```

**Expected Output:**
```
[MIGRATION] Starting contract brandId backfill...
[MIGRATION] Found X contracts without brandId
[MIGRATION] Updated X contracts...
[MIGRATION] - Updated: X
[MIGRATION] - Skipped: Y
[MIGRATION] - Errors: 0
[MIGRATION] Complete!
```

**What It Does:**
- Finds all contracts where `brandId` is `null`
- Derives `brandId` from the associated `Deal.brandId`
- Updates contracts with explicit brand linkage
- Skips contracts without deals (logs warning)

**Safety:**
- ✅ Idempotent (only updates contracts where `brandId` is null)
- ✅ Non-destructive (only adds data, doesn't remove)
- ✅ Logs all actions for audit

---

## VERIFICATION

After running both commands, verify the migration:

```sql
-- Check contracts with brandId populated
SELECT COUNT(*) FROM "Contract" WHERE "brandId" IS NOT NULL;

-- Check contracts still without brandId (should be 0 or contracts without deals)
SELECT COUNT(*) FROM "Contract" WHERE "brandId" IS NULL;

-- Verify brand relation works
SELECT c.id, c.title, b.name as brand_name 
FROM "Contract" c 
LEFT JOIN "Brand" b ON c."brandId" = b.id 
LIMIT 10;
```

---

## ROLLBACK (If Needed)

If you need to rollback:

```sql
-- Remove brandId column (only if necessary)
ALTER TABLE "Contract" DROP COLUMN IF EXISTS "brandId";
```

**Note:** This will remove the explicit brand linkage. Contracts will still be accessible via `Deal.brandId` relation.

---

## TROUBLESHOOTING

### Error: "Environment variable not found: DATABASE_URL"
**Solution:** Ensure `.env` file exists in `apps/api/` with `DATABASE_URL` set, or export it:
```bash
export DATABASE_URL="your_database_url_here"
```

### Error: "Can't reach database server"
**Solution:** 
- Check database is running
- Verify `DATABASE_URL` is correct
- Check network connectivity
- For production, ensure you're connected to the correct database

### Error: "Unique constraint violation"
**Solution:** This shouldn't happen, but if it does, check for duplicate contract records.

### Script finds 0 contracts to update
**Possible reasons:**
- All contracts already have `brandId` (unlikely for existing data)
- No contracts exist in database
- Contracts exist but all have deals (should still update)

---

## POST-MIGRATION CHECKLIST

- [ ] Schema changes applied (`npx prisma db push` succeeded)
- [ ] Backfill script completed without errors
- [ ] Verified contracts have `brandId` populated
- [ ] Tested contract queries with `brandId` filter
- [ ] Verified brand detail view shows contracts correctly
- [ ] No errors in application logs

---

**Status:** Ready to run when database access is available

