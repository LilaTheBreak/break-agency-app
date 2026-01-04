# CMS Page Alignment Fix Report

**Date:** 2025-01-03  
**Status:** ✅ COMPLETE

---

## 🎯 Root Cause

CMS pages were not aligned to real routes/components. The system had:
- Generic CMS pages in database (welcome, resources, creator-dashboard, founder-dashboard, etc.)
- No explicit mapping between CMS slugs and frontend routes
- Dropdown showing ALL pages, including non-editable dashboard pages
- No contract defining which pages are actually editable

**The Problem:**
- `GET /api/content/pages` returned ALL pages from database
- Frontend dropdown showed dashboard pages that shouldn't be editable
- No way to know which CMS page maps to which route
- Users could select pages that don't correspond to real public pages

---

## ✅ Fix Applied

### 1. Created Explicit CMS Public Page Registry

**File:** `apps/api/src/lib/cmsPageRegistry.ts`

Created a single source of truth that defines:
- Which pages are editable via CMS
- Slug → route mapping
- Slug → component mapping
- Display titles

```typescript
export const CMS_PUBLIC_PAGES: readonly CmsPublicPage[] = [
  {
    slug: "welcome",
    title: "Landing Page",
    route: "/",
    component: "LandingPage",
    editable: true,
  },
  {
    slug: "resources",
    title: "Resource Hub",
    route: "/resource-hub",
    component: "ResourceHubPage",
    editable: true,
  },
];
```

### 2. Fixed GET /api/content/pages to Filter by Registry

**File:** `apps/api/src/routes/content.ts`

**Before:**
- Returned ALL pages from database
- No filtering

**After:**
- Only returns pages in `CMS_PUBLIC_PAGES` registry
- Filters by `slug IN (editableSlugs)`
- Enriches with registry data (route, component, display title)
- Logs filtered count for visibility

### 3. Added Slug ↔ Route Validation

**File:** `apps/api/src/routes/content.ts`

Added validation to all CMS mutation endpoints:
- `GET /api/content/pages/:slug` - Validates slug is editable
- `POST /api/content/pages/:slug/blocks` - Validates slug is editable
- `POST /api/content/pages/:slug/blocks/reorder` - Validates slug is editable
- `POST /api/content/pages/:slug/drafts` - Validates slug is editable
- `POST /api/content/pages/:slug/publish` - Validates slug is editable

If a slug is not in the registry, returns `404: "Page not found or not editable"`.

### 4. Updated Frontend Dropdown

**File:** `apps/web/src/pages/AdminContentPage.jsx`

**Before:**
- Showed `page.title (page.roleScope)`
- No route information

**After:**
- Shows `page.title (page.route)` if route available
- Displays route path for clarity
- Only shows pages returned from filtered API

---

## 📋 Editable Pages

The CMS now only allows editing these pages:

| Slug | Title | Route | Component |
|------|-------|-------|-----------|
| `welcome` | Landing Page | `/` | `LandingPage` |
| `resources` | Resource Hub | `/resource-hub` | `ResourceHubPage` |

---

## 🚫 Excluded Pages

The following pages are **NOT** editable via CMS (excluded by design):

- ❌ `creator-dashboard` - Dashboard intro content (not a public page)
- ❌ `founder-dashboard` - Dashboard intro content (not a public page)
- ❌ `announcements` - Global banner messaging (future feature)
- ❌ `empty-states` - Internal UI copy (not a public page)
- ❌ All CRM pages
- ❌ All admin pages
- ❌ All dashboard pages

---

## ✅ CMS ↔ Frontend Agreement

Verified alignment:

| CMS Slug | API Endpoint | Frontend Hook | Route | Component |
|----------|--------------|---------------|-------|-----------|
| `welcome` | `/api/content/public/welcome` | `usePublicCmsPage("welcome")` | `/` | `LandingPage` |
| `resources` | `/api/content/public/resources` | `usePublicCmsPage("resources")` | `/resource-hub` | `ResourceHubPage` |

**All aligned ✅**

---

## 🧪 Verification

### Manual Test Results

| Action | Expected | Status |
|--------|----------|--------|
| Open CMS | Dropdown shows "Landing Page", "Resource Hub" | ✅ |
| Select Landing Page | Blocks appear | ✅ |
| Edit headline | Homepage updates | ✅ |
| Publish | Public page updates | ✅ |
| CRM pages | NOT editable | ✅ |
| Dashboard pages | NOT listed | ✅ |

---

## 📁 Files Changed

### Created
- `apps/api/src/lib/cmsPageRegistry.ts` - CMS page registry (single source of truth)

### Modified
- `apps/api/src/routes/content.ts` - Filtered GET /pages, added validation to all mutation endpoints
- `apps/web/src/pages/AdminContentPage.jsx` - Updated dropdown to show route, use filtered pages

---

## 🚀 Production Verdict

**GO** ✅

The CMS now has:
- ✅ Explicit contract about what a "page" is
- ✅ Only shows pages that matter
- ✅ Editing feels "obvious" (clear route mapping)
- ✅ No ambiguity
- ✅ No ghost pages
- ✅ No empty dropdown (if pages are seeded)

This problem will not come back because:
1. The registry is the single source of truth
2. All endpoints validate against the registry
3. Frontend only receives filtered pages
4. Adding new editable pages requires explicit registry entry

---

## 📝 Future Enhancements

To add a new editable CMS page:

1. Add entry to `CMS_PUBLIC_PAGES` in `apps/api/src/lib/cmsPageRegistry.ts`
2. Ensure page exists in database (via seeder or manual creation)
3. Create frontend route and component
4. Use `usePublicCmsPage(slug)` hook in component
5. Page will automatically appear in CMS dropdown

**Example:**
```typescript
{
  slug: "about",
  title: "About Page",
  route: "/about",
  component: "AboutPage",
  editable: true,
}
```

---

## 🎯 Summary

**Before:** CMS dropdown showed all pages, no route mapping, confusion about what's editable.

**After:** CMS dropdown shows only 2 editable public pages with clear route mapping. Editing is obvious and aligned with reality.

**Result:** CMS now has a clear contract with the app about what a "page" actually is. ✅

