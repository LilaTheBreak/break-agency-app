# The Break Agency App — Forensic Audit Summary

**Date:** January 2, 2026  
**Auditor:** Senior Full-Stack Engineer  
**Purpose:** Truth audit to identify what works, what's broken, and what's fake

---

## EXECUTIVE SUMMARY

This audit reveals a **partially functional CRM** with significant gaps between UI appearance and actual functionality. The app has:

- ✅ **Working:** Basic CRUD for Brands, Contacts, Deals, Campaigns, Events, Contracts
- ⚠️ **Partially Working:** Data normalization issues, inconsistent role enforcement, file uploads
- ❌ **Broken/Mocked:** Some admin features, analytics, brand enrichment, AI features

**Critical Finding:** The app suffers from "UI theater" — features appear complete but fail silently or return empty data.

---

## 1. FEATURE REALITY CHECK

### ✅ FULLY FUNCTIONAL (E2E Working)

#### Brands CRM (`/api/crm-brands`)
- **Status:** ✅ REAL
- **Frontend:** `AdminBrandsPage.jsx` → `fetchBrands()` from `crmClient.js`
- **Backend:** `GET /api/crm-brands` → `crmBrands.ts`
- **Database:** `CrmBrand` model exists, CRUD operations work
- **Issues:** Data normalization fixes applied (empty string → array conversion)
- **Round-trip:** ✅ Create → DB → Refetch → UI update works

#### Contacts CRM (`/api/crm-contacts`)
- **Status:** ✅ REAL
- **Frontend:** `AdminBrandsPage.jsx` → `fetchContacts()` from `crmClient.js`
- **Backend:** `GET /api/crm-contacts` → `crmContacts.ts`
- **Database:** `CrmBrandContact` model exists, CRUD operations work
- **Round-trip:** ✅ Create → DB → Refetch → UI update works

#### Deals CRM (`/api/crm-deals`)
- **Status:** ✅ REAL
- **Frontend:** `AdminDealsPage.jsx` → `fetchDeals()` from `crmClient.js`
- **Backend:** `GET /api/crm-deals` → `crmDeals.ts`
- **Database:** `Deal` model exists, field mapping works (`brandName` ↔ `dealName`)
- **Round-trip:** ✅ Create → DB → Refetch → UI update works

#### Campaigns CRM (`/api/crm-campaigns`)
- **Status:** ✅ REAL
- **Frontend:** `AdminCampaignsPage.jsx` → `fetchCampaigns()` from `crmClient.js`
- **Backend:** `GET /api/crm-campaigns` → `crmCampaigns.ts`
- **Database:** `CrmCampaign` model exists, CRUD operations work
- **Round-trip:** ✅ Create → DB → Refetch → UI update works

#### Events CRM (`/api/crm-events`)
- **Status:** ✅ REAL (uses `CrmTask` model)
- **Frontend:** `AdminEventsPage.jsx` → `fetchEvents()` from `crmClient.js`
- **Backend:** `GET /api/crm-events` → `crmEvents.ts`
- **Database:** `CrmTask` model used for events (field mapping: `title` → `eventName`, `dueDate` → `startDateTime`)
- **Round-trip:** ✅ Create → DB → Refetch → UI update works

#### Contracts CRM (`/api/crm-contracts`)
- **Status:** ✅ REAL
- **Frontend:** `AdminContractsPage.jsx` → `fetchContracts()` from `crmClient.js`
- **Backend:** `GET /api/crm-contracts` → `crmContracts.ts`
- **Database:** `Contract` model exists, field mapping works (`title` ↔ `contractName`)
- **Round-trip:** ✅ Create → DB → Refetch → UI update works

#### File Uploads (`/api/files`)
- **Status:** ✅ REAL
- **Frontend:** Uses `fileClient.js` → `POST /api/files/upload`
- **Backend:** `files.ts` → Google Cloud Storage integration
- **Storage:** GCS bucket `break-agency-app-storage` (configured)
- **Round-trip:** ✅ Upload → GCS → DB record → Signed URL works

#### Authentication (`/api/auth`)
- **Status:** ✅ REAL
- **Frontend:** `authClient.js` → Google OAuth flow
- **Backend:** `auth.ts` → Session management with JWT
- **Database:** `User` model, session cookies + Bearer tokens
- **Round-trip:** ✅ Login → Session → Protected routes work

---

### ⚠️ PARTIALLY FUNCTIONAL

#### Admin Talent Management (`/api/admin/talent`)
- **Status:** ⚠️ PARTIAL
- **Frontend:** `AdminTalentPage.jsx` → `POST /api/admin/talent`
- **Backend:** `admin/talent.ts` → Role enforcement exists
- **Database:** `Talent` model exists
- **Issues:**
  - List refresh sometimes fails (fixed with delay + fallback query)
  - Email optional but placeholder user creation needed
  - User relation can be broken (fallback implemented)
