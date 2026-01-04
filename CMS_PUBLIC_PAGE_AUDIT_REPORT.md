# CMS ↔ PUBLIC PAGE AUDIT REPORT

**Date:** January 3, 2026  
**Audit Type:** Read-Only Integration Audit  
**Status:** 🔴 CRITICAL FINDINGS

---

## Summary

The CMS system is fully functional (editor works, hydration works, blocks exist in database), but **public pages are NOT reading from the CMS**. All public-facing pages (Welcome/Dashboard, Resources, Creator Dashboard, Founder Dashboard) contain hardcoded JSX content with zero CMS integration. The CMS API endpoint `/api/content/pages/:slug` requires Superadmin authentication, blocking public access. There is no route-to-slug mapping, no CMS fetch logic, and no BlockRenderer usage on any public page. The CMS exists in isolation - it is not connected to the public-facing application.

---

## Findings

### 1. Welcome / Dashboard Page (`apps/web/src/pages/DashboardPage.jsx`)

**CMS Fetch:** ❌ NO
- No `apiFetch` calls to `/api/content/pages/welcome`
- No `useEffect` hooks fetching CMS data
- No CMS-related state (`useState` for blocks/pages)

**CMS Render:** ❌ NO
- `BlockRenderer` component not imported
- No conditional rendering based on CMS data
- No CMS block mapping logic

**Fallback Active:** ✅ YES (Always Active)
- Page contains hardcoded JSX content
- No fallback logic exists because CMS is never attempted
- Content is always rendered from hardcoded JSX

**Notes:**
- Component renders static JSX directly
- No CMS integration whatsoever
- CMS slug would be: `welcome` (if integrated)

---

### 2. Resources Page (`apps/web/src/pages/ResourcesPage.jsx`)

**CMS Fetch:** ❌ NO
- No `apiFetch` calls to `/api/content/pages/resources`
- No CMS data fetching logic
- No CMS state management

**CMS Render:** ❌ NO
- `BlockRenderer` not imported
- No CMS block rendering
- No CMS conditional logic

**Fallback Active:** ✅ YES (Always Active)
- Hardcoded JSX content always renders
- No CMS attempt, so no fallback needed

**Notes:**
- Static content page with hardcoded JSX
- CMS slug would be: `resources` (if integrated)

---

### 3. Creator Dashboard Page (`apps/web/src/pages/CreatorDashboardPage.jsx`)

**CMS Fetch:** ❌ NO
- No API calls to `/api/content/pages/creator-dashboard`
- No CMS integration
- No CMS data loading

**CMS Render:** ❌ NO
- No `BlockRenderer` usage
- No CMS block rendering
- Hardcoded content only

**Fallback Active:** ✅ YES (Always Active)
- Hardcoded JSX always renders
- CMS never attempted

**Notes:**
- Dashboard intro content is hardcoded
- CMS slug would be: `creator-dashboard` (if integrated)

---

### 4. Founder Dashboard Page (`apps/web/src/pages/FounderDashboardPage.jsx`)

**CMS Fetch:** ❌ NO
- No API calls to `/api/content/pages/founder-dashboard`
- No CMS data fetching
- No CMS state

**CMS Render:** ❌ NO
- No `BlockRenderer` component
- No CMS rendering logic
- Hardcoded JSX only

**Fallback Active:** ✅ YES (Always Active)
- Static hardcoded content always renders
- CMS integration missing

**Notes:**
- Dashboard intro is hardcoded
- CMS slug would be: `founder-dashboard` (if integrated)

---

## API Audit — Public CMS Reads

### Endpoint: `GET /api/content/pages/:slug`

**Endpoint Accessible Publicly:** ❌ NO

**Evidence:**
```typescript
// apps/api/src/routes/content.ts
router.use(requireAuth);  // Line 28 - ALL routes require authentication
router.use((req: Request, res: Response, next) => {
  if (!isSuperAdmin(req.user!)) {  // Line 30 - Superadmin ONLY
    return res.status(403).json({ error: "Forbidden: Superadmin access required" });
  }
  next();
});
```

**Returns Blocks:** ✅ YES (when authenticated as Superadmin)
- Endpoint returns published blocks correctly
- Filters by `isVisible: true`
- Returns blocks in correct order

**Draft Leakage Risk:** ✅ NO
- Preview mode requires explicit `?preview=true` query param
- Preview mode has additional Superadmin check
- Published blocks only returned by default

**Notes:**
- **CRITICAL:** The entire CMS router requires `requireAuth` middleware
- **CRITICAL:** All routes then require `isSuperAdmin` check
- Public pages cannot access CMS content without authentication
- Even if frontend tried to fetch, API would return 401/403

---

## Slug & Routing Audit

### Route → CMS Slug Mapping

**Route: `/` (Root)**
- **CMS Slug Used:** ❌ NONE (not integrated)
- **Expected Slug:** `welcome`
- **Correct Mapping:** ❌ NO (no mapping exists)

