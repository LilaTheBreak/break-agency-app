# EXCLUSIVE TALENT SNAPSHOT + ACCESS CONTROL - IMPLEMENTATION PLAN

## Phase 1: Data Model Changes

### 1.1 Create TalentUserAccess Model
**File:** `apps/api/prisma/schema.prisma`

Add after TalentAssignment:
```prisma
model TalentUserAccess {
  id        String   @id @default(cuid())
  talentId  String
  userId    String
  role      String   @default("VIEW")  // VIEW | MANAGE
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  Talent    Talent   @relation(fields: [talentId], references: [id], onDelete: Cascade)
  User      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([talentId, userId])
  @@index([talentId])
  @@index([userId])
}
```

**Migration:**
```bash
npx prisma migrate dev --name add_talent_user_access
```

### 1.2 Update Talent Model
Add relation:
```prisma
UserAccess  TalentUserAccess[]
```

---

## Phase 2: Backend Implementation

### 2.1 Talent Access Control Service
**File:** `apps/api/src/lib/talentAccessControl.ts`

```typescript
async function canViewTalent(userId: string, talentId: string): Promise<boolean>
async function canManageTalent(userId: string, talentId: string): Promise<boolean>
async function getTalentAccessLevel(userId: string, talentId: string): Promise<'NONE' | 'VIEW' | 'MANAGE'>
async function ensureTalentAccess(req: Request, talentId: string, level: 'VIEW' | 'MANAGE'): Promise<void>
async function setTalentAccess(talentId: string, userId: string, role: 'VIEW' | 'MANAGE' | 'NONE'): Promise<void>
```

### 2.2 Exclusive Talent Snapshot Endpoint
**File:** `apps/api/src/routes/dashboardExclusiveTalent.ts`

```typescript
// GET /api/admin/dashboard/exclusive-talent-snapshot
// Returns: Array of exclusive talents with deal aggregates + flags
```

Returns:
```json
[
  {
    id: "talent_123",
    name: "Creator Name",
    status: "ACTIVE",
    representationType: "EXCLUSIVE",
    managerId: "user_456",
    managerName: "Manager Name",
    deals: {
      openPipeline: 150000,
      confirmedRevenue: 75000,
      unpaid: 25000,
      activeCount: 5
    },
    flags: {
      dealsWithoutStage: 1,
      overdueDeals: 0,
      unpaidDeals: 2,
      noManagerAssigned: false
    }
  }
]
```

### 2.3 Add Access Control Checks
Update all talent endpoints to check access:
- GET /api/talent/:id
- PUT /api/talent/:id
- GET /api/talent/:id/deals
- POST /api/talent/:id/deals
- DELETE /api/talent/:id

---

## Phase 3: Frontend - Admin Dashboard

### 3.1 Exclusive Talent Snapshot Component
**File:** `apps/web/src/components/ExclusiveTalentSnapshot.jsx`

Renders:
- Talent name, status badge
- Open Pipeline / Confirmed Revenue / Unpaid (GBP)
- Active deals count
- Risk flags (visual badges)
- Actions: View Talent, Go to Deals

### 3.2 Add to Admin Overview
**File:** `apps/web/src/pages/AdminOverviewPage.jsx`

Insert section:
```jsx
<ExclusiveTalentSnapshot />
```

Position: Below system metrics, above AI sections

---

## Phase 4: Frontend - Talent Settings

### 4.1 Access Control Settings Component
**File:** `apps/web/src/components/TalentAccessSettings.jsx`

Features:
- Multi-select dropdown for users
- Toggle buttons: Can view / Can manage
- Save/cancel actions
- Success/error feedback

### 4.2 Add to Talent Page
**File:** `apps/web/src/pages/TalentDetailPage.jsx`

Add section: "Access Control"

---

## Data Flow

### Creating/Editing Talent Access
```
Admin selects users
Frontend sends: PATCH /api/talent/:id/access
Body: [{ userId, role: 'VIEW'|'MANAGE'|'NONE' }]
Backend updates TalentUserAccess
Returns updated access list
```

### Viewing Exclusive Talent
```
Admin loads /admin/overview
Frontend calls: GET /api/admin/dashboard/exclusive-talent-snapshot
Backend:
  1. Find all Talent where representationType = 'EXCLUSIVE'
  2. For each talent, aggregate deals
  3. Calculate flags
  4. Return snapshot
Frontend renders cards
```

---

## Access Rules (Enforced Server-Side)

### Rule 1: Superadmins Always Have Access
```typescript
if (isSuperAdmin(req.user)) return true; // Always allow
```

### Rule 2: Owner Has Full Access
```typescript
const talent = await prisma.talent.findUnique({ where: { id: talentId } });
if (talent.userId === userId || talent.managerId === userId) 
  return 'MANAGE';
```

### Rule 3: Explicit Access via TalentUserAccess
```typescript
const access = await prisma.talentUserAccess.findUnique({
  where: { talentId_userId: { talentId, userId } }
});
return access?.role || 'NONE';
```

### Rule 4: Return 403, Not 500
```typescript
const level = await getTalentAccessLevel(userId, talentId);
if (level === 'NONE') {
  return res.status(403).json({ error: 'Access denied' });
}
if (requireManage && level !== 'MANAGE') {
  return res.status(403).json({ error: 'Manage permission required' });
}
```

---

## Defaults

### For Existing Talents (Migration)
On first deployment:
```typescript
// For each Talent:
// 1. Create access for talent.userId with role 'MANAGE'
// 2. Create access for all superadmins with role 'MANAGE'
// 3. Create access for talent.managerId (if exists) with role 'MANAGE'
```

### For New Talents (POST /api/talent)
Require at least one manager:
```typescript
if (!req.body.managerId && !req.body.assignedTo?.length) {
  return res.status(400).json({ 
    error: 'At least one manager must be assigned' 
  });
}
```

---

## Testing Checklist

- [ ] TalentUserAccess model created + migration applied
- [ ] canViewTalent() works for superadmin, owner, assigned manager
- [ ] canManageTalent() enforces edit-only for VIEW role
- [ ] GET /api/admin/dashboard/exclusive-talent-snapshot returns data
- [ ] Talent cards show on Admin Overview
- [ ] Access Settings UI renders
- [ ] Selecting users + roles + saving works
- [ ] Managers only see assigned talent
- [ ] 403 returned (not 500) for access denied
- [ ] Empty exclusive talent list shows proper empty state

---

## Files to Create

1. `apps/api/src/lib/talentAccessControl.ts` - Access control logic
2. `apps/api/src/routes/dashboardExclusiveTalent.ts` - Snapshot endpoint
3. `apps/web/src/components/ExclusiveTalentSnapshot.jsx` - Dashboard card
4. `apps/web/src/components/TalentAccessSettings.jsx` - Settings UI

## Files to Modify

1. `apps/api/prisma/schema.prisma` - Add TalentUserAccess model
2. `apps/web/src/pages/AdminOverviewPage.jsx` - Add snapshot component
3. `apps/web/src/pages/TalentDetailPage.jsx` - Add access control section
4. All talent endpoints - Add access checks

---

**Status:** Ready to implement  
**Priority:** Critical  
**Complexity:** Medium-High  
**Estimated Time:** 3-4 hours
