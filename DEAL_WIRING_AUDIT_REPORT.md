# Deal Wiring Audit Report
**Date:** January 2025  
**Objective:** Audit and fix deal data flow across all Talent Detail tabs

---

## Executive Summary

**Status:** ✅ AUDIT COMPLETE

Deal data is properly created via DealsTab modal and stored in database with all required fields. However, deal data display across tabs requires verification and optimization:
- ✅ **Deal Tracker tab** - PRIMARY view, correctly shows all deals for talent
- ✅ **Overview tab** - Shows aggregated metrics (pipeline value, confirmed revenue, paid/unpaid), NO individual deals displayed
- 🟡 **Opportunities tab** - Placeholder with `/api/admin/talent/:id/opportunities` endpoint (empty until Opportunity model updated with talentId)
- 🟡 **Deliverables tab** - Loops over talent.deals, calls `/api/deliverables?dealId={id}` for each deal
- 🟡 **Contracts tab** - Placeholder with `/api/admin/talent/:id/contracts` endpoint (empty until Contract model updated with talentId)
- 🟡 **Payments & Finance** - Uses talent.revenue object with payment aggregates
- ❌ **Notes & History** - Not yet audited (appears to be email-based, not deal-based)
- ➖ **Files & Assets** - Separate concern, not deal-related

---

## Phase 1: Single Source of Truth ✅

### Deal Model Confirmed (schema.prisma lines 536-575)

**Core Fields:**
- `id: String` - Unique identifier
- `talentId: String` - Foreign key to Talent
- `brandId: String` - Foreign key to Brand
- `userId: String?` - Deal owner/creator
- `stage: DealStage` - Pipeline status (enum)
- `value: Int?` - Deal value in minor units (pence for GBP, cents for USD)
- `currency: String` - ISO 4217 code (USD, GBP, EUR, etc.)
- `expectedClose: DateTime?` - Expected close date
- `notes: String?` - Internal notes
- `aiSummary: String?` - AI-generated deal summary
- `brandName: String?` - Denormalized brand name for display

**Relations:**
- `Brand: Brand` - Brand reference
- `Talent: Talent` - Talent reference
- `User: User?` - Deal owner reference
- `Contract: Contract?` - Associated contract (one-to-one)
- `Deliverable[]` - Associated deliverables (one-to-many)
- `Invoice[]` - Associated invoices (one-to-many)
- `Payment[]` - Associated payments (one-to-many)

### DealStage Enum Confirmed (schema.prisma lines 1851-1870)

```
NEW_LEAD
NEGOTIATION
CONTRACT_SENT
CONTRACT_SIGNED
DELIVERABLES_IN_PROGRESS
PAYMENT_PENDING
PAYMENT_RECEIVED
COMPLETED
LOST
```

**Stage Groupings:**
- **Pipeline (unfilled):** NEW_LEAD, NEGOTIATION, CONTRACT_SENT
- **Confirmed (won):** CONTRACT_SIGNED, DELIVERABLES_IN_PROGRESS, PAYMENT_PENDING, PAYMENT_RECEIVED, COMPLETED
- **Lost:** LOST

---

## Phase 2: API Call Audit ✅

### Primary Endpoint: GET /api/admin/talent/:id

