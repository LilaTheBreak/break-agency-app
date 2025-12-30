# Talent Management System Design
**Date:** 2025-01-02  
**Status:** Design Phase

## Executive Summary

The Talent Management system transforms Talent from a user-dependent entity to a first-class business object that can exist independently of user accounts. This enables agency-side management of all talent types (Exclusive, Non-Exclusive, Friends of House, UGC, Founders) regardless of whether they have login access.

## Core Principle

**Talent ≠ User**

- **Talent** = Managed entity (agency-side truth)
- **User** = Authentication + UI access
- Talent can exist without a User
- User can be linked to Talent later
- One User can link to one Talent (1:1 when linked)

---

## Phase 1: Data Model Design

### Current State

The existing `Talent` model:
```prisma
model Talent {
  id          String   @id
  userId      String   @unique  // REQUIRED - this is the problem
  name        String
  categories  String[]
  stage       String?
  // ... relations
  User        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**Issues:**
- `userId` is required and unique (1:1 enforced)
- Cannot create Talent without User
- Cannot unlink User without deleting Talent
- Missing operational fields (representation type, status, manager)

### New Talent Model

```prisma
model Talent {
  id                String                    @id @default(cuid())
  displayName       String                    // Public-facing name
  legalName         String?                   // Legal/contract name
  primaryEmail      String?                   // Primary contact email
  representationType String                   @default("NON_EXCLUSIVE") // EXCLUSIVE | NON_EXCLUSIVE | FRIEND_OF_HOUSE | UGC | FOUNDER
  status            String                    @default("ACTIVE") // ACTIVE | PAUSED | ARCHIVED
  userId            String?                   @unique // OPTIONAL - can be null
  managerId         String?                   // Admin/agent responsible
  notes             String?                   // Internal notes (JSON for structured data)
  categories        String[]                 @default([])
  stage             String?                   // Legacy field (keep for compatibility)
  metadata          Json?                    // Flexible storage for additional data
  createdAt         DateTime                 @default(now())
  updatedAt         DateTime                 @updatedAt
  
  // Relations
  User              User?                    @relation(fields: [userId], references: [id], onDelete: SetNull)
  Manager           User?                    @relation("TalentManager", fields: [managerId], references: [id], onDelete: SetNull)
  
  // Existing relations (keep all)
  AIPromptHistory         AIPromptHistory[]
  BrandSavedTalent        BrandSavedTalent[]
  CreatorEvent            CreatorEvent[]
  CreatorFitScore         CreatorFitScore[]
  CreatorGoal             CreatorGoal[]
  CreatorInsight          CreatorInsight[]
  CreatorTask             CreatorTask[]
  Deal                    Deal[]
  Payment                 Payment[]
  Payout                  Payout[]
  SocialAccountConnection SocialAccountConnection[]
  SuitabilityResult       SuitabilityResult[]
  TalentAssignment        TalentAssignment[]
  WellnessCheckin         WellnessCheckin[]
  
  // New relations to add
  Opportunity             Opportunity[]
  OpportunityApplication  OpportunityApplication[]
  Contract                Contract[]
  CrmTask                 CrmTask[]
  InboundEmail            InboundEmail[]
  InboxMessage            InboxMessage[]
  
  @@index([userId])
  @@index([managerId])
  @@index([representationType])
  @@index([status])
  @@index([displayName])
}
```

### User Model Updates

```prisma
model User {
  // ... existing fields ...
  
  // Update Talent relation to be optional
  Talent              Talent?                 @relation
  
  // Add manager relation
  ManagedTalents      Talent[]                @relation("TalentManager")
  
  // ... rest of relations ...
}
```

---

## Phase 2: Relationships to Add

### Models That Need `talentId`

1. **Opportunity** (already has `creatorId` - may need to add `talentId`)
2. **OpportunityApplication** (already has `creatorId` - may need to add `talentId`)
3. **Contract** (via Deal - already linked)
4. **CrmTask** (add `talentId` field)
5. **InboundEmail** (add `talentId` field)
6. **InboxMessage** (add `talentId` field)

### Migration Strategy

**Option A: Add `talentId` alongside existing `userId`/`creatorId`**
- Pros: Non-breaking, gradual migration
- Cons: Dual references during transition

**Option B: Replace `userId`/`creatorId` with `talentId`**
- Pros: Clean, single source of truth
- Cons: Breaking change, requires data migration

**Recommendation: Option A** - Add `talentId` fields, keep existing for backward compatibility, migrate gradually.

---

## Phase 3: Linking Mechanism

### User ↔ Talent Linking

**Rules:**
- One User can link to one Talent (1:1 when linked)
- Talent can exist without User
- Linking is admin-only
- Unlinking does not delete Talent
- Audit all link/unlink actions

**API Endpoints:**

```typescript
// POST /api/admin/talent
// Create Talent (with or without User)
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

// PATCH /api/admin/talent/:id/link-user
// Link existing User to Talent
{
  userId: string
}

// PATCH /api/admin/talent/:id/unlink-user
// Unlink User from Talent (does not delete Talent)
{}

