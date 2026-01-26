# Single Admin Approval Confirmation

## Overview
The user approval system is configured to require **only ONE admin approval** per user. No multi-admin approval workflow is needed.

## Current System Architecture

### Approval Endpoints

#### 1. `/api/approvals/:id/approve` (General Approval System)
- **File**: `apps/api/src/routes/approvals.ts`
- **Role Required**: Admin
- **Action**: One admin clicks approve
- **Result**: 
  - Sets Approval status to "APPROVED"
  - Records the single admin's ID in `approverId`
  - Updates User's `onboarding_status` to "approved"
  - User can now access dashboard

#### 2. `/pending/:userId/approve` (Direct User Approval)
- **File**: `apps/api/src/routes/userApprovals.ts`
- **Role Required**: Admin
- **Action**: One admin clicks approve
- **Result**:
  - Updates User's `onboarding_status` to "approved"
  - Sets `onboardingComplete` to true
  - User can now access dashboard

### Data Model

```typescript
model Approval {
  id          String   @id @default(cuid())
  type        String
  title       String
  description String?
  status      String   @default("PENDING")    // "PENDING" | "APPROVED" | "REJECTED"
  requestorId String   // The user requesting approval
  approverId  String?  // The SINGLE admin who approves (only one!)
  ownerId     String?
  attachments Json[]   @default([])
  metadata    Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Key**: The `approverId` field is singular (not plural), indicating ONE admin approves.

## User Approval Flow

### Step 1: User Signs Up
- User creates account → `onboarding_status: "in_progress"`

### Step 2: User Completes Onboarding
- User fills out profile form

### Step 3: One Admin Reviews & Approves ✓ **SINGLE ADMIN ACTION**
- Admin goes to `/admin/approvals` page
- Admin reviews user's information
- Admin clicks "Approve" button
- Status changes to "APPROVED"
- User's `onboarding_status` becomes "approved"

### Step 4: User Access
- User can now access dashboard
- No further approval needed

## Implementation Details

### Approval Endpoint Implementation
```typescript
// Only ONE admin approval needed - no multi-approval logic
const updated = await prisma.approval.update({
  where: { id },
  data: {
    status: "APPROVED",
    approverId: req.user!.id,  // Single admin ID
  },
});

// Update user immediately after ONE approval
if (updated.Requestor?.id) {
  await prisma.user.update({
    where: { id: updated.Requestor.id },
    data: {
      onboarding_status: "approved",  // User approved after ONE admin says yes
    },
  });
}
```

## Admin Page (`AdminApprovalsPage.jsx`)

The approvals page shows:
- **Pending approvals** with count
- **Approve button** - one click approves
- **Reject button** - one click rejects
- No multi-approval requirement, no approval chains

## Key Confirmations

✅ **Single Admin Approval**
- One admin can approve a user alone
- No second admin approval required
- No approval chain or workflow

✅ **Immediate Effect**
- When ONE admin approves, user status changes immediately
- User can access dashboard right away
- No waiting for additional approvals

✅ **Database Design**
- `approverId` (singular) stores the approving admin
- `status` shows final decision after one admin acts
- No fields for tracking multiple approvals

## Testing the Approval Flow

### To Test Single Admin Approval:
1. Create test user signup at `/signup`
2. User completes onboarding
3. Go to `/admin/approvals` as superadmin
4. Find the pending approval
5. Click "Approve"
6. Verify user status changes to "approved"
7. User can now access dashboard ✓

No additional approvals needed!

## Conclusion

**The system is already optimized for single admin approval.** No changes are needed - this is the intended behavior.

- Commit: `d7edd0a` - Added clarifying comments to confirm single admin approval workflow
- Files updated:
  - `apps/api/src/routes/approvals.ts`
  - `apps/api/src/routes/userApprovals.ts`

---
**Last Updated**: January 26, 2026
**Status**: ✅ Confirmed - Single Admin Approval System in Place
