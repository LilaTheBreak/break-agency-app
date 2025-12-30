# Talent Management System - Implementation Plan

## Overview

This document provides the complete implementation plan for the Talent Management system, transforming Talent from a user-dependent entity to a first-class business object.

## Design Documents

1. **TALENT_MANAGEMENT_SYSTEM_DESIGN.md** - Complete system design
2. **TALENT_SCHEMA_CHANGES.md** - Detailed schema changes
3. **This document** - Implementation roadmap

---

## Implementation Phases

### Phase 1: Schema Migration (FOUNDATIONAL) ⚠️ CRITICAL

**Goal:** Update database schema to support optional User linking and new Talent fields

**Tasks:**
1. Create Prisma migration file
2. Update Talent model:
   - Make `userId` optional
   - Rename `name` → `displayName`
   - Add `legalName`, `primaryEmail`, `representationType`, `status`, `managerId`, `notes`, `metadata`
   - Change User relation `onDelete: Cascade` → `onDelete: SetNull`
3. Add Manager relation to User model
4. Add `talentId` to:
   - Opportunity
   - OpportunityApplication
   - InboundEmail
   - InboxMessage
   - CrmTask
5. Add indexes for performance
6. Create data backfill script

**Migration File:** `apps/api/prisma/migrations/[timestamp]_talent_management/migration.sql`

**Backfill Script:**
```typescript
// Backfill existing Talent records
async function backfillTalentData() {
  const talents = await prisma.talent.findMany();
  
  for (const talent of talents) {
    await prisma.talent.update({
      where: { id: talent.id },
      data: {
        displayName: talent.name, // Rename
        representationType: "EXCLUSIVE", // Default for existing
        status: "ACTIVE",
      }
    });
  }
}
```

**Risk:** Medium - Schema changes are breaking but migration handles it
**Mitigation:** Test on staging, have rollback plan

---

### Phase 2: Backend API (Core Functionality)

**Goal:** Create Talent management APIs

**Files to Create:**
- `apps/api/src/routes/admin/talent.ts` - Talent CRUD routes
- `apps/api/src/services/talentService.ts` - Business logic
- `apps/api/src/controllers/talentController.ts` - Request handlers

**API Endpoints:**

```typescript
// GET /api/admin/talent
// List all talent with filters
GET /api/admin/talent?representationType=EXCLUSIVE&status=ACTIVE&managerId=xxx

// GET /api/admin/talent/:id
// Get single talent with all relations

// POST /api/admin/talent
// Create new talent (with or without User)
{
  displayName: string
  legalName?: string
  primaryEmail?: string
  representationType: "EXCLUSIVE" | "NON_EXCLUSIVE" | "FRIEND_OF_HOUSE" | "UGC" | "FOUNDER"
  status?: "ACTIVE" | "PAUSED" | "ARCHIVED"
  userId?: string  // Optional - link to existing User
  managerId?: string
  notes?: string
}

// PATCH /api/admin/talent/:id
// Update talent (admin only)

// PATCH /api/admin/talent/:id/link-user
// Link existing User to Talent
{
  userId: string
}

// PATCH /api/admin/talent/:id/unlink-user
// Unlink User from Talent (does not delete Talent)

// DELETE /api/admin/talent/:id
// Archive talent (soft delete - set status to ARCHIVED)
```

**Permissions:**
- All routes require `requireAuth` + `requireAdmin`
- Audit log all create/update/link/unlink actions

---

### Phase 3: Talent Data Aggregation Service

**Goal:** Aggregate all talent-related data for the detail view

**File:** `apps/api/src/services/talentAggregationService.ts`

**Functions:**
```typescript
async function getTalentOverview(talentId: string) {
  // Returns:
  // - Basic info
  // - Key metrics (deals, revenue, opportunities, tasks)
  // - Recent activity
}

async function getTalentOpportunities(talentId: string) {
  // All opportunities (email + marketplace)
}

async function getTalentDeals(talentId: string) {
  // All deals with pipeline status
}

async function getTalentCampaigns(talentId: string) {
  // All campaigns
}

async function getTalentContracts(talentId: string) {
  // All contracts (via deals)
}

async function getTalentInbox(talentId: string) {
  // All email threads
}

async function getTalentTasks(talentId: string) {
  // All tasks (CRM + Creator tasks)
}

async function getTalentRevenue(talentId: string) {
  // Earnings, payouts, commissions
}
```

---

### Phase 4: Frontend - Admin Talent Hub

**Goal:** Build admin UI for talent management

**Routes:**
- `/admin/talent` - List view
- `/admin/talent/:id` - Detail view
- `/admin/talent/new` - Create form
- `/admin/talent/:id/edit` - Edit form

**Files to Create:**
- `apps/web/src/pages/AdminTalentPage.jsx` - List view
- `apps/web/src/pages/AdminTalentDetailPage.jsx` - Detail view with tabs
- `apps/web/src/components/talent/TalentList.jsx` - List component
- `apps/web/src/components/talent/TalentDetailTabs.jsx` - Tab navigation
- `apps/web/src/components/talent/TalentOverviewTab.jsx`
- `apps/web/src/components/talent/TalentOpportunitiesTab.jsx`
- `apps/web/src/components/talent/TalentDealsTab.jsx`
- `apps/web/src/components/talent/TalentCampaignsTab.jsx`
- `apps/web/src/components/talent/TalentContractsTab.jsx`
- `apps/web/src/components/talent/TalentInboxTab.jsx`
- `apps/web/src/components/talent/TalentTasksTab.jsx`
- `apps/web/src/components/talent/TalentRevenueTab.jsx`
- `apps/web/src/components/talent/TalentNotesTab.jsx`
- `apps/web/src/services/talentClient.js` - API client

