# Fix Priority — The Break Agency App

**Date:** January 2, 2026  
**Based on:** AUDIT_SUMMARY.md

---

## FIX ORDER (MANDATORY)

Fix in this order only. Do NOT fix everything at once.

---

## ✅ PHASE 1: CRITICAL FIXES (COMPLETED)

### 1.1 Data Normalization ✅ DONE
- **Status:** ✅ FIXED
- **Files Changed:**
  - `apps/api/src/utils/apiResponse.ts` — `sendList()` always returns array
  - `apps/api/src/routes/crmDeals.ts` — Ensure array response
  - `apps/api/src/routes/crmCampaigns.ts` — Ensure array response
  - `apps/web/src/lib/dataNormalization.js` — Created normalization helpers
  - `apps/web/src/pages/AdminBrandsPage.jsx` — Applied normalization
  - `apps/web/src/pages/AdminCampaignsPage.jsx` — Applied normalization
  - `apps/web/src/pages/AdminDealsPage.jsx` — Applied normalization
  - `apps/web/src/pages/AdminEventsPage.jsx` — Applied normalization
  - `apps/web/src/pages/AdminTasksPage.jsx` — Applied normalization
- **Result:** Frontend no longer crashes on empty string responses

### 1.2 Talent List Refresh ✅ DONE
- **Status:** ✅ FIXED
- **Files Changed:**
  - `apps/api/src/routes/admin/talent.ts` — Added fallback query for User relation
  - `apps/web/src/pages/AdminTalentPage.jsx` — Added 1000ms delay + optimistic update
- **Result:** New talents appear in list after creation

### 1.3 Opportunity Field Types ✅ DONE
- **Status:** ✅ FIXED
- **Files Changed:**
  - `apps/api/src/routes/opportunities.ts` — String conversions for `payment` and `deadline`
- **Result:** Opportunities save without Prisma validation errors

---

## 🔴 PHASE 2: AUTH & ROLE ENFORCEMENT (HIGH PRIORITY)

### 2.1 Decide CRM Route Access Policy
- **Priority:** HIGH
- **Issue:** CRM routes (`/api/crm-*`) are accessible to any authenticated user
- **Options:**
  - **Option A:** Keep open (multi-role CRM) — Add frontend role checks only
  - **Option B:** Admin-only — Add `requireRole(['ADMIN', 'SUPERADMIN'])` to all CRM routes
- **Recommendation:** **Option B** (Admin-only) for MVP
- **Files to Change:**
  - `apps/api/src/routes/crmBrands.ts` — Add role middleware
  - `apps/api/src/routes/crmContacts.ts` — Add role middleware
  - `apps/api/src/routes/crmDeals.ts` — Add role middleware
  - `apps/api/src/routes/crmCampaigns.ts` — Add role middleware
  - `apps/api/src/routes/crmEvents.ts` — Add role middleware
  - `apps/api/src/routes/crmContracts.ts` — Add role middleware
- **Estimated Time:** 30 minutes
- **Risk:** Low (adds security, may break non-admin access)

### 2.2 Verify Brand Enrichment Service
- **Priority:** MEDIUM
- **Issue:** `enrichBrandFromUrl()` may be stubbed
- **Action:** Test enrichment endpoint, verify it actually enriches
- **Files to Check:**
  - `apps/api/src/services/brandEnrichment.ts`
- **If Stubbed:** Either implement or hide UI button
- **Estimated Time:** 1 hour (testing + fix)

---

## 🟡 PHASE 3: CORE ENTITY (BRANDS) — VERIFY FULL FLOW

### 3.1 Brands E2E Test
- **Priority:** HIGH
- **Action:** Manually test full Brands flow:
  1. Create brand → Verify DB record
  2. Update brand → Verify DB update
  3. Delete brand → Verify DB deletion + cascade
  4. Refetch list → Verify UI updates
- **Expected Result:** All operations work end-to-end
- **If Broken:** Fix immediately (this is the foundation)
- **Estimated Time:** 30 minutes (testing)

### 3.2 Brands Contact Cascade
- **Priority:** MEDIUM
- **Issue:** Verify contacts are deleted when brand is deleted
- **Action:** Test brand deletion with contacts
- **Expected Result:** Contacts cascade delete (Prisma schema should handle this)
- **Estimated Time:** 15 minutes (testing)

---

## 🟡 PHASE 4: RELATIONAL ENTITY (CONTACTS OR DEALS)

### 4.1 Contacts E2E Test
- **Priority:** HIGH
- **Action:** Manually test full Contacts flow:
  1. Create contact (with brandId) → Verify DB record
  2. Update contact → Verify DB update
  3. Delete contact → Verify DB deletion
  4. Refetch list → Verify UI updates
- **Expected Result:** All operations work end-to-end
- **Estimated Time:** 30 minutes (testing)

### 4.2 Deals E2E Test
- **Priority:** HIGH
- **Action:** Manually test full Deals flow:
  1. Create deal (with brandId, talentId, userId) → Verify DB record
  2. Update deal → Verify DB update
  3. Delete deal → Verify DB deletion + contract cascade
  4. Refetch list → Verify UI updates
