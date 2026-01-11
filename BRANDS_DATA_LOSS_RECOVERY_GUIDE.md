# Brands Data Loss - Recovery Action Plan

**Created:** January 11, 2026  
**Priority:** 🔴 CRITICAL  
**Objective:** Recover missing brands data and prevent future loss

---

## Quick Diagnosis (5 minutes)

### Step 1: Check Database Connection
```bash
cd /Users/admin/Desktop/break-agency-app-1

# View database URL
cat apps/api/.env | grep DATABASE_URL

# If empty, check .env.example or documentation
# Set DATABASE_URL if needed:
export DATABASE_URL="postgresql://user:pass@localhost:5432/break-crm"
```

### Step 2: Count Brands in Database
```bash
# Use Prisma to check
cd apps/api
npx prisma db execute --stdin <<'EOF'
SELECT COUNT(*) as brand_count FROM "CrmBrand";
EOF
```

**What to expect:**
- **0 brands** → Data is in localStorage (see Scenario A)
- **> 0 brands** → Data exists but not displaying (see Scenario B)
- **Error** → Database connection issue (see Scenario C)

### Step 3: Check localStorage
```javascript
// Run in browser console on AdminBrandsPage
// Open DevTools: F12 → Console → Paste:

const brandsKey = 'break_admin_brands_v1';
const brands = JSON.parse(localStorage.getItem(brandsKey) || '[]');
console.log(`Brands in localStorage: ${brands.length}`);
console.log(brands);

// List all CRM data keys
const allKeys = Object.keys(localStorage).filter(k => k.includes('break_admin'));
console.log('All CRM data keys:', allKeys);
```

---

## Recovery Scenarios

### Scenario A: Data in localStorage (Most Likely)

**Signs:**
- Database shows 0 brands
- Browser localStorage has brands data
- AdminBrandsPage shows "Migrate data?" message

**Recovery Steps:**

1. **Open AdminBrandsPage in browser**
   - Navigate to: `https://localhost:3000/admin/crm/brands`
   - Look for yellow/blue banner: "You have X brands in your browser..."

2. **Click "Migrate" Button**
   - This triggers: `migrateLocalStorageToDatabase()`
   - Submits POST request to `/api/crm-brands/batch-import`
   - Shows progress: "Importing brands..."

3. **Verify Import**
   ```javascript
   // Check console logs
   // Should show: "[CRM] Initial brands loaded: X brands"
   
   // Query database again
   psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"CrmBrand\";"
   ```

4. **Confirm Data Appears**
   - Brands should appear in AdminBrandsPage table
   - Related data (contacts, campaigns) loads
   - Refresh page → brands still visible

5. **Cleanup**
   ```javascript
   // Run in browser console to confirm localStorage cleared
   console.log(localStorage.getItem('break_admin_brands_v1')); // Should be null
   ```

**Time to resolve:** 2-5 minutes

---

### Scenario B: Data Exists but Not Displaying

**Signs:**
- Database shows N brands
- AdminBrandsPage shows "No brands" or empty state
- Browser console may show errors

**Recovery Steps:**

1. **Test API Directly**
   ```bash
   # Get your auth token (from browser DevTools → Network tab → Authorization header)
   TOKEN="your-bearer-token-here"
   
   curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:3001/api/crm-brands | jq .
   ```

2. **Check API Response Format**
   ```javascript
   // Should return direct array:
   // [{ id: "...", brandName: "...", ... }, ...]
   
   // NOT wrapped object:
   // { brands: [...] }
   ```

3. **Check Browser Console**
   - Open DevTools: F12 → Console
   - Look for errors like:
     - "Failed to load brands: ..."
     - "TypeError: ... is not a function"
     - "401 Unauthorized"
   - Check for logs: "[CRM] Initial brands loaded: X brands"

4. **Check Authentication**
   ```javascript
   // In browser console
   const token = localStorage.getItem('auth-token'); // Or whatever key you use
   console.log('Auth token exists:', !!token);
   console.log('Token type:', typeof token);
   ```

5. **Clear Cache and Reload**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Clear DevTools cache: F12 → Settings → Network → Disable cache
   - Reload page

