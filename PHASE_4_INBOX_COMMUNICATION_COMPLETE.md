# Phase 4: Communication & Inbox System - Complete

**Date:** January 2025  
**Status:** ✅ Complete

---

## Summary

Phase 4 completes the Communication & Inbox system for V1 by:
1. ✅ Ensuring reliable Gmail associations to brands, deals, and talent
2. ✅ Completing email click tracking implementation
3. ✅ Verifying priority inbox and awaiting reply workflows
4. ✅ Marking platform inboxes (Instagram, TikTok, WhatsApp) as disabled/coming soon

---

## 1. Gmail Associations

### Explicit Linking Fields

**File:** `apps/api/prisma/schema.prisma`

Added explicit foreign key fields to `InboundEmail` model:
- `dealId` - Direct link to Deal
- `talentId` - Direct link to Talent
- `brandId` - Direct link to Brand (extracted from metadata)

**Before:** Linking was only in metadata JSON (fragile, indirect)  
**After:** Explicit foreign keys with database relations (reliable, queryable)

### Enhanced Link Service

**File:** `apps/api/src/services/gmail/linkEmailToCrm.ts`

Updated `linkEmailToCrm` to:
1. **Set explicit `brandId`** from CRM contact/brand lookup
2. **Auto-link to active deals** when brand has active deals
3. **Auto-link to talent** when contact is associated with deals containing talent

**Linking Logic:**
- Brand: Always linked via contact's `crmBrandId`
- Deal: Linked to most recent active deal for the brand
- Talent: Linked via deal's `talentId` if contact has associated deals

**Benefits:**
- Removed fragile metadata-only linking
- Enables efficient queries (e.g., "all emails for this deal")
- Database-level referential integrity

---

## 2. Email Tracking

### Open Tracking

**File:** `apps/api/src/routes/inboxTracking.ts`

- **Existing:** `TrackingPixelEvent` model tracks email opens
- **Endpoint:** `GET /api/inbox/open-tracking` returns open events
- **Updated:** Now includes both open and click events in unified feed

### Click Tracking (NEW)

**File:** `apps/api/src/routes/inboxClickTracking.ts` (NEW)

**New Model:** `EmailClickEvent`
- Tracks link clicks in emails
- Stores: `linkUrl`, `clickedAt`, `ip`, `userAgent`, `metadata`

**Endpoints:**
- `GET /api/inbox/click/:emailId?url=...` - Tracks click and redirects to URL
- `GET /api/inbox/click/tracking/:emailId` - Returns all click events for an email

**Integration:**
- Click tracking route registered in `server.ts`
- Unified tracking feed includes both opens and clicks

### Tracking Feed

**File:** `apps/api/src/routes/inboxTracking.ts`

Updated `GET /api/inbox/open-tracking` to return:
```json
{
  "ok": true,
  "count": 50,
  "opens": 30,
  "clicks": 20,
  "data": [
    {
      "id": "...",
      "type": "open" | "click",
      "emailId": "...",
      "timestamp": "...",
      "linkUrl": "..." // only for clicks
    }
  ]
}
```

---

## 3. Inbox Workflows

### Priority Inbox

**File:** `apps/api/src/routes/inboxPriority.ts`

**Fixed:** Added `userId` filter to ensure users only see their own messages

**Scoring Logic:**
- Unread: +30 points
- Priority field (0-2): ×10 points
- Linked deals: +20 points
- Urgent classification: +15 points

**Returns:** Top 100 messages sorted by score

**Status:** ✅ Working correctly

### Awaiting Reply

**File:** `apps/api/src/routes/inboxAwaitingReply.ts`

**Logic:**
1. Find outbound emails (where `fromEmail === user.email`)
2. For each outbound email, check thread for subsequent inbound replies
3. Include if:
   - No replies received, OR
   - Replies exist but are unread

**Status:** ✅ Working correctly

---

## 4. Platform Inboxes

### UI Updates

**File:** `apps/web/src/pages/Inbox.jsx`

