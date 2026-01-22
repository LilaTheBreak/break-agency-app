# User Approval Fix - Single Admin Approval

## Issue
New user approvals were requiring two super admin users to approve instead of one, causing users to be stuck in a pending review state.

## Solution
Updated the user approval endpoint to require only **one super admin approval** instead of two.

### Changes Made

**File**: `apps/api/src/routes/adminUsers.ts`

**Endpoint**: `POST /api/admin/users/:id/approve`

**Before**:
- Required tracking of multiple approvers
- Users could get stuck if approval counting logic was broken

**After**:
- Single admin approval is sufficient
- User is immediately approved when one admin approves
- Clear logging of approver details

### How It Works

1. **Admin Review**: Super admin navigates to pending users page
2. **Single Approval**: Clicks "Approve" button for a pending user
3. **Immediate Access**: User's `onboarding_status` changes to `"approved"`
4. **User Access**: User can now log in and access the platform

### API Endpoint

```
POST /api/admin/users/:id/approve
```

**Request Body**:
```json
{
  "notes": "Optional approval notes"
}
```

**Response**:
```json
{
  "success": true,
  "message": "User approved successfully",
  "user": {
    "id": "user_123",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "CREATOR",
    "onboarding_status": "approved"
  }
}
```

### User Flow

```
New User Signup
    ↓
Completes Onboarding
    ↓
Status: pending_review
    ↓
Admin Approves (Single Approval)
    ↓
Status: approved ✓
    ↓
User Can Access Platform
```

### Requirements

- User must have `ADMIN` or `SUPER_ADMIN` role
- User must be in `pending_review` status
- Requires authentication

### Logging

The endpoint logs detailed approval information:
- Approver Admin ID and Role
- User ID being approved
- Whether notes were included
- Timestamp of approval

Example log:
```
[USER APPROVAL] User approved successfully
{
  userId: "user_123",
  email: "john@example.com",
  role: "CREATOR",
  approverAdminId: "admin_456",
  timestamp: "2026-01-22T10:30:00Z"
}
```

### Future Enhancements

If multi-level approvals are needed later, the `Approval` model can be used:
- Create `Approval` record with type `"PENDING_USER"`
- Track multiple approvers via separate approval instances
- Check count of approvals before setting `onboarding_status`

For now, single approval is the standard workflow.

## Testing

### Test Single Approval
1. Create new user account
2. Complete onboarding flow
3. Go to `/admin/user-approvals` or similar admin page
4. Click "Approve" for pending user
5. Verify user status changes to `"approved"`
6. User should be able to log in

### API Test
```bash
curl -X POST http://localhost:3000/api/admin/users/user_123/approve \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"notes": "Approved - valid email domain"}'
```

## Related Components

- **Frontend**: [apps/web/src/components/admin/PendingUsersApproval.jsx](apps/web/src/components/admin/PendingUsersApproval.jsx)
- **Backend**: [apps/api/src/routes/adminUsers.ts](apps/api/src/routes/adminUsers.ts#L87-L142)
- **Schema**: User model with `onboarding_status` field
- **API Model**: Generic `Approval` model (optional for tracking)

## Status

✅ **FIXED** - Users now require only one super admin approval
✅ **TESTED** - Approval flow verified
✅ **DEPLOYED** - Change committed to main branch

**Commit**: 06fe7e5
**Date**: January 22, 2026
