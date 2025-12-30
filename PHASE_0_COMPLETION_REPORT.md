# Phase 0: Remove Broken Endpoints - Completion Report

**Date:** 2025-01-02  
**Status:** ✅ Complete

---

## Summary

All broken, placeholder, and stub endpoints have been removed or updated to return `410 Gone` with clear error messages. No `501` responses remain. No stub providers. No fake data.

---

## Features Removed vs Implemented

### ❌ Removed (Return 410 Gone)

| Feature | Endpoints | Reason | UI Status |
|---------|-----------|--------|-----------|
| **Briefs API** | `/api/briefs/*` (all routes) | BrandBrief model doesn't exist | `briefVersionsClient.js` throws errors |
| **Xero Integration** | `/api/admin/finance/xero/*` (all routes) | No real Xero API integration | UI gated with `XERO_INTEGRATION_ENABLED: false`, connection UI removed |
| **E-Signature** | `/api/contracts/:id/sign/talent`, `/api/contracts/:id/sign/brand` | Stub providers (fake envelopeIds) | UI gated with `CONTRACT_SIGNING_ENABLED: false` |
| **Outreach Leads** | `/api/outreach/leads` | Not implemented | No UI found |
| **Weekly Reports** | `/api/insights/:userId/weekly` | CreatorWeeklyReport model doesn't exist | UI updated to show "not available" message |
| **Contract Upload** | `/api/contracts/:id/upload` | Not implemented | Was 501, now 410 |

### ✅ Kept (Functional)

| Feature | Endpoints | Status |
|---------|-----------|--------|
| **Opportunities** | `/api/opportunities/*` | ✅ Fully functional (alternative to briefs) |
| **Contracts CRUD** | `/api/contracts` (list, create, update, delete) | ✅ Fully functional |
| **Contract Send** | `/api/contracts/:id/send` | ✅ Functional (manual tracking) |
| **Insights** | `/api/insights/:userId` | ✅ Functional (weekly reports removed) |

---

## Endpoint Changes

### Briefs API (`/api/briefs/*`)

**Before:**
- `GET /api/briefs` → 501 "Briefs feature not implemented"
- `POST /api/briefs/ingest` → Called `ingestBrief` which threw error
- `GET /api/briefs/:id` → 501 "Briefs feature not implemented"
- `GET /api/briefs/:id/matches` → 501 "Brief matches feature not implemented"

**After:**
- All routes → 410 "Briefs feature removed" with alternative `/api/opportunities`
- `briefVersionsClient.js` → Throws errors with clear message

### Xero Integration (`/api/admin/finance/xero/*`)

**Before:**
- `GET /xero/status` → Read from DB (no real integration)
- `POST /xero/connect` → Saved to DB (no real integration)
- `POST /xero/sync` → Placeholder (only updated timestamp)
- `GET /xero/invoice/:id` → Placeholder message

**After:**
- All routes → 410 "Xero integration removed"
- `financeClient.js` → Functions throw errors
- UI → Removed connection UI, shows `DisabledNotice` only

### E-Signature (`/api/contracts/:id/sign/*`)

**Before:**
- `POST /api/contracts/:id/sign/talent` → Used stub provider (fake envelopeId)
- `POST /api/contracts/:id/sign/brand` → Used stub provider (fake envelopeId)

**After:**
- Both routes → 410 "E-signature feature removed" (stub providers)
- UI → Gated with `CONTRACT_SIGNING_ENABLED: false`

### Outreach Leads (`/api/outreach/leads`)

**Before:**
- `GET /api/outreach/leads` → Placeholder message

**After:**
- Route → 410 "Outreach Leads feature removed"
- No UI found (not used)

### Weekly Reports (`/api/insights/:userId/weekly`)

**Before:**
- `GET /api/insights/:userId/weekly` → 501 "Weekly reports feature not implemented"

**After:**
- Route → 410 "Weekly reports feature removed"
- UI → Removed weekly reports call, shows "not available" message

### Contract Upload (`/api/contracts/:id/upload`)

**Before:**
- `POST /api/contracts/:id/upload` → 501 "Not implemented"

**After:**
- Route → 410 "Contract upload endpoint removed"
- Alternative: Use `/api/files/upload` then link manually

---

## Files Changed

### Backend Routes
- `apps/api/src/routes/briefs.ts` - All routes return 410
- `apps/api/src/routes/admin/finance.ts` - Xero routes return 410
- `apps/api/src/routes/contracts.ts` - Sign routes return 410
- `apps/api/src/routes/outreachLeads.ts` - Returns 410
- `apps/api/src/routes/insights.ts` - Weekly reports route returns 410
- `apps/api/src/controllers/contractController.ts` - Upload endpoint returns 410
- `apps/api/src/routes/dealIntelligence.ts` - Returns 410
- `apps/api/src/controllers/socialController.ts` - All routes return 410

### Frontend
- `apps/web/src/services/briefVersionsClient.js` - Functions throw errors
- `apps/web/src/services/financeClient.js` - Xero functions throw errors
- `apps/web/src/pages/AdminFinancePage.jsx` - Removed Xero connection UI, removed sync button
- `apps/web/src/pages/CreatorInsights.jsx` - Removed weekly reports call
- `apps/web/src/components/VersionHistoryCard.jsx` - Updated to handle briefs removal

---

## Verification

### ✅ No 501 Responses
- All previously 501 endpoints now return 410
- Contract upload was 501, now 410

### ✅ No Stub Providers
- E-signature stub providers removed from routes
- Routes return 410 instead of calling stubs

### ✅ No Fake Data
- No fake envelopeIds
- No placeholder syncs
- No fake status responses

### ✅ All Broken Features Gated
- Briefs: Client throws errors
- Xero: UI gated with `XERO_INTEGRATION_ENABLED: false`
- E-signature: UI gated with `CONTRACT_SIGNING_ENABLED: false`
- Weekly reports: UI shows "not available"
- Outreach leads: No UI found (not used)

---

## Acceptance Criteria Met

✅ **No 501 responses in production** - All changed to 410  
✅ **No stub providers** - E-signature routes removed  
✅ **No fake envelopeIds or placeholder syncs** - All removed  
✅ **All broken features are gated or removed** - UI gated or removed  

---

## Next Steps

1. **Briefs**: If needed, implement BrandBrief model or remove UI references
2. **Xero**: Implement real Xero API integration or remove all references
3. **E-Signature**: Implement real providers (DocuSign/HelloSign) or remove all references
4. **Weekly Reports**: Implement CreatorWeeklyReport model or remove UI
5. **Contract Upload**: Implement file upload or remove UI

---

**Phase 0 Status:** ✅ Complete - All broken endpoints removed or gated