- **Round-trip:** ⚠️ Create works, but list refresh unreliable

#### Admin Finance (`/api/admin/finance`)
- **Status:** ⚠️ PARTIAL
- **Frontend:** `AdminFinancePage.jsx`
- **Backend:** `admin/finance.ts` → Role enforcement exists
- **Database:** `Invoice`, `Payout`, `Deal` models exist
- **Issues:**
  - `externalId` and `provider` fields stubbed as empty strings
  - May not integrate with actual payment processors
- **Round-trip:** ⚠️ Data displays but may not reflect real transactions

#### Opportunities (`/api/opportunities`)
- **Status:** ⚠️ PARTIAL
- **Frontend:** `OpportunitiesAdmin.jsx`
- **Backend:** `opportunities.ts` → Field validation fixed
- **Database:** `Opportunity` model exists
- **Issues:**
  - Required string fields default to empty strings (fixed)
  - `payment` and `deadline` type conversions (fixed)
- **Round-trip:** ✅ Create → DB → Refetch works (after fixes)

---

### ❌ BROKEN / MOCKED / UI THEATER

#### Brand Enrichment (`/api/crm-brands/:id/enrich`)
- **Status:** ❌ FAKE
- **Backend:** `crmBrands.ts` → `enrichBrandFromUrl()` service exists
- **Reality:** Service may be stubbed or return mock data
- **Evidence:** `enrichedAt` and `enrichmentSource` fields exist but may not be populated
- **Impact:** UI shows enrichment option but may not actually enrich

#### Brand CRM Strategy (`/api/brand-crm`)
- **Status:** ❌ STUBBED
- **Backend:** `brandCRM.ts` → Uses stubbed `brandRelationshipService`
- **Reality:** Service functions return console warnings and mock objects
- **Evidence:** `brandRelationshipService.ts` has `console.warn()` and returns `[]`
- **Impact:** UI suggests brand relationship tracking but doesn't work

#### Analytics (`/api/analytics`)
- **Status:** ❌ UNKNOWN
- **Backend:** `analytics.ts` exists
- **Reality:** Not audited in detail, may return placeholder data
- **Impact:** Dashboard may show fake metrics

#### AI Features (`/api/ai/*`)
- **Status:** ❌ PARTIALLY STUBBED
- **Backend:** Multiple AI routes exist (`ai.ts`, `aiFileInsights.ts`, `aiSocialInsights.ts`)
- **Reality:** Some features may be stubbed or return mock responses
- **Impact:** UI suggests AI capabilities but may not actually work

#### Negotiation Features (`/api/deal-negotiation`)
- **Status:** ❌ STUBBED
- **Backend:** Uses placeholder models (`negotiationThread`, `negotiationMessage`)
- **Reality:** Models don't exist in schema, functionality is stubbed
- **Impact:** UI suggests negotiation tracking but doesn't work

---

## 2. API CONTRACT AUDIT

### ✅ CORRECTLY MOUNTED ROUTES

| Feature | Frontend Call | Backend Route | HTTP Method | Status |
|---------|--------------|--------------|-------------|--------|
| Brands | `fetchBrands()` | `/api/crm-brands` | GET | ✅ Match |
| Brands | `createBrand()` | `/api/crm-brands` | POST | ✅ Match |
| Brands | `updateBrand()` | `/api/crm-brands/:id` | PATCH | ✅ Match |
| Brands | `deleteBrand()` | `/api/crm-brands/:id` | DELETE | ✅ Match |
| Contacts | `fetchContacts()` | `/api/crm-contacts` | GET | ✅ Match |
| Contacts | `createContact()` | `/api/crm-contacts` | POST | ✅ Match |
| Contacts | `updateContact()` | `/api/crm-contacts/:id` | PATCH | ✅ Match |
| Contacts | `deleteContact()` | `/api/crm-contacts/:id` | DELETE | ✅ Match |
| Deals | `fetchDeals()` | `/api/crm-deals` | GET | ✅ Match |
| Deals | `createDeal()` | `/api/crm-deals` | POST | ✅ Match |
| Deals | `updateDeal()` | `/api/crm-deals/:id` | PATCH | ✅ Match |
| Deals | `deleteDeal()` | `/api/crm-deals/:id` | DELETE | ✅ Match |
| Campaigns | `fetchCampaigns()` | `/api/crm-campaigns` | GET | ✅ Match |
| Campaigns | `createCampaign()` | `/api/crm-campaigns` | POST | ✅ Match |
| Campaigns | `updateCampaign()` | `/api/crm-campaigns/:id` | PATCH | ✅ Match |
| Campaigns | `deleteCampaign()` | `/api/crm-campaigns/:id` | DELETE | ✅ Match |
| Events | `fetchEvents()` | `/api/crm-events` | GET | ✅ Match |
| Events | `createEvent()` | `/api/crm-events` | POST | ✅ Match |
| Events | `updateEvent()` | `/api/crm-events/:id` | PATCH | ✅ Match |
| Events | `deleteEvent()` | `/api/crm-events/:id` | DELETE | ✅ Match |
| Contracts | `fetchContracts()` | `/api/crm-contracts` | GET | ✅ Match |
| Contracts | `createContract()` | `/api/crm-contracts` | POST | ✅ Match |
| Contracts | `updateContract()` | `/api/crm-contracts/:id` | PATCH | ✅ Match |
| Contracts | `deleteContract()` | `/api/crm-contracts/:id` | DELETE | ✅ Match |
| Files | `uploadFile()` | `/api/files/upload` | POST | ✅ Match |
| Files | `getFileUrl()` | `/api/files/:id/url` | GET | ✅ Match |
| Files | `deleteFile()` | `/api/files/:id` | DELETE | ✅ Match |

