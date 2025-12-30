# Contacts CRM Audit Report

**Date:** 2025-01-02  
**Status:** Audit Complete - Implementation Required

## Executive Summary

The Contacts system has a **solid backend foundation** but is **incomplete as a standalone CRM surface**. Contacts currently exist only as sub-entities of Brands, with no dedicated management interface. The system needs significant enhancements to function as a true "people database" for agency workflows.

## What Currently Works ✅

### 1. Backend API Foundation
- **Location:** `apps/api/src/routes/crmContacts.ts`
- **Routes:**
  - `GET /api/crm-contacts` - List all contacts (with optional brandId filter)
  - `GET /api/crm-contacts/:id` - Get single contact
  - `POST /api/crm-contacts` - Create contact
  - `PATCH /api/crm-contacts/:id` - Update contact
  - `DELETE /api/crm-contacts/:id` - Delete contact
  - `POST /api/crm-contacts/:id/notes` - Add note to contact
- **Status:** ✅ Fully functional, API-backed, no localStorage
- **Mounted:** ✅ `/api/crm-contacts` in `server.ts`

### 2. Data Model (Current)
- **Model:** `CrmBrandContact` in Prisma schema
- **Fields:**
  - `id`, `crmBrandId` (required - links to brand)
  - `firstName`, `lastName` (required)
  - `email` (unique, indexed)
  - `phone`, `title` (optional)
  - `primaryContact` (boolean)
  - `notes` (JSON string)
  - `createdAt`, `updatedAt`
- **Status:** ✅ Basic structure works, but limited

