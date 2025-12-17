# Admin Outreach Control Room - Backend Infrastructure Audit
**Date:** 17 December 2025  
**Status:** Comprehensive Audit Complete

---

## Executive Summary

**Overall Status:** ⚠️ **Partially Complete** - Core infrastructure exists but significant gaps in required functionality

**Critical Findings:**
- ✅ Outreach CRUD endpoints functional
- ❌ Missing Opportunity management system (current model is job listings, not sales opportunities)
- ❌ No pipeline/metrics APIs
- ❌ No email thread linking APIs
- ⚠️ Incomplete Deal continuity for outreach→deal flow

---

## 1. Core Data Models

### ✅ Outreach Model
**Status:** EXISTS AND WORKS
```prisma
model Outreach {
  id              String   @id @default(uuid())
  target          String
  type            String   @default("Brand")
  contact         String?
  contactEmail    String?
  link            String?
  owner           String?
  source          String?
  stage           String   @default("not-started")
  status          String   @default("Not started")
  gmailThreadId   String?
  lastContact     DateTime?
  nextFollowUp    DateTime?
  createdBy       String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  // Relations
  OutreachNote    OutreachNote[]
  OutreachTask    OutreachTask[]
}
```

**Matches Requirements:**
- ✅ `id`
- ✅ `target` (target_name)
- ✅ `createdBy` (owner_id/admin)
- ✅ `stage`
- ✅ `source`
- ✅ `createdAt`, `updatedAt`
- ✅ `gmailThreadId` for email linking
- ✅ `lastContact` (last_contacted_at)

**Missing Requirements:**
- ❌ `target_type` field (uses generic `type` field instead)
- ❌ `archived` boolean (no soft delete flag)
- ❌ `linked_creator_id` foreign key
- ❌ `linked_brand_id` foreign key

---

### ❌ OutreachEmailThread Model
**Status:** MISSING - No dedicated model exists

**Current State:**
- Outreach has `gmailThreadId` string field
- Can link to `InboundEmail.threadId` indirectly
- No dedicated tracking of email thread metadata

**Required Fields (Not Implemented):**
- ❌ `id`
- ❌ `outreach_id`
- ❌ `gmail_thread_id`
- ❌ `last_message_at`
- ❌ `status` (awaiting_reply | responded | no_response)
- ❌ `last_synced_at`

---