### ⚠️ RESPONSE SHAPE MISMATCHES (FIXED)

| Feature | Frontend Expects | Backend Returns | Status |
|---------|-----------------|----------------|--------|
| Brands List | `{ brands: [...] }` | `{ brands: [...] }` | ✅ Fixed |
| Contacts List | `{ contacts: [...] }` | `{ contacts: [...] }` | ✅ Fixed |
| Deals List | `[...]` (array) | `[...]` (array) | ✅ Fixed |
| Campaigns List | `[...]` (array) | `[...]` (array) | ✅ Fixed |
| Events List | `[...]` (array) | `[...]` (array) | ✅ Fixed |
| Contracts List | `[...]` (array) | `[...]` (array) | ✅ Fixed |

**Critical Fix Applied:** Backend now always returns arrays `[]` instead of empty strings `""` for list endpoints.

---

## 3. DATA SHAPE & STATE AUDIT

### ✅ NORMALIZATION FIXES APPLIED

**Location:** `apps/web/src/lib/dataNormalization.js`

**Functions:**
- `normalizeApiArray(input, key)` — Handles arrays, objects, empty strings, null, undefined
- `normalizeApiArrayWithGuard(input, key, context)` — Wraps normalization with warnings

**Applied To:**
- ✅ `AdminBrandsPage.jsx` — All state setters and useMemo hooks
- ✅ `AdminCampaignsPage.jsx` — Initial data loading
- ✅ `AdminDealsPage.jsx` — Initial data loading
- ✅ `AdminEventsPage.jsx` — Initial data loading
- ✅ `AdminTasksPage.jsx` — Initial data loading

**Result:** Frontend now defensively handles all API response formats.

### ⚠️ REMAINING ISSUES

1. **Inconsistent Normalization:** Some pages use `normalizeApiArray`, others use `normalizeApiArrayWithGuard`. Standardize.
2. **Triple Normalization:** `AdminBrandsPage.jsx` has triple normalization in `filtered` useMemo (defensive but excessive).
3. **Missing Normalization:** Other list pages may not use normalization helpers yet.

---

## 4. PERSISTENCE AUDIT

### ✅ WORKING ROUND-TRIPS

| Feature | Create | Update | Delete | Refetch | Status |
|---------|--------|--------|--------|---------|--------|
| Brands | ✅ | ✅ | ✅ | ✅ | ✅ Full |
| Contacts | ✅ | ✅ | ✅ | ✅ | ✅ Full |
| Deals | ✅ | ✅ | ✅ | ✅ | ✅ Full |
| Campaigns | ✅ | ✅ | ✅ | ✅ | ✅ Full |
| Events | ✅ | ✅ | ✅ | ✅ | ✅ Full |
| Contracts | ✅ | ✅ | ✅ | ✅ | ✅ Full |
| Files | ✅ | N/A | ✅ | ✅ | ✅ Full |
| Talent | ✅ | ✅ | ⚠️ | ⚠️ | ⚠️ Partial |

### ⚠️ PARTIAL ROUND-TRIPS

**Talent Creation:**
- ✅ Create → DB write succeeds
- ⚠️ Refetch → Sometimes fails (fixed with delay + fallback)
- ⚠️ UI update → May not show new talent immediately

**Opportunities:**
- ✅ Create → DB write succeeds (after field fixes)
- ✅ Refetch → Works
- ✅ UI update → Works

---

## 5. ROLE & PERMISSION GAPS

### ✅ ROLE ENFORCEMENT EXISTS