6. **Check Specific Logs in AdminBrandsPage**
   ```javascript
   // In browser console on AdminBrandsPage
   // Look for any of these console.log() calls:
   // [CRM] Initial data load...
   // [CRM] Failed to load brands:
   // [CRM] Initial brands loaded: X brands
   ```

7. **Debug API Call**
   - Open Network tab
   - Filter by "crm-brands"
   - Click the GET request
   - Check Response tab for actual data
   - Check Status code (should be 200)
   - Check Headers for auth token

**If Still Empty After API Test:**
- API is returning empty array: `[]`
- This means database has no brands
- Fall back to Scenario A (check localStorage)

**Time to resolve:** 5-10 minutes

---

### Scenario C: Database Connection Issue

**Signs:**
- Cannot connect to database
- Error: "ECONNREFUSED" or "password authentication failed"
- Prisma commands fail

**Recovery Steps:**

1. **Check DATABASE_URL**
   ```bash
   echo $DATABASE_URL
   
   # Should output: postgresql://user:password@host:port/database
   # If empty, set it:
   export DATABASE_URL="postgresql://..."
   ```

2. **Check if PostgreSQL is Running**
   ```bash
   # Check if port 5432 is listening
   lsof -i :5432
   
   # Or for PostgreSQL specifically
   brew services list | grep postgres
   
   # If not running, start it
   brew services start postgresql
   ```

3. **Test Connection**
   ```bash
   psql $DATABASE_URL -c "SELECT 1;"
   
   # Should output: 1
   # If error, check credentials in .env
   ```

4. **Run Migrations**
   ```bash
   cd apps/api
   npx prisma migrate deploy
   
   # This ensures schema is up to date
   ```

5. **Try Database Query Again**
   ```bash
   psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"CrmBrand\";"
   ```

**Time to resolve:** 5-15 minutes depending on PostgreSQL status

---

### Scenario D: Data Was Deleted Permanently

**Signs:**
- Database shows 0 brands
- localStorage shows 0 brands
- No recent brand activity in audit logs

**Recovery Steps:**

1. **Check Backups**
   ```bash
   # List recent PostgreSQL backups
   ls -lh /path/to/postgres/backups/
   
   # Or ask DevOps/DBA where backups are stored
   ```

2. **Restore Most Recent Backup**
   ```bash
   # Example restoration (adjust for your backup system)
   pg_restore -d break-crm /path/to/backup.dump
   
   # Or restore from cloud backup (AWS RDS, etc.)
   ```

3. **Verify Data After Restore**
   ```bash
   psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"CrmBrand\";"
   ```

4. **Reload Application**
   - Restart backend: `npm run dev` in `apps/api`
   - Restart frontend: `npm run dev` in `apps/web`
   - Navigate to AdminBrandsPage
   - Brands should appear

5. **Check Audit Logs for Root Cause**
   ```bash
   psql $DATABASE_URL -c "
   SELECT \"action\", \"entityType\", \"createdAt\", \"metadata\"
   FROM \"AuditLog\"
   WHERE \"action\" LIKE '%BRAND%' OR \"action\" = 'BULK_DELETE'
   ORDER BY \"createdAt\" DESC
   LIMIT 20;
   "
   ```

**Time to resolve:** 10-30 minutes depending on backup size

---

## Prevention Steps (After Recovery)

### 1. Implement Soft Deletes
```typescript
// Modify CrmBrand model in schema.prisma
model CrmBrand {
  // ... existing fields ...
  deletedAt DateTime?  // Add this field
  isDeleted Boolean @default(false)  // Add this field
  
  // Change DELETE endpoint to update instead
  // await prisma.crmBrand.update({
  //   where: { id },
  //   data: { deletedAt: new Date(), isDeleted: true }
  // });
  
  // Update GET to filter out deleted
  // await prisma.crmBrand.findMany({
  //   where: { isDeleted: false }
  // });
}
```

### 2. Add Deletion Confirmation
```typescript
// Modify DELETE endpoint
router.delete("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { confirmationToken } = req.body;
  
  // Require explicit confirmation
  if (!confirmationToken) {
    return res.status(400).json({ 
      error: "Deletion requires confirmation token",
      requiresConfirmation: true
    });
  }
  
  // Verify confirmation token (time-limited, one-time use)
  // ...rest of code
});
```

