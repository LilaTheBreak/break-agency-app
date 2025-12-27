# Unused Routes Analysis

## Summary
Analysis of routes that return "Not implemented" or stub responses. These routes are registered but not fully functional.

---

## Routes Identified as Unused/Incomplete

### 1. `/api/deal-packages` - SAFE TO DEPRECATE
**File:** `apps/api/src/routes/dealPackages.ts`  
**Status:** Returns 501 "Not implemented — deal packages removed from schema"  
**Frontend Usage:** No references found in web app  
**Schema Status:** Deal packages were removed from the Prisma schema  

**Recommendation:** ✅ **Remove route registration from server.ts**
- Route is explicitly documented as removed
- No frontend code depends on it
- Schema models no longer exist

**Action:**
```typescript
// REMOVE this line from server.ts:
app.use("/api/deal-packages", dealPackagesRouter);
```

---

### 2. `/api/outreach/leads` - KEEP (Placeholder for future feature)
**File:** `apps/api/src/routes/outreachLeads.ts`  
**Status:** Returns placeholder response "Outreach Leads route is not implemented yet"  
**Frontend Usage:** No references found in web app  
**Purpose:** Placeholder to prevent server crashes  

**Recommendation:** ⚠️ **Keep but add feature flag**
- This is a planned feature (part of outreach system)
- Route exists to prevent 404 errors if called
- Should be gated by `OUTREACH_LEADS_ENABLED` flag

**Action:**
```typescript
// In outreachLeads.ts, add feature flag check:
import { features } from '@shared/features'; // if shared, or require from web config

router.get("/", async (_req, res) => {
  if (!features.OUTREACH_LEADS_ENABLED) {
    return res.status(501).json({
      ok: false,
      error: "Outreach Leads feature is not yet available"
    });
  }
  // ... implementation when ready
});
```

---

## Routes NOT in Analysis (Working Correctly)

These routes were checked and are **functional**, not unused:

- `/api/inbox/*` - All inbox routes working (categories, counters, thread, etc.)
- `/api/gmail/*` - Gmail integration routes working
- `/api/crm-*` - CRM routes (brands, contacts, campaigns) working
- `/api/outreach` (base) - Outreach system working
- `/api/outreach/sequences` - Working
- `/api/outreach/templates` - Working
- `/api/outreach/metrics` - Working

---

## Recommendations Summary

### Immediate Actions
1. ✅ **Remove `/api/deal-packages` route** - Schema removed, no frontend usage
2. ⚠️ **Add feature flag to `/api/outreach/leads`** - Planned feature, keep placeholder but gate it

### Documentation Updates
- Document removed routes in git commit message
- Update API documentation to reflect deal-packages removal
- Add feature flag documentation for outreach-leads

---

## Implementation Checklist

### Phase 5 - Task 2: Remove Unused Routes

- [x] Identify unused routes via grep search
- [x] Check frontend dependencies
- [x] Verify schema status
- [ ] Remove `/api/deal-packages` route from server.ts
- [ ] Remove dealPackagesRouter import from server.ts
- [ ] Add feature flag to outreachLeads.ts (optional but recommended)
- [ ] Test that removed routes return 404 as expected
- [ ] Commit with clear message: "feat: Remove deal-packages route (schema removed)"

---

## Notes

**Why Keep Placeholder Routes?**
Placeholder routes like `outreachLeads.ts` serve a purpose:
- Prevent 404 errors during development
- Document planned features
- Make it clear the endpoint exists but isn't implemented yet
- Easier to implement when ready (just add logic to existing route)

**Why Remove Deal Packages Route?**
Deal packages are different:
- Schema models were explicitly removed
- No plan to re-implement (documented as removed)
- No frontend code depends on it
- Keeping it causes confusion ("why does this route exist?")