### ✅ OutreachTask Model
**Status:** EXISTS AND WORKS
```prisma
model OutreachTask {
  id          String   @id @default(uuid())
  outreachId  String
  title       String
  dueDate     DateTime?
  owner       String?
  priority    String   @default("Medium")
  status      String   @default("Open")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Matches Requirements:**
- ✅ `id`
- ✅ `outreachId` (parent_id with parent_type hardcoded to outreach)
- ✅ `title`
- ✅ `dueDate` (due_at)
- ✅ `priority`
- ✅ `status` (can be used for completed boolean)

**Missing Requirements:**
- ❌ `parent_type` enum (hardcoded to outreach only)
- ❌ `assigned_to` (uses string `owner` instead of user FK)
- ❌ `completed` boolean (uses status = "Done" instead)

---

### ❌ Opportunity Model
**Status:** WRONG MODEL - Current Opportunity model is for job listings, NOT sales opportunities

**Current Model:**
```prisma
model Opportunity {
  id           String   @id
  brand        String
  title        String
  deliverables String
  payment      String
  deadline     String
  status       String
  isActive     Boolean
  // This is a JOB LISTING model, not a sales pipeline model
}
```

**Required Fields (Not Implemented):**
- ❌ `outreach_id` (required FK)
- ❌ `name`
- ❌ `value` (numeric)
- ❌ `currency`
- ❌ `expected_close_at`
- ❌ `status` (open | closed_won | closed_lost)

**Recommendation:** Create new `SalesOpportunity` model to avoid confusion

---

### ⚠️ Deal Model
**Status:** EXISTS BUT INCOMPLETE for outreach flow

**Current Model:**
```prisma
model Deal {
  id              String    @id
  userId          String
  talentId        String
  brandId         String
  stage           DealStage
  value           Float?
  currency        String
  notes           String?
  campaignLiveAt  DateTime?
  // Relations exist
}
```

**Matches Requirements:**
- ✅ `id`
- ✅ `name` (brandName field)
- ✅ `value`
- ✅ `status` (via DealStage enum)
- ✅ `createdAt`

**Missing Requirements:**
- ❌ `opportunity_id` FK (no link to sales opportunity)
- ❌ No way to trace back to originating Outreach record

---

### ✅ OutreachNote Model
**Status:** EXISTS AND WORKS
```prisma
model OutreachNote {
  id          String   @id @default(uuid())
  outreachId  String
  author      String
  body        String
  createdAt   DateTime @default(now())
}
```

**Matches Requirements:**
- ✅ `id`
- ✅ `outreachId` (parent_id with parent_type hardcoded)
- ✅ `body`
- ✅ `author` (created_by)
- ✅ `createdAt`

**Missing Requirements:**
- ❌ `parent_type` enum (hardcoded to outreach only)

---

## 2. Outreach API Endpoints

### ✅ Basic CRUD
**Status:** EXISTS AND WORKS

| Endpoint | Method | Status | Notes |
|----------|--------|--------|-------|
| `/api/outreach/records` | GET | ✅ Works | Lists all outreach with notes/tasks |
| `/api/outreach/records` | POST | ✅ Works | Creates new outreach record |
| `/api/outreach/records/:id` | GET | ❌ Missing | Individual record fetch |
| `/api/outreach/records/:id` | PATCH | ✅ Works | Updates outreach record |
| `/api/outreach/records/:id` | DELETE | ❌ Missing | No soft delete endpoint |

**Admin Prefix Issue:**
- ❌ All endpoints are at `/api/outreach/*`
- ❌ Required: `/api/admin/outreach/*`
- ❌ No admin-only access enforcement

---

## 3. Pipeline & Metrics APIs

### ❌ Pipeline Data
**Status:** MISSING

**Required:** `GET /api/admin/outreach/pipeline`

**Should Return:**
- Outreach grouped by stage
- Record counts per stage
- Conversion rates

**Current State:**
- `/api/outreach/metrics` exists but returns placeholder only
- No grouping logic implemented

---

### ❌ Metrics
**Status:** MISSING

**Required:** `GET /api/admin/outreach/metrics`

**Should Return:**
- Total outreach sent
- Response rate
- Conversion to meetings
- Closed won vs lost

**Current State:**
```typescript
router.get("/", (_req, res) => {
  res.json({ message: "Outreach Metrics API placeholder active" });
});
```

**Filters Required:**
- ❌ Date range filtering
- ❌ Owner filtering

---

## 4. Opportunity APIs

### ❌ All Opportunity Endpoints
**Status:** COMPLETELY MISSING

| Endpoint | Status | Notes |
|----------|--------|-------|
| `POST /api/admin/opportunities` | ❌ Missing | Create opportunity from outreach |
| `PATCH /api/admin/opportunities/:id` | ❌ Missing | Update opportunity |
| `GET /api/admin/opportunities` | ❌ Missing | List opportunities |
| `POST /api/admin/opportunities/:id/convert-to-deal` | ❌ Missing | Convert to deal |

**Blockers:**
- No SalesOpportunity model exists
- Current Opportunity model is for job listings
- No outreach → opportunity → deal flow

---

## 5. Deal Continuity APIs

### ⚠️ Deal Endpoints
**Status:** EXISTS BUT INCOMPLETE

| Endpoint | Method | Status | Notes |
|----------|--------|--------|-------|
| `GET /api/deals` | GET | ⚠️ Exists | No `?source=outreach` filter |
| `POST /api/deals` | POST | ⚠️ Exists | No outreach linking |
| `PATCH /api/deals/:id` | PATCH | ✅ Works | Via PUT actually |

**Missing:**
- ❌ No way to query deals by outreach origin
- ❌ No preservation of outreach notes in deal
- ❌ No preservation of outreach tasks in deal
- ❌ No Gmail thread continuity

---

## 6. Email & Gmail Integration APIs

### ❌ Thread Linking
**Status:** PARTIALLY MISSING

**Implemented:**
- ✅ `GET /api/outreach/records/:id/gmail-thread` - Fetches messages

**Missing:**
- ❌ `POST /api/admin/outreach/:id/link-gmail-thread` - Manual linking
- ❌ Thread status calculation
- ❌ Auto-sync functionality

**Current Implementation:**
```typescript
// Only reads, doesn't write thread links
router.get("/records/:id/gmail-thread", requireAuth, async (req, res) => {
  const messages = await prisma.inboundEmail.findMany({
    where: { threadId: record.gmailThreadId }
  });
  res.json({ messages });
});
```

---

## 7. Tasks & Reminders APIs

### ✅ Tasks
**Status:** EXISTS AND WORKS

| Endpoint | Method | Status | Notes |
|----------|--------|--------|-------|
| `POST /api/outreach/records/:id/tasks` | POST | ✅ Works | Creates task |
| `PATCH /api/outreach/tasks/:taskId` | PATCH | ✅ Works | Updates task |
| `GET /api/outreach/records/:id/tasks` | GET | ✅ Works | Lists tasks |

**Missing:**
- ❌ Generic task endpoint: `GET /api/admin/tasks?parent_type=&parent_id=`
- ❌ Due date reminder system (only polling endpoint exists)

### ⚠️ Reminders
**Status:** EXISTS BUT LIMITED

**Implemented:**
- ✅ `GET /api/outreach/reminders` - Gets records with upcoming follow-ups

**Limitations:**
- Only checks `nextFollowUp` field
- Doesn't check task due dates
- No notification/alert system

---

## 8. Notes APIs

### ✅ Notes
**Status:** EXISTS AND WORKS

| Endpoint | Method | Status | Notes |
|----------|--------|--------|-------|
| `POST /api/outreach/records/:id/notes` | POST | ✅ Works | Creates note |
| `GET /api/outreach/records/:id/notes` | GET | ✅ Works | Lists notes |
| `PATCH /api/outreach/notes/:id` | PATCH | ❌ Missing | Update note |

**Missing:**
- ❌ Generic notes endpoint: `POST /api/admin/notes`
- ❌ Generic notes query: `GET /api/admin/notes?parent_type=&parent_id=`
- ❌ No notes persistence through outreach → opportunity → deal flow

---

## 9. Permissions & Safety

### ⚠️ Security Status
**Status:** PARTIAL IMPLEMENTATION

**Implemented:**
- ✅ `requireAuth` middleware on all routes
- ✅ User ID checked via `req.user?.id`

**Missing:**
- ❌ No admin-only access enforcement (routes are `/api/outreach/*` not `/api/admin/outreach/*`)
- ❌ No soft deletes (no DELETE endpoint exists)
- ⚠️ Audit fields present but no immutability enforcement at API level

**Schema Fields:**
- ✅ `createdAt` - auto-set
- ✅ `updatedAt` - auto-updated
- ✅ `createdBy` - set on create
- ❌ No middleware preventing modification of audit fields

---

## 10. Failure & Fallback Behaviour

### ✅ Error Handling
**Status:** GOOD

**Implemented:**
```typescript
try {
  // operation
  res.json({ records });
} catch (error) {
  console.error("[OUTREACH_LIST] Error:", error);
  res.status(500).json({ error: "Failed to fetch outreach records" });
}
```

**Fallback Behavior:**
- ✅ Gmail disconnected handled: `if (!record?.gmailThreadId) return res.json({ messages: [] })`
- ✅ Empty arrays returned instead of errors
- ✅ Clear error messages

**Working Scenarios:**
- ✅ Gmail disconnected → returns empty messages array
- ✅ No outreach exists → returns empty records array
- ✅ No notes/tasks → returns empty nested arrays

---

## Critical Gaps Summary

### HIGH PRIORITY (Blockers)
1. ❌ **Sales Opportunity Model** - Current model is for job listings
2. ❌ **Admin Route Prefix** - All routes should be `/api/admin/outreach/*`
3. ❌ **Pipeline API** - No way to view stage-grouped data
4. ❌ **Metrics API** - Placeholder only, no calculations
5. ❌ **Opportunity → Deal Conversion** - Missing entire flow
6. ❌ **Soft Delete** - No archive/restore functionality

### MEDIUM PRIORITY (Incomplete Features)
7. ⚠️ **OutreachEmailThread Model** - Should be dedicated table
8. ⚠️ **Thread Linking API** - Can read but not manually link
9. ⚠️ **Deal Source Tracking** - No way to trace deals back to outreach
10. ⚠️ **Generic Task/Note APIs** - Hardcoded to outreach only
11. ⚠️ **Admin-Only Enforcement** - No role-based access control

### LOW PRIORITY (Nice to Have)
12. ❌ **GET /api/admin/outreach/:id** - Individual record endpoint
13. ❌ **Note Update Endpoint** - Can create but not edit
14. ❌ **Task Reminder System** - Only polling, no notifications
15. ❌ **Immutable Audit Fields** - No middleware enforcement

---

## Recommended Implementation Plan

### Phase 1: Critical Schema Updates (1-2 days)
```prisma
// 1. Add to Outreach model
model Outreach {
  archived           Boolean  @default(false)
  linkedCreatorId    String?
  linkedBrandId      String?
  Creator            User?    @relation("OutreachCreator", fields: [linkedCreatorId])
  Brand              Brand?   @relation(fields: [linkedBrandId])
}

// 2. Create new model
model OutreachEmailThread {
  id              String   @id @default(uuid())
  outreachId      String
  gmailThreadId   String
  lastMessageAt   DateTime
  status          String   // awaiting_reply | responded | no_response
  lastSyncedAt    DateTime
  Outreach        Outreach @relation(fields: [outreachId])
}

// 3. Create new model
model SalesOpportunity {
  id              String   @id @default(uuid())
  outreachId      String   @unique
  name            String
  value           Float
  currency        String
  expectedCloseAt DateTime?
  status          String   // open | closed_won | closed_lost
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  Outreach        Outreach @relation(fields: [outreachId])
  Deal            Deal?
}

// 4. Add to Deal model
model Deal {
  opportunityId   String?  @unique
  Opportunity     SalesOpportunity? @relation(fields: [opportunityId])
}
```

### Phase 2: Pipeline & Metrics (2-3 days)
```typescript
// apps/api/src/routes/admin/outreachPipeline.ts
router.get("/pipeline", async (req, res) => {
  const grouped = await prisma.outreach.groupBy({
    by: ["stage"],
    _count: true,
    where: { archived: false }
  });
  // Calculate conversion rates
  // Return stage data
});

router.get("/metrics", async (req, res) => {
  // Total sent, response rate, conversions
  // Filter by date range, owner
});
```

### Phase 3: Opportunity Flow (2-3 days)
```typescript
// Create, update, list opportunities
// Convert to deal endpoint
// Preserve notes/tasks/threads
```

### Phase 4: Admin Enforcement (1 day)
```typescript
// Move routes to /api/admin/outreach/*
// Add admin role check middleware
// Implement soft delete
```

---

## Conclusion

**Current State:** The backend has a solid foundation with working CRUD operations for Outreach, Notes, and Tasks. Email integration is partially implemented.

**Critical Blockers:** 
- No sales opportunity system
- No pipeline/metrics visibility
- No outreach → opportunity → deal flow
- Missing admin access controls

**Next Steps:** Focus on Phase 1 schema updates and Phase 2 pipeline APIs to unblock the Control Room frontend immediately.

**Estimated Effort:** 6-10 days for full implementation of all requirements.