// PATCH /api/admin/talent/:id
// Update Talent (admin only)
{
  displayName?: string
  representationType?: string
  status?: string
  managerId?: string
  notes?: string
}
```

---

## Phase 4: Admin Talent Hub UI

### Route Structure

```
/admin/talent                    # List view
/admin/talent/:id                # Detail view
/admin/talent/new                # Create new
/admin/talent/:id/edit           # Edit
```

### Talent List View

**Columns:**
- Display Name
- Representation Type (badge)
- Status (badge)
- Manager
- Linked User (if any)
- Key Metrics:
  - Active Deals
  - Total Revenue (YTD)
  - Open Opportunities
  - Pending Tasks

**Filters:**
- Representation Type
- Status
- Manager
- Has User Account (yes/no)

### Talent Detail View (MOST IMPORTANT)

**Tabs:**

1. **Overview**
   - Basic info (name, type, status, manager)
   - Linked user (if any) with link/unlink actions
   - Key metrics dashboard
   - Quick actions

2. **Opportunities**
   - All opportunities (email + marketplace)
   - Filter by status
   - Application history

3. **Deals**
   - Pipeline view
   - Deal stages
   - Revenue breakdown
   - Contract status

4. **Campaigns**
   - Active campaigns
   - Campaign history
   - Performance metrics

5. **Contracts**
   - All contracts
   - Status tracking
   - Signature status

6. **Inbox**
   - All email threads linked to talent
   - Unread count
   - Recent activity

7. **Tasks**
   - All tasks (CRM + Creator tasks)
   - Filter by status/priority
   - Due dates

8. **Revenue**
   - Earnings breakdown
   - Payouts
   - Commissions
   - Tax documents

9. **Notes & History**
   - Internal notes
   - Audit trail
   - Activity log

---

## Phase 5: Exclusive Talent Enhancements

### Special Features for `representationType === "EXCLUSIVE"`

**Enhanced Analytics:**
- Full revenue analytics
- Deal velocity metrics
- Opportunity conversion rates
- Performance trends

**Priority Alerts:**
- Overdue tasks
- Pending contracts
- Revenue milestones
- Opportunity deadlines

**Auto-Routing:**
- Inbox emails auto-linked to talent
- Automatic deal creation from opportunities
- Task assignment workflows

**Higher-Touch Workflows:**
- Dedicated manager assignment
- Priority support
- Custom reporting

---

## Phase 6: Permissions & Safety

### Access Control

**Admin Only:**
- Create/edit Talent
- Change representation type
- Link/unlink Users
- Assign managers
- View all talent data

**Talent Users (when linked):**
- View their own Talent data
- Update profile information (limited)
- Cannot unlink themselves
- Cannot change representation type

**Brands:**
- Never see Talent internals
- Only see public-facing information
- No access to admin Talent hub

### Data Safety

- Unlinking User does not delete Talent
- Deleting User sets `userId` to null (SetNull)
- All actions are audit-logged
- No destructive cascades on Talent

---

## Phase 7: Migration Strategy

### Step 1: Schema Migration

1. Make `userId` optional in Talent model
2. Add new fields (displayName, legalName, representationType, etc.)
3. Add `talentId` to related models (Opportunity, CrmTask, etc.)
4. Add indexes for performance

### Step 2: Data Backfill

1. **Existing Talent records:**
   - Keep existing `userId` links
   - Set `displayName` = `name` (existing field)
   - Set `representationType` = "EXCLUSIVE" (for existing exclusive dashboards)
   - Set `status` = "ACTIVE"

2. **Existing Deals:**
   - Already have `talentId` - no changes needed

3. **Existing Opportunities:**
   - Add `talentId` by looking up Talent via `creatorId` (if exists)
   - Keep `creatorId` for backward compatibility

4. **Existing Contracts:**
   - Link via Deal → Talent (already connected)

### Step 3: Gradual Migration

1. Update APIs to use `talentId` where available
2. Fall back to `userId`/`creatorId` if `talentId` not set
3. Migrate data as records are accessed
4. Remove fallback logic once migration complete

### Step 4: Frontend Updates

1. Update dashboards to use Talent data
2. Add Admin Talent Hub
3. Update user dashboards to derive from Talent
4. Add linking UI for admins

---

## Implementation Checklist

### Backend
- [ ] Update Talent model schema
- [ ] Create migration file
- [ ] Add `talentId` to related models
- [ ] Create Talent API routes
- [ ] Implement linking/unlinking logic
- [ ] Add audit logging
- [ ] Create Talent service layer

### Frontend
- [ ] Create Admin Talent Hub route
- [ ] Build Talent list view
- [ ] Build Talent detail view with tabs
- [ ] Add create/edit forms
- [ ] Implement linking UI
- [ ] Add filters and search
- [ ] Create metrics components

### Migration
- [ ] Write data backfill script
- [ ] Test migration on staging
- [ ] Create rollback plan
- [ ] Document migration steps

---

## Risks & Mitigations

### Risk 1: Breaking Existing Dashboards
**Mitigation:** Keep `userId` references during transition, add `talentId` alongside

### Risk 2: Data Inconsistency
**Mitigation:** Use transactions for linking, validate data integrity

### Risk 3: Performance Impact
**Mitigation:** Add indexes, use efficient queries, cache where appropriate

### Risk 4: User Confusion
**Mitigation:** Clear UI messaging, admin training, documentation

---

## Success Criteria

✅ Talent can exist without User account
✅ Admin can create/manage Talent independently
✅ All opportunities, deals, emails attach to Talent
✅ Exclusive talent get full oversight features
✅ Non-exclusive talent remain lightweight
✅ System scales without rewrites
✅ No breaking changes to existing dashboards
✅ Migration is safe and reversible

---

## Next Steps

1. Review and approve design
2. Create Prisma migration
3. Implement backend APIs
4. Build Admin UI
5. Test migration strategy
6. Deploy to staging
7. Production rollout