### 3. Add Rate Limiting
```typescript
// Prevent bulk deletes
import rateLimit from 'express-rate-limit';

const deleteLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Max 5 deletes per minute per user
  message: 'Too many deletions. Please wait before trying again.',
});

router.delete("/:id", deleteLimiter, async (req: Request, res: Response) => {
  // ... rest of endpoint
});
```

### 4. Enhanced Audit Logging
```typescript
// Log all significant operations
await logDestructiveAction(req, {
  action: "BRAND_DELETE",
  entityType: "CrmBrand",
  entityId: id,
  severity: "CRITICAL",
  metadata: {
    brandName: brand.brandName,
    relatedContacts: brand._count.CrmBrandContact,
    relatedTasks: brand._count.CrmTask,
    relatedOutreach: brand._count.Outreach,
    deletedBy: user.email,
    deletedAt: new Date().toISOString(),
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  }
});
```

### 5. Enable Point-in-Time Recovery
```bash
# Configure PostgreSQL for PITR
# In postgresql.conf:
# wal_level = replica
# archive_mode = on
# archive_command = 'test ! -f /mnt/server/archivedir/%f && cp %p /mnt/server/archivedir/%f'

# Or use managed backup service (AWS RDS, Heroku, etc.)
```

---

## Monitoring & Alerting

### Set Up Monitoring Queries

```javascript
// Add to AdminBrandsPage effect
useEffect(() => {
  const monitorBrandHealth = async () => {
    try {
      const brands = await fetchBrands();
      const count = Array.isArray(brands) ? brands.length : 0;
      
      // If suddenly 0, alert
      if (count === 0 && previousCount > 0) {
        console.error('[ALERT] Brands count dropped from', previousCount, 'to 0');
        
        // Send alert to monitoring service
        await fetch('/api/alerts', {
          method: 'POST',
          body: JSON.stringify({
            severity: 'critical',
            message: 'All brands disappeared from system',
            timestamp: new Date(),
          })
        });
      }
      
      setPreviousCount(count);
    } catch (err) {
      console.error('[ALERT] Failed to load brands:', err);
    }
  };
  
  // Check every 5 minutes
  const interval = setInterval(monitorBrandHealth, 5 * 60 * 1000);
  return () => clearInterval(interval);
}, []);
```

---

## Quick Reference: Commands

### Database Diagnostics
```bash
# Count brands
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"CrmBrand\";"

# Show sample brands
psql $DATABASE_URL -c "SELECT id, \"brandName\" FROM \"CrmBrand\" LIMIT 5;"

# Check recent deletions
psql $DATABASE_URL -c "SELECT * FROM \"AuditLog\" WHERE action LIKE '%DELETE%' ORDER BY \"createdAt\" DESC LIMIT 5;"

# Restore from backup
pg_restore -d break-crm /path/to/backup.dump
```

### Frontend Recovery
```javascript
// Browser console
const brandsData = JSON.parse(localStorage.getItem('break_admin_brands_v1'));
console.log('Brands in localStorage:', brandsData ? brandsData.length : 0);

// Trigger migration programmatically
if (brandsData && brandsData.length > 0) {
  fetch('/api/crm-brands/batch-import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      brands: brandsData,
      contacts: [],
      outreach: []
    })
  }).then(r => r.json()).then(console.log);
}
```

---

## Support Escalation

If recovery steps don't work, escalate with:

1. **Database Status:** Output of `SELECT COUNT(*) FROM "CrmBrand";`
2. **API Response:** Output of `curl /api/crm-brands` (first 20 brands)
3. **Browser Console:** Screenshot of any errors in DevTools
4. **Audit Log:** Output of recent BRAND-related audit entries
5. **localStorage Status:** Results of localStorage check in browser
6. **Timeline:** When brands were last visible, when they disappeared

This information will help DevOps/DBA determine root cause and implement recovery.

---

**Status:** 🟡 PENDING - Awaiting database verification  
**Next Step:** Execute "Quick Diagnosis" steps above