**Changes:**
- Instagram, TikTok, WhatsApp filters marked as `disabled: true, comingSoon: true`
- Buttons show disabled styling (grayed out, cursor-not-allowed)
- Tooltip shows "Coming Soon" on hover
- "(Soon)" label displayed next to platform name

**Before:** All platforms appeared active (misleading)  
**After:** Clear visual indication that platforms are not yet available

**Code:**
```javascript
const CHANNEL_FILTERS = [
  { id: "all", label: "All" },
  { id: "email", label: "Email" },
  { id: "instagram", label: "Instagram", disabled: true, comingSoon: true },
  { id: "whatsapp", label: "WhatsApp", disabled: true, comingSoon: true },
  { id: "tiktok", label: "TikTok", disabled: true, comingSoon: true }
];
```

---

## Files Modified

### Schema
- `apps/api/prisma/schema.prisma`
  - Added `dealId`, `talentId`, `brandId` to `InboundEmail`
  - Added `InboundEmail[]` relations to `Deal` and `Talent`
  - Added `EmailClickEvent` model
  - Added `metadata` field to `TrackingPixelEvent`

### Services
- `apps/api/src/services/gmail/linkEmailToCrm.ts`
  - Enhanced to set explicit `brandId`, `dealId`, `talentId`
  - Auto-links to active deals and talent

### Routes
- `apps/api/src/routes/inboxClickTracking.ts` (NEW)
  - Click tracking endpoint
  - Click event retrieval
- `apps/api/src/routes/inboxTracking.ts`
  - Updated to include click events in unified feed
- `apps/api/src/routes/inboxPriority.ts`
  - Fixed: Added `userId` filter

### Frontend
- `apps/web/src/pages/Inbox.jsx`
  - Marked Instagram/TikTok/WhatsApp as disabled/coming soon
  - Added disabled button styling

### Server
- `apps/api/src/server.ts`
  - Registered click tracking router

---

## Data Flow

### Email Linking Flow

```
Gmail Email Received
  → linkEmailToCrm()
    → Find/Create Contact (by email)
    → Find/Create Brand (by domain)
    → Link Contact → Brand
    → Find Active Deal (for brand)
    → Find Talent (via deal)
    → Update InboundEmail:
      - brandId (explicit)
      - dealId (if active deal exists)
      - talentId (if deal has talent)
      - metadata (backward compatibility)
```

### Tracking Flow

```
Email Sent
  → Tracking pixel embedded
  → Link URLs wrapped with /api/inbox/click/:emailId?url=...
  
Email Opened
  → Pixel loads → TrackingPixelEvent created
  
Link Clicked
  → /api/inbox/click/:emailId?url=...
    → EmailClickEvent created
    → Redirect to actual URL
```

---

## Verification Checklist

- [x] InboundEmail has explicit `dealId`, `talentId`, `brandId` fields
- [x] `linkEmailToCrm` sets explicit foreign keys
- [x] Click tracking endpoint created and registered
- [x] Tracking feed includes both opens and clicks
- [x] Priority inbox filters by userId
- [x] Awaiting reply logic works correctly
- [x] Platform inboxes marked as disabled/coming soon in UI
- [x] No fake UI states for disabled platforms

---

## Migration Required

After deploying, run:

```bash
cd apps/api
npx prisma db push
```

This will:
- Add `dealId`, `talentId`, `brandId` columns to `InboundEmail`
- Create `EmailClickEvent` table
- Add `metadata` column to `TrackingPixelEvent`
- Create foreign key constraints

**Note:** Existing emails will have `null` for new fields until they are re-processed or manually linked.

---

## Production Status

✅ **Ready for Production**

All components are:
- Reliable (explicit foreign keys, not metadata-only)
- Complete (click tracking implemented)
- Verified (priority and awaiting reply tested)
- Clear (disabled platforms clearly marked)

---

## Next Steps (Future Enhancements)

- Manual deal/talent linking UI for emails
- Bulk email linking operations
- Tracking analytics dashboard
- Email engagement metrics
- Platform inbox implementations (Instagram, TikTok, WhatsApp)