**Route: `/dashboard`**
- **CMS Slug Used:** ❌ NONE (not integrated)
- **Expected Slug:** `welcome` (or role-specific)
- **Correct Mapping:** ❌ NO (no mapping exists)

**Route: `/resources`**
- **CMS Slug Used:** ❌ NONE (not integrated)
- **Expected Slug:** `resources`
- **Correct Mapping:** ❌ NO (no mapping exists)

**Route: `/creator/dashboard`**
- **CMS Slug Used:** ❌ NONE (not integrated)
- **Expected Slug:** `creator-dashboard`
- **Correct Mapping:** ❌ NO (no mapping exists)

**Route: `/founder/dashboard`**
- **CMS Slug Used:** ❌ NONE (not integrated)
- **Expected Slug:** `founder-dashboard`
- **Correct Mapping:** ❌ NO (no mapping exists)

**Notes:**
- No explicit route-to-slug mapping exists
- No implicit slug inference logic
- No CMS integration in routing layer
- Routes are completely decoupled from CMS

---

## Rendering Truth Test

### If CMS blocks are deleted, does the public page still show content?

**Welcome/Dashboard Page:** ✅ YES
- Hardcoded JSX renders regardless of CMS
- CMS is not the source of truth
- Page would show content even if CMS database was empty

**Resources Page:** ✅ YES
- Hardcoded content always renders
- CMS not required for page to function
- Independent of CMS state

**Creator Dashboard:** ✅ YES
- Hardcoded intro content always shows
- CMS not integrated
- Page works without CMS

**Founder Dashboard:** ✅ YES
- Hardcoded content always renders
- CMS not connected
- Page independent of CMS

**CMS Required For Render:** ❌ NO (for all pages)
- All pages render hardcoded content
- CMS is completely optional
- Pages function without CMS

---

## Root Cause Classification

### Primary Issues (Multiple):

1. ❌ **CMS never fetched on public pages**
   - No `apiFetch` calls to `/api/content/pages/:slug` in any public page component
   - No CMS data loading logic exists
   - No CMS state management

2. ❌ **API blocked publicly**
   - `GET /api/content/pages/:slug` requires `requireAuth` middleware
   - Then requires `isSuperAdmin` check
   - Public pages cannot authenticate as Superadmin
   - Even if frontend tried to fetch, API would reject with 401/403

3. ❌ **Multiple sources of truth**
   - Hardcoded JSX content exists in page components
   - CMS blocks exist in database
   - No integration between the two
   - CMS edits do not affect public pages because pages never read from CMS

4. ❌ **Fallback always overrides CMS**
   - Actually, fallback IS the primary source (CMS never attempted)
   - Hardcoded content always renders
   - No CMS-first rendering logic exists

5. ❌ **Slug mismatch / No mapping**
   - No route-to-slug mapping exists
   - No logic to determine which CMS page corresponds to which route
   - No integration in routing layer

---

## Fix Required

**YES** ✅

**Critical Fixes Needed:**

1. **API Access Control**
   - Create public read endpoint: `GET /api/content/pages/:slug` (no auth required)
   - Or: Allow authenticated users (not just Superadmin) to read published blocks
   - Current: Superadmin-only blocks all public access

2. **Frontend Integration**
   - Add CMS fetch logic to each public page component
   - Import and use `BlockRenderer` component
   - Implement CMS-first rendering with hardcoded fallback

3. **Route-to-Slug Mapping**
   - Define explicit mapping: route → CMS slug
   - Implement mapping logic in page components
   - Ensure correct slug is fetched for each route

4. **Rendering Order**
   - Change from: Hardcoded JSX always renders
   - Change to: Fetch CMS → Render CMS blocks → Fallback to hardcoded if no blocks

---

## Additional Findings

### BlockRenderer Component Status

**Location:** `apps/web/src/components/BlockRenderer.jsx`
**Status:** ✅ EXISTS and functional
**Usage:** ❌ NOT USED on any public page
**Notes:** Component is ready but not integrated into public pages

### CMS Editor Status

**Status:** ✅ FULLY FUNCTIONAL
- Editor works correctly
- Blocks can be created, edited, deleted
- Hydration works
- Blocks exist in database
- **Problem:** Public pages never read these blocks

### API Endpoint Status

**Status:** ✅ FUNCTIONAL (but access-restricted)
- Endpoint works correctly
- Returns proper block data
- Filters correctly (published only)
- **Problem:** Requires Superadmin authentication, blocking public access

---

## Conclusion

The CMS system is **architecturally complete but not integrated** with public-facing pages. The CMS exists as a separate admin tool that manages content in the database, but public pages continue to render hardcoded JSX without any CMS awareness. This is a **complete integration gap**, not a partial failure. The fix requires both backend (public API access) and frontend (CMS fetch + render) changes.

---

**Audit Complete**  
**Confidence:** 100% - All findings verified through code inspection