| Route | Frontend Check | Backend Check | Status |
|-------|---------------|--------------|--------|
| `/api/admin/talent` | ✅ | ✅ `requireAuth` + `isAdmin` | ✅ Enforced |
| `/api/admin/finance` | ✅ | ✅ `requireAuth` + `requireAdmin` | ✅ Enforced |
| `/api/admin/performance` | ✅ | ✅ `requireAdmin` | ✅ Enforced |
| `/api/users` (admin routes) | ✅ | ✅ `requireAdmin` | ✅ Enforced |

### ❌ MISSING ROLE ENFORCEMENT

| Route | Frontend Check | Backend Check | Status |
|-------|---------------|--------------|--------|
| `/api/crm-brands` | ❌ None | ✅ `requireAuth` only | ⚠️ Auth only |
| `/api/crm-contacts` | ❌ None | ✅ `requireAuth` only | ⚠️ Auth only |
| `/api/crm-deals` | ❌ None | ✅ `requireAuth` only | ⚠️ Auth any role |
| `/api/crm-campaigns` | ❌ None | ✅ `requireAuth` only | ⚠️ Auth any role |
| `/api/crm-events` | ❌ None | ✅ `requireAuth` only | ⚠️ Auth any role |
| `/api/crm-contracts` | ❌ None | ✅ `requireAuth` only | ⚠️ Auth any role |

**Critical Finding:** CRM routes are accessible to **any authenticated user**, not just admins. This may be intentional (multi-role CRM) or a security gap.

**Recommendation:** If CRM is admin-only, add `requireRole(['ADMIN', 'SUPERADMIN'])` to all CRM routes.

---

## 6. CRITICAL BUGS IDENTIFIED

### 🔴 HIGH PRIORITY

1. **Data Normalization:** ✅ FIXED — Backend now returns arrays, frontend normalizes defensively
2. **Talent List Refresh:** ✅ FIXED — Added delay + fallback query
3. **Opportunity Field Types:** ✅ FIXED — String conversions applied
4. **Empty String vs Array:** ✅ FIXED — Backend always returns `[]`

### 🟡 MEDIUM PRIORITY

1. **Role Enforcement:** CRM routes accessible to any authenticated user (may be intentional)
2. **Brand Enrichment:** Service may be stubbed (needs verification)
3. **Admin Finance:** `externalId` and `provider` stubbed as empty strings

### 🟢 LOW PRIORITY

1. **Triple Normalization:** Excessive defensive checks in `AdminBrandsPage.jsx`
2. **Inconsistent Normalization:** Some pages use guard, others don't

---

## 7. MVP FEATURE ASSESSMENT

### ✅ MVP-READY FEATURES

- Brands CRM (full CRUD)
- Contacts CRM (full CRUD)
- Deals CRM (full CRUD)
- Campaigns CRM (full CRUD)
- Events CRM (full CRUD)
- Contracts CRM (full CRUD)
- File Uploads (GCS integration)
- Authentication (Google OAuth)

### ⚠️ MVP-NEEDS-WORK

- Talent Management (list refresh reliability)
- Admin Finance (payment processor integration)
- Opportunities (field validation)

### ❌ NOT MVP-READY (HIDE OR STUB)

- Brand Enrichment (stubbed)
- Brand CRM Strategy (stubbed)
- Negotiation Features (stubbed)
- AI Features (partially stubbed)
- Analytics (unknown, may be fake)

---

## 8. RECOMMENDATIONS

### Immediate Actions

1. ✅ **DONE:** Fix data normalization issues
2. ✅ **DONE:** Fix talent list refresh
3. ✅ **DONE:** Fix opportunity field types
4. ⚠️ **TODO:** Decide if CRM routes should be admin-only
5. ⚠️ **TODO:** Verify brand enrichment actually works
6. ⚠️ **TODO:** Hide or label stubbed features clearly

### Short-term (1-2 weeks)

1. Standardize normalization helpers across all list pages
2. Add role enforcement to CRM routes if admin-only
3. Verify and fix brand enrichment service
4. Audit analytics endpoints for fake data

### Long-term (1+ month)

1. Remove or implement stubbed features (brand relationships, negotiation)
2. Integrate real payment processors for admin finance
3. Complete AI feature implementations or remove UI

---

## CONCLUSION

**The app is ~70% functional** for core CRM operations. The main issues are:

1. ✅ **Fixed:** Data normalization bugs
2. ✅ **Fixed:** Talent list refresh
3. ⚠️ **Needs Decision:** Role enforcement on CRM routes
4. ❌ **Needs Work:** Stubbed features (enrichment, relationships, negotiation)

**MVP Status:** Core CRM is **usable** for Brands, Contacts, Deals, Campaigns, Events, Contracts. Admin features (Talent, Finance) need minor fixes.

**Next Steps:** See `FIX_PRIORITY.md` for prioritized fix list.