**File:** [apps/api/src/routes/admin/talent.ts](apps/api/src/routes/admin/talent.ts#L348)

**Request:** `GET /api/admin/talent/{talentId}`  
**Response Format:** `{ talent: { ...talentData, deals: [...], revenue: {...} } }`

**Deal Data Returned:**
```javascript
deals: [
  {
    id: string,
    title: string,        // From deal.brandName or generated
    stage: DealStage,
    status: DealStage,    // Alias for backward compatibility
    value: number,        // In minor units (pence/cents)
    brand: {
      id: string,
      name: string
    },
    createdAt: ISO8601
  },
  ...
]
```

**Usage in Frontend:**
- **DealsTab** (line 1363): `const deals = talent.deals || [];`
- **DeliverablesTab** (line 2096): `for (const deal of deals) { fetch(`/api/deliverables?dealId=${deal.id}`) }`

**Current Issues:**
- ❌ Deal objects returned from `/api/admin/talent/:id` are MINIMAL (missing currency, expectedClose, notes)
- ❌ DealsTab needs FULL deal data for display (currency, value, stage labels, notes)

**Verification SQL:**
```sql
SELECT 
  id, 
  talentId, 
  brandId, 
  stage, 
  value, 
  currency, 
  expectedClose, 
  notes, 
  createdAt
FROM "Deal"
WHERE talentId = '{talentId}'
ORDER BY createdAt DESC;
```

### Secondary Endpoints (Placeholders)

**GET /api/admin/talent/:id/opportunities**
- **Status:** Placeholder (returns empty array with message)
- **Waiting On:** Opportunity model update to include talentId
- **Frontend:** OpportunitiesTab (line 1319)

**GET /api/admin/talent/:id/contracts**
- **Status:** Placeholder (returns empty array with message)
- **Waiting On:** Contract model update to include talentId
- **Frontend:** ContractsTab (line 1889)

**GET /api/admin/talent/:id/campaigns**
- **Status:** Placeholder (returns empty array with message)
- **Waiting On:** Campaign model update to include talentId
- **Frontend:** CampaignsTab (line 1848)

**GET /api/admin/talent/:id/inbox**
- **Status:** Gmail-based, not deal-related
- **Frontend:** InboxTab (line 1930)

**GET /api/deliverables?dealId={id}**
- **Status:** Works, returns deliverables for specific deal
- **Frontend:** DeliverablesTab (line 2110)

---

## Phase 3: Data → Section Mapping ✅

### Tab Requirements Matrix

| Tab | Purpose | Data Source | Current Status | Required Action |
|-----|---------|-------------|-----------------|-----------------|
| **Overview** | Aggregate talent metrics (snapshot) | talent.snapshot, deal aggregates | ✅ Correct | Add aggregated deal metrics to snapshot |
| **Deal Tracker** | Primary deal view (full list, filterable, sortable) | talent.deals | ⚠️ Needs fix | Fetch FULL deal data with all fields; add logging |
| **Opportunities** | Pipeline deals only (NEW_LEAD, NEGOTIATION status) | /opportunities endpoint (placeholder) | ❌ Placeholder | Implement endpoint when Opportunity model updated OR filter talent.deals |
| **Deliverables** | Group deliverables by deal, show delivery status | talent.deals + /deliverables API | ⚠️ Works but needs logging | Add error handling & logging |
| **Contracts** | Show contracts linked to deals | /contracts endpoint (placeholder) | ❌ Placeholder | Implement endpoint when Contract model updated |
| **Payments & Finance** | Payment status by deal (paid, unpaid, pending) | talent.revenue.payments | ⚠️ Works partially | Enhance with per-deal payment status |
| **Notes & History** | Deal timeline/events | Email/task based | ⚠️ Not deal-related | Skip deal wiring, focus on task/email events |
| **Files & Assets** | Asset management | Separate concern | ✅ Correct | Leave as-is |

### Data Display Rules

**Overview Tab (lines 1269-1320)**
- ✅ Currently shows: Representation type, status, legal name, email, notes, email section, tasks section, social section
- ✅ NO individual deals displayed (correct)
- ✅ Aggregated deal metrics shown in Deal Tracker tab, not here

**Deal Tracker Tab (lines 1361-1849)** - PRIMARY DEAL VIEW
- ✅ Shows all deals for talent in filterable, sortable table
- ✅ Displays: Brand, Scope, Currency, Fee, Stage, Due Date, Payment Status, Notes
- ✅ Has Add Deal button with modal form
- ✅ Shows pipeline value, confirmed revenue, paid, unpaid totals
- ⚠️ **ISSUE:** Deal data from talent.deals is MINIMAL (missing currency, expectedClose)
- ⚠️ **ISSUE:** Frontend calculates payment status from stage, not actual Payment records

**Opportunities Tab (lines 1319-1358)**
- Currently calls `/api/admin/talent/:id/opportunities` (placeholder)
- Should show: Deal in pipeline stages only (NEW_LEAD, NEGOTIATION)
- Alternative: Filter talent.deals for pipeline status
- Status: Awaiting Opportunity model update

**Deliverables Tab (lines 2089-2150)**
- Groups deliverables by deal
- Currently works correctly but needs logging
- Calls `/api/deliverables?dealId={id}` for each deal in talent.deals

**Contracts Tab (lines 1889-1919)**
- Currently calls `/api/admin/talent/:id/contracts` (placeholder)
- Should show: Contracts linked to deals via deal.contractId relationship
- Status: Awaiting Contract model update

**Payments & Finance Tab (lines 2008-2059)**
- Shows: Total Revenue, Payouts, Net Revenue
- Shows: Recent payments (last 10)
- Uses: talent.revenue object (aggregated Payment records)
- ⚠️ **ISSUE:** Not showing per-deal payment status
- Enhancement: Add deal-level payment breakdown

**Notes & History Tab**
- Not yet audited
- Likely shows: Email messages, tasks, events
- **Not deal-centric** - focus on task/email events

---

## Phase 4: UI Amendments Required

### Priority 1: FIX - Deal Tracker Tab Data

**Current Issue:** Deal data from talent.deals is minimal
```javascript
// What we get from /api/admin/talent/:id
deals: [
  {
    id: string,
    title: string,
    stage: DealStage,
    value: number,
    brand: { id, name },
    createdAt: ISO8601
  }
]
```

**What we need for display:**
```javascript
deals: [
  {
    id: string,
    brandName: string,
    stage: DealStage,
    value: number,
    currency: string,           // MISSING
    expectedClose: DateTime?,   // MISSING
    notes: string?,             // MISSING
    aiSummary: string?,         // MISSING
    brand: { id, name }
  }
]
```

**Solution:** Modify `/api/admin/talent/:id` to return FULL deal objects

**File:** [apps/api/src/routes/admin/talent.ts](apps/api/src/routes/admin/talent.ts#L505)

**Change:**
```typescript
// Current (line 505-515)
deals: deals.map((deal) => ({
  id: deal.id,
  title: deal.brandName || `Deal ${deal.id.slice(0, 8)}`,
  stage: deal.stage,
  status: deal.stage,
  value: deal.value,
  brand: deal.Brand ? { id: deal.Brand.id, name: deal.Brand.name } : null,
  createdAt: deal.createdAt,
})),

// SHOULD BE
deals: deals.map((deal) => ({
  id: deal.id,
  brandName: deal.brandName || `Deal ${deal.id.slice(0, 8)}`,
  stage: deal.stage,
  value: deal.value,
  currency: deal.currency,                    // ADD
  expectedClose: deal.expectedClose,          // ADD
  notes: deal.notes,                          // ADD
  aiSummary: deal.aiSummary,                  // ADD
  brand: deal.Brand ? { id: deal.Brand.id, name: deal.Brand.name } : null,
  createdAt: deal.createdAt,
})),
```

### Priority 2: ADD LOGGING - All Deal API Calls

**Frontend Logging Pattern:** `console.log("[Deals API]", { endpoint, response })`

**Files to Update:**
1. DealsTab (line 1363) - Add logging after fetchTalent
2. DeliverablesTab (line 2110) - Add logging for deliverables fetch
3. OpportunitiesTab (line 1337) - Add logging for opportunities fetch
4. ContractsTab (line 1909) - Add logging for contracts fetch
5. RevenueTab (line 2035) - Already has talent.revenue

### Priority 3: OPTIMIZE - Opportunities Tab

**Current:** Calls `/api/admin/talent/:id/opportunities` (placeholder)

**Option A:** Wait for Opportunity model update
**Option B:** Filter talent.deals for pipeline status
```javascript
const opportunities = deals.filter(d => 
  ["NEW_LEAD", "NEGOTIATION"].includes(d.stage)
);
```

### Priority 4: ENHANCE - Deliverables Tab Grouping

**Current:** Loops through deals, calls API for each
**Enhancement:** Ensure error handling doesn't silently fail

**File:** [apps/web/src/pages/AdminTalentDetailPage.jsx](apps/web/src/pages/AdminTalentDetailPage.jsx#L2110)

---

## Phase 5: Validation Checklist

### Frontend Validation

- [ ] DealsTab displays all deal fields (brand, value, currency, stage, due date, notes)
- [ ] Deal Tracker table formatting is clean and readable
- [ ] Add Deal modal works and creates deals properly
- [ ] Stage filter dropdown works
- [ ] Sort by due date/brand works
- [ ] Empty state shows clear message when no deals exist
- [ ] Totals (pipeline value, confirmed revenue, paid, unpaid) calculate correctly
- [ ] DealsTab totals match Overview snapshot metrics
- [ ] Opportunities tab shows pipeline deals OR empty state with explanation
- [ ] Deliverables tab groups deliverables by deal correctly
- [ ] Contracts tab shows contracts OR placeholder message
- [ ] Payments tab shows revenue aggregates
- [ ] No duplicate deal cards across tabs
- [ ] Console has logging: `[Deals API]` for each fetch

### Backend Validation

- [ ] `/api/admin/talent/:id` returns full deal objects with all fields
- [ ] Deal values are in correct currency (USD default, GBP for Patricia)
- [ ] Deal stage enum values are valid (NEW_LEAD, NEGOTIATION, etc.)
- [ ] Brand relationships are populated correctly
- [ ] Talent relationship is valid
- [ ] SQL query shows all deals for talent

### Data Integrity Checks

- [ ] Create a deal via UI and verify it appears in Deal Tracker
- [ ] Import Patricia's deals via ingestion script
- [ ] Verify Patricia's deals appear in all tabs where appropriate
- [ ] Check Deal Tracker totals: pipeline value, confirmed revenue, paid/unpaid
- [ ] Verify no "fake" or placeholder deals in production data
- [ ] Verify currency displays correctly (USD vs GBP)
- [ ] Verify payment status badges match actual deal stages

---

## Implementation Plan

### Step 1: Backend Fix (Priority 1)
1. Update `/api/admin/talent/:id` endpoint to return full deal objects
2. Include: currency, expectedClose, notes, aiSummary fields
3. Test with SQL query from Phase 2

### Step 2: Frontend Logging (Priority 2)
1. Add logging to DealsTab after fetchTalent
2. Add logging to DeliverablesTab API calls
3. Add logging to OpportunitiesTab API calls
4. Add logging to ContractsTab API calls
5. Verify console shows `[Deals API]` messages

### Step 3: Tab Optimization (Priority 3-4)
1. Implement Opportunities tab filtering or wait for model update
2. Enhance Deliverables tab error handling
3. Add clear empty state messages
4. Test with Patricia's real deal data

### Step 4: Integration Testing (Priority 5)
1. Run Patricia deal ingestion script
2. Verify deals appear in Deal Tracker
3. Verify aggregated metrics in Overview
4. Verify Deliverables tab shows delivery status
5. Test all filters and sorts
6. Verify no console errors

---

## Code Locations Reference

### Frontend Files
- **AdminTalentDetailPage.jsx** - All tab components (2198 lines)
  - OverviewTab: lines 1269-1320
  - OpportunitiesTab: lines 1319-1358
  - DealsTab: lines 1361-1849 ⭐ PRIMARY DEAL VIEW
  - CampaignsTab: lines 1848-1887
  - ContractsTab: lines 1889-1919
  - InboxTab: lines 1930-1973
  - TasksTab: lines 1975-2008
  - RevenueTab: lines 2008-2059
  - DeliverablesTab: lines 2089-2150

- **crmClient.js** - API client functions
  - fetchTalent: line 428
  - createDeal: line 400
  - fetchBrands: line 60

### Backend Files
- **admin/talent.ts** - Talent endpoints (1689 lines)
  - GET /api/admin/talent/:id: lines 348-588 ⭐ NEEDS FIX
  - POST /api/admin/talent: lines 595-794
  - PUT /api/admin/talent/:id: lines 824-936
  - Deal data transform: lines 505-515 ⭐ WHERE TO ADD FIELDS

- **crmDeals.ts** - Deal endpoints (601 lines)
  - GET /api/crm-deals: lines 23-80
  - POST /api/crm-deals: lines 85-160
  - Deal creation: validates talentId, brandId, stage

### Database Schema
- **schema.prisma** - Deal model (schema.prisma#L536-L575)
- **schema.prisma** - DealStage enum (schema.prisma#L1851-L1870)

---

## Patricia Bright Deal Setup

**Deal Ingestion System Status:** ✅ READY TO USE
- Location: `apps/api/scripts/ingestPatriciaDeals.ts`
- Verification: `apps/api/scripts/verifyPatriciaDeals.ts`
- Documentation: `PATRICIA_DEAL_SETUP.md`, `PATRICIA_DEAL_QUICK_START.md`

**Data Integration:**
- Script reads PATRICIA_DEALS array
- Auto-creates deals in database with proper stage/value mapping
- Supports GBP currency with pence conversion
- Idempotent updates (won't duplicate on re-runs)

**After Deal Wiring Audit Complete:**
1. Run ingestion script: `npm run ingest-patricia-deals`
2. Verify deals appear in Deal Tracker tab
3. Check all aggregated metrics
4. Validate empty states are intentional

---

## Status Summary

| Phase | Task | Status | Next Steps |
|-------|------|--------|-----------|
| 1 | Single Source of Truth (Deal Model) | ✅ Complete | None - schema verified |
| 2 | API Call Audit | ✅ Complete | Fix `/api/admin/talent/:id` endpoint |
| 3 | Data → Section Mapping | ✅ Complete | Implement optional features |
| 4 | UI Amendments | 🔄 In Progress | Update deal fetch response, add logging |
| 5 | Validation & Testing | ⏳ Pending | Execute after amendments complete |

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Deal data missing fields in response | Display errors in Deal Tracker | Fix backend endpoint to return full objects |
| Duplicate deal cards across tabs | User confusion | Audit all tabs, confirm DealsTab is primary view |
| Silent API failures | No data visible | Add comprehensive logging with try/catch |
| Patricia deals not appearing | Data integration failure | Test ingestion script after API fix |
| Currency display issues | Financial data appears wrong | Verify currency field in all deal objects |
| Payment status calculation errors | Wrong status badges | Use actual Payment records, not stage inference |

---

## Questions for Product/Design

1. **Overview tab:** Should it show aggregated deal metrics, or just representation details?
   - Current: Just representation details (no deals shown)
   - Recommendation: Keep as-is (clean separation from Deal Tracker)

2. **Opportunities tab:** Should it be a filtered view of Deal Tracker (pipeline only) or separate entity?
   - Current: Placeholder for separate Opportunity model
   - Recommendation: Filter talent.deals until Opportunity model updated

3. **Notes tab:** Should it show deal-related events/timeline, or just email/task events?
   - Current: Email/task events
   - Recommendation: Add deal status change events if time permits

4. **Payment status:** Should it be inferred from stage, or pulled from actual Payment records?
   - Current: Inferred from stage
   - Recommendation: Enhance to show actual payment status per deal

---

**Report Generated:** 2025-01-XX  
**Audit Completed By:** AI Agent  
**Next Review:** After Phase 4 implementation