**UI Components:**
- Talent list with filters
- Talent detail tabs
- Link/unlink user UI
- Metrics dashboard
- Activity timeline

---

### Phase 5: Linking Mechanism

**Goal:** Implement safe User ↔ Talent linking

**File:** `apps/api/src/services/talentLinkingService.ts`

**Functions:**
```typescript
async function linkUserToTalent(talentId: string, userId: string, adminId: string) {
  // 1. Validate talent exists
  // 2. Validate user exists
  // 3. Check if user already linked to another talent
  // 4. Check if talent already has user
  // 5. Update talent.userId
  // 6. Audit log
}

async function unlinkUserFromTalent(talentId: string, adminId: string) {
  // 1. Validate talent exists
  // 2. Set talent.userId = null
  // 3. Audit log
  // 4. Do NOT delete talent
}
```

**Safety Rules:**
- Only admins can link/unlink
- One User → One Talent (when linked)
- Unlinking does not delete Talent
- All actions are audit-logged

---

### Phase 6: Data Migration & Backfill

**Goal:** Migrate existing data to new structure

**Script:** `apps/api/src/scripts/migrateTalentData.ts`

**Steps:**
1. Backfill Talent records:
   - Set `displayName` = `name`
   - Set `representationType` based on business logic
   - Set `status` = "ACTIVE"
2. Link Opportunities to Talent:
   - Find Talent via `creatorId` in OpportunityApplication
   - Set `talentId` on Opportunity
3. Link Emails to Talent:
   - Find Talent via `userId` in InboundEmail
   - Set `talentId` on InboundEmail
4. Link Tasks to Talent:
   - Find Talent via `relatedCreators` in CrmTask
   - Set `talentId` on CrmTask

**Run:** `pnpm tsx apps/api/src/scripts/migrateTalentData.ts`

---

### Phase 7: Exclusive Talent Enhancements

**Goal:** Add special features for Exclusive Talent

**Features:**
- Enhanced analytics dashboard
- Priority alerts
- Auto-routing of emails
- Automatic deal creation
- Custom reporting

**Implementation:**
- Conditional rendering in UI based on `representationType === "EXCLUSIVE"`
- Special API endpoints for exclusive talent
- Enhanced metrics calculations

---

## Testing Strategy

### Unit Tests
- Talent service functions
- Linking/unlinking logic
- Data aggregation

### Integration Tests
- API endpoints
- Database migrations
- Data backfill scripts

### E2E Tests
- Admin Talent Hub UI
- Create/edit talent
- Link/unlink user
- View talent detail tabs

---

## Rollout Plan

### Stage 1: Schema Migration (Week 1)
- Deploy schema changes
- Run data backfill
- Verify data integrity

### Stage 2: Backend APIs (Week 2)
- Deploy Talent APIs
- Test with Postman/curl
- Verify permissions

### Stage 3: Frontend UI (Week 3)
- Deploy Admin Talent Hub
- Test with real data
- Gather feedback

### Stage 4: Linking Mechanism (Week 4)
- Deploy linking APIs
- Test link/unlink flows
- Verify audit logs

### Stage 5: Exclusive Features (Week 5)
- Deploy exclusive enhancements
- Test analytics
- Verify auto-routing

---

## Success Metrics

- ✅ Talent can be created without User
- ✅ User can be linked/unlinked safely
- ✅ All opportunities, deals, emails attach to Talent
- ✅ Admin can manage all talent from one hub
- ✅ Exclusive talent get enhanced features
- ✅ No breaking changes to existing dashboards
- ✅ Migration completes successfully
- ✅ Zero data loss

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Breaking existing dashboards | High | Keep `userId` references, add `talentId` alongside |
| Data inconsistency | Medium | Use transactions, validate integrity |
| Performance degradation | Medium | Add indexes, optimize queries |
| Migration failures | High | Test on staging, have rollback plan |
| User confusion | Low | Clear UI, documentation, training |

---

## Next Steps

1. ✅ Review and approve design documents
2. ⏳ Create Prisma migration file
3. ⏳ Implement backend APIs
4. ⏳ Build Admin UI
5. ⏳ Test migration strategy
6. ⏳ Deploy to staging
7. ⏳ Production rollout

---

## Questions to Resolve

1. **Representation Type Default:** Should existing Talent default to "EXCLUSIVE" or be determined by business logic?
2. **Email Auto-Linking:** Should emails automatically link to Talent based on email address matching?
3. **Task Assignment:** Should tasks automatically assign to Talent's manager?
4. **Revenue Calculation:** How should revenue be calculated for talent without deals?

---

## Conclusion

This Talent Management system provides a solid foundation for agency-side talent operations. The phased approach ensures safe rollout with minimal disruption to existing systems.

**Key Principles:**
- Talent ≠ User (core principle)
- Non-breaking changes (backward compatible)
- Safe migration (tested, reversible)
- Admin-first (operational hub)
- Scalable (handles all talent types)