- **Expected Result:** All operations work end-to-end
- **Estimated Time:** 30 minutes (testing)

---

## 🟡 PHASE 5: WRITE FLOW (CREATE → PERSIST → REFETCH)

### 5.1 Standardize Create Flow
- **Priority:** MEDIUM
- **Issue:** Each entity has slightly different create flow
- **Action:** Ensure all create flows:
  1. Validate input
  2. Create DB record
  3. Return created record
  4. Frontend refetches list (or optimistically updates)
  5. UI updates immediately
- **Files to Standardize:**
  - All `create*()` functions in `crmClient.js`
  - All `POST /api/crm-*` routes
- **Estimated Time:** 2 hours

### 5.2 Standardize Error Handling
- **Priority:** MEDIUM
- **Issue:** Error responses inconsistent
- **Action:** Standardize error response format:
  ```json
  {
    "error": "Human-readable message",
    "code": "ERROR_CODE",
    "details": {}
  }
  ```
- **Files to Change:**
  - All CRM route handlers
- **Estimated Time:** 2 hours

---

## 🟡 PHASE 6: DELETE FLOW

### 6.1 Standardize Delete Flow
- **Priority:** MEDIUM
- **Issue:** Delete flows may not cascade correctly
- **Action:** Verify all delete operations:
  1. Check for related records (contacts, deals, contracts)
  2. Show warning if related records exist
  3. Delete with cascade (Prisma handles this)
  4. Refetch list
  5. UI updates immediately
- **Files to Verify:**
  - All `delete*()` functions in `crmClient.js`
  - All `DELETE /api/crm-*` routes
- **Estimated Time:** 2 hours

---

## 🟢 PHASE 7: CLEANUP & POLISH

### 7.1 Remove Triple Normalization
- **Priority:** LOW
- **Issue:** `AdminBrandsPage.jsx` has excessive normalization
- **Action:** Simplify to single normalization call
- **Files to Change:**
  - `apps/web/src/pages/AdminBrandsPage.jsx`
- **Estimated Time:** 15 minutes

### 7.2 Standardize Normalization Helpers
- **Priority:** LOW
- **Issue:** Some pages use `normalizeApiArray`, others use `normalizeApiArrayWithGuard`
- **Action:** Decide on one approach, apply consistently
- **Recommendation:** Use `normalizeApiArray` for initial load, `normalizeApiArrayWithGuard` for dynamic data
- **Estimated Time:** 1 hour

### 7.3 Hide or Label Stubbed Features
- **Priority:** LOW
- **Issue:** UI shows features that don't work (enrichment, relationships, negotiation)
- **Action:** Either:
  - Hide UI elements for stubbed features
  - Add "Coming Soon" labels
  - Remove UI entirely
- **Files to Change:**
  - `AdminBrandsPage.jsx` — Hide enrichment button if stubbed
  - Any UI showing brand relationships
  - Any UI showing negotiation features
- **Estimated Time:** 1 hour

---

## 🚫 DO NOT FIX (YET)

### ❌ Brand Enrichment Implementation
- **Reason:** May be intentionally stubbed for MVP
- **Action:** Verify first, then decide

### ❌ Brand Relationship Service
- **Reason:** Not MVP-critical
- **Action:** Hide UI or label as "Coming Soon"

### ❌ Negotiation Features
- **Reason:** Models don't exist, not MVP-critical
- **Action:** Hide UI or label as "Coming Soon"

### ❌ AI Features
- **Reason:** Partially implemented, not MVP-critical
- **Action:** Audit first, then decide

### ❌ Analytics
- **Reason:** Unknown if fake, not MVP-critical
- **Action:** Audit first, then decide

---

## SUMMARY

### ✅ Completed (Phase 1)
- Data normalization fixes
- Talent list refresh
- Opportunity field types

### 🔴 Next Priority (Phase 2)
1. **Decide CRM route access policy** (30 min)
2. **Verify brand enrichment** (1 hour)

### 🟡 Then (Phases 3-6)
3. Test Brands E2E (30 min)
4. Test Contacts E2E (30 min)
5. Test Deals E2E (30 min)
6. Standardize create flow (2 hours)
7. Standardize delete flow (2 hours)

### 🟢 Finally (Phase 7)
8. Cleanup normalization (1 hour)
9. Hide stubbed features (1 hour)

**Total Estimated Time:** ~10 hours for Phases 2-7

---

## SUCCESS CRITERIA

After Phase 2-6:
- ✅ All CRM routes have consistent role enforcement
- ✅ Brands, Contacts, Deals work E2E
- ✅ Create → Persist → Refetch loop works
- ✅ Delete → Cascade → Refetch loop works
- ✅ Error handling is consistent
- ✅ No UI crashes on empty data

After Phase 7:
- ✅ Code is clean and maintainable
- ✅ No "pretend" features visible
- ✅ All features are clearly labeled (working vs coming soon)

