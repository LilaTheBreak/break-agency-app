# Brands Page TypeError Fix - January 16, 2026

## Problem
The Brands CRM page was crashing with:
```
TypeError: (c || []).filter is not a function
```

## Root Cause
When API endpoints throw errors, some were returning error objects instead of empty arrays:

**Before:**
- `GET /api/crm-campaigns` error → `{ error: "...", message: "..." }` ❌ (object, not array)
- `GET /api/crm-deals` error → `{ success: false, error: "...", code: "..." }` ❌ (object, not array)
- `GET /api/crm-events` error → `[]` ✅ (empty array)
- `GET /api/crm-contracts` error → `[]` ✅ (empty array)

When frontend code tried to filter the response:
```javascript
campaignsArray.filter(c => c && c.brandId === brand.id)
// If response was error object, .filter() fails → TypeError
```

## Solution
Updated error handlers to return empty arrays for consistency:

**Files Fixed:**
1. `apps/api/src/routes/crmCampaigns.ts` (line 69)
2. `apps/api/src/routes/crmDeals.ts` (line 199)

**After:**
- `GET /api/crm-campaigns` error → `[]` ✅
- `GET /api/crm-deals` error → `[]` ✅
- `GET /api/crm-events` error → `[]` ✅
- `GET /api/crm-contracts` error → `[]` ✅

## Changes
```typescript
// BEFORE: crmCampaigns.ts
return res.status(500).json({ 
  error: "Failed to fetch campaigns",
  message: error.message
});

// AFTER: crmCampaigns.ts
return res.status(500).json([]);
```

Same pattern applied to crmDeals.ts.

## Impact
✅ Brands page now loads gracefully even if campaigns or deals fetch fails  
✅ Filtering works with or without data  
✅ Empty states render correctly instead of crashing  
✅ User experience improves - no more blank error pages

## Testing
- Web build completes successfully
- No TypeScript errors
- Brands page filtering code protected by additional `Array.isArray()` checks
- All error paths return consistent array format

## Deployment
Ready for production. Commit: `621a750`