### 3. Gmail Integration
- **Location:** `apps/api/src/services/gmail/linkEmailToCrm.ts`
- **Functionality:**
  - Auto-creates contacts from Gmail threads
  - Handles duplicate detection (unique email constraint)
  - Links contacts to brands based on email domain
  - Graceful error handling (doesn't break sync on failures)
- **Status:** ✅ Working, creates contacts automatically

### 4. Frontend Integration (Partial)
- **Location:** `apps/web/src/pages/AdminBrandsPage.jsx`
- **Functionality:**
  - Contacts displayed within Brand detail view
  - Create/Edit/Delete contacts via drawer
  - Contact notes support
  - Copy email/phone to clipboard
- **Status:** ✅ Works, but only accessible via Brands page

### 5. API Client
- **Location:** `apps/web/src/services/crmClient.js`
- **Functions:**
  - `fetchContacts(brandId?)`
  - `fetchContact(id)`
  - `createContact(data)`
  - `updateContact(id, data)`
  - `deleteContact(id)`
  - `addContactNote(id, text, author)`
- **Status:** ✅ Complete, properly error-handled

## What Is Missing ❌

### 1. Standalone Contacts Page
- **Current:** `AdminContactsPage.jsx` is just a placeholder with "Coming Soon"
- **Required:** Full CRM contacts management interface
- **Priority:** 🔴 **CRITICAL**

### 2. Contact Type Classification
- **Missing Fields:**
  - `contactType` (Brand, Talent, Manager/Agent, PR/Media, Finance, Partner, Other)
  - No way to distinguish contact roles
- **Impact:** Cannot filter or organize contacts by type
- **Priority:** 🔴 **HIGH**

### 3. Missing Core CRM Fields
- **Missing:**
  - `relationshipStrength` (New, Weak, Moderate, Strong)
  - `owner` (admin/agent responsible)
  - `lastContacted` (date)
  - `source` (manual, Gmail, import)
  - `tags` / `labels` (array)
  - `secondaryEmail` (optional)
  - `linkedInUrl` (referenced in UI but not in schema)
- **Priority:** 🟡 **MEDIUM**

### 4. Linking & Relationships
- **Current:** Contacts only link to Brands
- **Missing Links:**
  - ❌ Talent (no relationship)
  - ❌ Deals (no relationship)
  - ❌ Campaigns (no relationship)
  - ❌ Outreach records (referenced but not formalized)
  - ❌ Gmail threads (no direct link, only via email matching)
- **Priority:** 🔴 **HIGH**

### 5. Search, Filter & Sort
- **Missing:**
  - ❌ Global search (name, email, brand)
  - ❌ Filter by contact type
  - ❌ Filter by linked brand
  - ❌ Filter by linked talent
  - ❌ Filter by owner
  - ❌ Sort by alphabetical
  - ❌ Sort by recently contacted
  - ❌ Sort by recently added
- **Priority:** 🟡 **MEDIUM**

### 6. Permissions & Security
- **Current:** Only `requireAuth` (any authenticated user)
- **Missing:**
  - ❌ Admin-only access (`requireAdmin` or `requireRole(['ADMIN'])`)
  - ❌ Audit logging for create/update/delete
  - ❌ No permission checks in routes
- **Priority:** 🔴 **HIGH**

### 7. Standalone Contact Management
- **Current:** Contacts only accessible via Brands page
- **Missing:**
  - ❌ Dedicated contacts list view
  - ❌ Contact detail page
  - ❌ Bulk operations
  - ❌ Import/export
- **Priority:** 🔴 **CRITICAL**

### 8. UX & Safety
- **Missing:**
  - ❌ Delete confirmation dialogs
  - ❌ Unsaved changes warnings
  - ❌ Error surfacing (some errors swallowed)
  - ❌ Empty states for standalone page
- **Priority:** 🟡 **MEDIUM**

## Schema Changes Required

### Option 1: Extend CrmBrandContact (Recommended for Quick Fix)
```prisma
model CrmBrandContact {
  // ... existing fields ...
  
  // NEW FIELDS
  contactType        String?   // BRAND, TALENT, MANAGER, PR, FINANCE, PARTNER, OTHER
  relationshipStrength String? // NEW, WEAK, MODERATE, STRONG
  owner              String?   // Admin/agent responsible
  lastContacted      DateTime?
  source             String?   // manual, gmail, import
  tags               String[]  @default([])
  secondaryEmail     String?
  linkedInUrl        String?
  
  // NEW RELATIONSHIPS
  linkedTalentId     String?
  Talent             Talent?   @relation(fields: [linkedTalentId], references: [id], onDelete: SetNull)
  
  @@index([contactType])
  @@index([owner])
  @@index([lastContacted])
}
```

### Option 2: New Standalone Contact Model (Better Long-term)
```prisma
model Contact {
  id                String   @id @default(cuid())
  firstName         String
  lastName          String
  email             String?  @unique
  secondaryEmail    String?
  phone             String?
  title             String?
  contactType       String   @default("OTHER") // BRAND, TALENT, MANAGER, PR, FINANCE, PARTNER, OTHER
  relationshipStrength String? // NEW, WEAK, MODERATE, STRONG
  owner             String?  // Admin/agent responsible
  lastContacted     DateTime?
  source            String   @default("manual") // manual, gmail, import
  tags              String[] @default([])
  linkedInUrl       String?
  notes             String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  // RELATIONSHIPS
  linkedBrandId     String?
  Brand             CrmBrand? @relation(fields: [linkedBrandId], references: [id], onDelete: SetNull)
  
  linkedTalentId    String?
  Talent            Talent?   @relation(fields: [linkedTalentId], references: [id], onDelete: SetNull)
  
  // Many-to-many relationships
  Deals             Deal[]    // Via junction table
  Campaigns         Campaign[] // Via junction table
  OutreachRecords   Outreach[]
  
  @@index([contactType])
  @@index([owner])
  @@index([lastContacted])
  @@index([email])
  @@index([linkedBrandId])
  @@index([linkedTalentId])
}
```

**Recommendation:** Start with Option 1 (extend existing), migrate to Option 2 later if needed.

## API Changes Required

### 1. Add Admin-Only Protection
```typescript
// In crmContacts.ts
import { requireRole } from "../middleware/requireRole.js";

router.use(requireAuth, requireRole(['ADMIN', 'SUPERADMIN']));
```

### 2. Add Search Endpoint
```typescript
// GET /api/crm-contacts/search?q=query&type=BRAND&owner=admin
router.get("/search", requireAuth, requireRole(['ADMIN']), async (req, res) => {
  const { q, type, owner, brandId, talentId } = req.query;
  // ... search logic
});
```

### 3. Add Audit Logging
```typescript
// In create/update/delete handlers
await logAuditEvent(req, {
  action: "CONTACT_CREATED",
  entityType: "Contact",
  entityId: contact.id,
  metadata: { ... }
});
```

### 4. Add Relationship Endpoints
```typescript
// POST /api/crm-contacts/:id/link-talent
// POST /api/crm-contacts/:id/link-deal
// POST /api/crm-contacts/:id/link-campaign
```

## UI Changes Required

### 1. Build AdminContactsPage.jsx
**Required Components:**
- Contact list table (name, email, type, brand, last contacted)
- Search bar
- Filters (type, brand, owner)
- Sort options
- Create contact button
- Contact detail drawer/modal
- Delete confirmation

**Reference:** Use `AdminBrandsPage.jsx` as pattern

### 2. Contact Detail View
**Required Sections:**
- Overview (name, email, phone, type, brand, talent)
- Relationships (linked deals, campaigns, outreach)
- Activity timeline
- Notes
- Gmail threads (if linked)

### 3. Contact Form
**Required Fields:**
- First Name, Last Name (required)
- Email (required, unique)
- Secondary Email (optional)
- Phone (optional)
- Title (optional)
- Contact Type (dropdown)
- Brand (dropdown, optional)
- Talent (dropdown, optional)
- Owner (dropdown)
- Relationship Strength (dropdown)
- Tags (multi-select)
- LinkedIn URL (optional)
- Notes (textarea)

## Gmail Integration Status

### ✅ What Works
- Contacts auto-created from Gmail threads
- Duplicate detection (unique email constraint)
- Brand linking based on email domain
- Graceful error handling

### ⚠️ What Needs Improvement
- No deduplication UI (duplicates may exist if created manually)
- No merge functionality
- No "last email date" tracking in contact record
- No direct link to Gmail threads (only via email matching)

## Priority Action Items

### 🔴 Critical (Do First)
1. **Build AdminContactsPage.jsx** - Standalone contacts management
2. **Add admin-only permissions** - Secure the routes
3. **Add contact type field** - Enable classification
4. **Add Talent linking** - Support talent contacts

### 🟡 High Priority
5. **Add search/filter/sort** - Essential CRM functionality
6. **Add missing fields** - owner, lastContacted, source, tags
7. **Add audit logging** - Track all changes
8. **Add delete confirmation** - Safety

### 🟢 Medium Priority
9. **Add Deal/Campaign linking** - Complete relationships
10. **Add Gmail thread linking** - Better email integration
11. **Add bulk operations** - Efficiency
12. **Add import/export** - Data portability

## Implementation Plan

### Phase 1: Foundation (Week 1)
1. Add admin-only permissions to routes
2. Add contact type field to schema + migration
3. Build basic AdminContactsPage with list view
4. Add create/edit/delete functionality

### Phase 2: Relationships (Week 2)
1. Add Talent linking
2. Add missing fields (owner, lastContacted, source, tags)
3. Build contact detail view
4. Add relationship displays

### Phase 3: Search & Filter (Week 3)
1. Add search endpoint
2. Add filter UI
3. Add sort options
4. Add pagination

### Phase 4: Polish (Week 4)
1. Add audit logging
2. Add delete confirmations
3. Add error handling improvements
4. Add empty states
5. Add Gmail thread linking

## Success Criteria

✅ Contacts page functions as standalone CRM surface  
✅ All contacts accessible without navigating through Brands  
✅ Contacts can be classified by type  
✅ Contacts can link to Talent, Deals, Campaigns  
✅ Search, filter, and sort work correctly  
✅ Admin-only access enforced  
✅ All changes audited  
✅ Gmail sync creates contacts correctly  
✅ No crashes on partial/malformed data  
✅ Feels "boring and solid" (production-ready)

## Files to Create/Modify

### New Files
- `apps/web/src/pages/AdminContactsPage.jsx` - Full implementation
- `apps/api/prisma/migrations/XXXXX_add_contact_fields/` - Schema migration

### Modified Files
- `apps/api/src/routes/crmContacts.ts` - Add permissions, search, audit
- `apps/api/prisma/schema.prisma` - Add fields and relationships
- `apps/web/src/services/crmClient.js` - Add search function
- `apps/web/src/components/ContactChip.jsx` - May need updates

## Next Steps

1. **Review this audit** with stakeholders
2. **Prioritize features** based on business needs
3. **Start with Phase 1** (Foundation)
4. **Test incrementally** after each phase
5. **Deploy to production** once Phase 1-2 complete

---

**Audit Completed:** 2025-01-02  
**Next Review:** After Phase 1 implementation

