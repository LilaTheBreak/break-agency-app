# Multi-User Talent Account Linking Feature

## Overview

The talent management system now supports linking multiple user accounts to a single talent profile, with each linked account assigned specific roles and representation types.

## Key Features

✅ **Multiple Account Linking** - Link multiple user accounts to one talent  
✅ **Role-Based Access** - Assign VIEW or MANAGE permissions per account  
✅ **Representation Types** - Define relationship: EXCLUSIVE, NON_EXCLUSIVE, MANAGEMENT, UGC, OTHER  
✅ **Status Control** - Activate/deactivate accounts without deletion  
✅ **Audit Logging** - All changes logged for compliance  
✅ **User Search** - Quick user lookup when adding accounts  

---

## Data Model

### TalentUserAccess Schema

Updated Prisma model with new fields:

```typescript
model TalentUserAccess {
  id                   String   @id @default(cuid())
  talentId             String
  userId               String
  role                 String   @default("VIEW")           // VIEW | MANAGE
  representationType   String   @default("NON_EXCLUSIVE")   // EXCLUSIVE, NON_EXCLUSIVE, MANAGEMENT, UGC, OTHER
  status               String   @default("ACTIVE")         // ACTIVE | INACTIVE
  notes                String?                             // Notes about relationship
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  Talent Talent @relation("TalentAccess", fields: [talentId], references: [id], onDelete: Cascade)
  User   User   @relation("TalentAccessGiven", fields: [userId], references: [id], onDelete: Cascade)

  @@unique([talentId, userId])
  @@index([talentId])
  @@index([userId])
  @@index([representationType])
  @@index([status])
}
```

### Representation Types

| Type | Label | Use Case |
|------|-------|----------|
| **EXCLUSIVE** | Exclusive Talent | Full-service representation, agency handles all opportunities |
| **NON_EXCLUSIVE** | Non-Exclusive | Project-based, talent can work with other agencies |
| **MANAGEMENT** | Management | Management company, handles business side |
| **UGC** | User Generated Content | UGC creator relationship |
| **OTHER** | Other | Custom relationship types |

### Access Roles

| Role | Permission | Use Case |
|------|-----------|----------|
| **VIEW** | Read-only access | Managers who monitor but don't modify |
| **MANAGE** | Full management | Dedicated account managers |

---

## API Endpoints

### 1. List All Linked Accounts

```http
GET /api/admin/talent/:talentId/linked-users
```

**Response:**
```json
{
  "linkedAccounts": [
    {
      "id": "acc_123",
      "userId": "user_456",
      "user": {
        "id": "user_456",
        "email": "manager@agency.com",
        "name": "Jane Manager",
        "avatarUrl": "...",
        "role": "ADMIN"
      },
      "role": "MANAGE",
      "representationType": "EXCLUSIVE",
      "status": "ACTIVE",
      "notes": "Primary exclusive representation",
      "createdAt": "2026-01-24T10:00:00Z"
    }
  ]
}
```

### 2. Add Linked Account

```http
POST /api/admin/talent/:talentId/linked-users

Content-Type: application/json
{
  "userId": "user_456",
  "role": "MANAGE",
  "representationType": "EXCLUSIVE",
  "notes": "Primary exclusive representation"
}
```

**Response:** `201 Created` with the new linked account object

**Validation:**
- `userId` required (must exist)
- `role` must be VIEW or MANAGE
- `representationType` must be valid type
- Cannot link same user twice to same talent

### 3. Update Linked Account

```http
PATCH /api/admin/talent/:talentId/linked-users/:accessId

Content-Type: application/json
{
  "role": "VIEW",
  "representationType": "MANAGEMENT",
  "status": "INACTIVE",
  "notes": "Updated notes"
}
```

**Response:** Updated linked account object

**Allowed Updates:**
- `role` - Change access level
- `representationType` - Change relationship type
- `status` - Activate/deactivate
- `notes` - Update relationship notes

### 4. Remove Linked Account

```http
DELETE /api/admin/talent/:talentId/linked-users/:accessId
```

**Response:**
```json
{
  "message": "Linked account removed successfully"
}
```

---

## Frontend Components

### LinkedUserAccountsManager

Main component for managing talent's linked user accounts.

**Location:** `apps/web/src/components/LinkedUserAccountsManager.jsx`

**Features:**
- Display list of all linked accounts
- Show account status, roles, and representation types
- Edit existing accounts
- Delete accounts with confirmation
- Add new accounts

**Usage:**

```jsx
import { LinkedUserAccountsManager } from '../components/LinkedUserAccountsManager.jsx';

<LinkedUserAccountsManager talentId={talent.id} />
```

### LinkedAccountModal

Modal dialog for adding or editing linked accounts.

**Features:**
- User selection dropdown with search
- Representation type selector
- Access level selector
- Optional notes field
- Form validation

---

## UI in AdminTalentDetailPage

The "Linked User Account" section has been replaced with the new manager:

```jsx
<CollapsibleDetailSection
  title="Linked User Accounts"
  badge={talent?.linkedUsers?.length ? `${talent.linkedUsers.length} accounts` : "Not Linked"}
>
  <LinkedUserAccountsManager talentId={talent.id} />
</CollapsibleDetailSection>
```

### Display Features

✅ **List View** - All linked accounts in card format  
✅ **Status Badges** - Color-coded representation types and roles  
✅ **Account Details** - Email, name, relationship notes  
✅ **Action Buttons** - Edit and delete with confirmation  
✅ **Empty State** - Helper message when no accounts linked  

---

## Usage Examples

### Scenario 1: Exclusive Talent with Manager

```javascript
// Primary exclusive representation
POST /api/admin/talent/talent_123/linked-users
{
  "userId": "user_manager1",
  "role": "MANAGE",
  "representationType": "EXCLUSIVE",
  "notes": "Primary exclusive representation, full control"
}

// Secondary manager (monitoring)
POST /api/admin/talent/talent_123/linked-users
{
  "userId": "user_manager2",
  "role": "VIEW",
  "representationType": "EXCLUSIVE",
  "notes": "Secondary contact for scheduling"
}
```

### Scenario 2: UGC Creator with Management

```javascript
// UGC Creator Account
POST /api/admin/talent/talent_456/linked-users
{
  "userId": "user_creator",
  "role": "MANAGE",
  "representationType": "UGC",
  "notes": "Creator's personal account"
}

// Management Company
POST /api/admin/talent/talent_456/linked-users
{
  "userId": "user_mgmt",
  "role": "MANAGE",
  "representationType": "MANAGEMENT",
  "notes": "Handles contracts and payments"
}
```

### Scenario 3: Update Representation Type

```javascript
// Change from non-exclusive to exclusive
PATCH /api/admin/talent/talent_789/linked-users/acc_999
{
  "representationType": "EXCLUSIVE"
}
```

---

## Audit Logging

All operations are logged with:

| Operation | Audit Action | Logged Data |
|-----------|--------------|------------|
| Add Link | TALENT_USER_LINKED | User ID, email, type, role |
| Update Link | TALENT_USER_UPDATED | Changed fields |
| Remove Link | TALENT_USER_UNLINKED | User ID, email |

Example log:
```json
{
  "action": "TALENT_USER_LINKED",
  "entityType": "Talent",
  "entityId": "talent_123",
  "metadata": {
    "linkedUserId": "user_456",
    "linkedUserEmail": "manager@agency.com",
    "representationType": "EXCLUSIVE",
    "role": "MANAGE",
    "talentName": "Sarah Smith"
  }
}
```

---

## Database Queries

### Get all accounts for a talent

```sql
SELECT * FROM "TalentUserAccess"
WHERE "talentId" = 'talent_123'
ORDER BY "createdAt" DESC;
```

### Get accounts by representation type

```sql
SELECT * FROM "TalentUserAccess"
WHERE "talentId" = 'talent_123'
AND "representationType" = 'EXCLUSIVE'
AND "status" = 'ACTIVE';
```

### Count management accounts

```sql
SELECT COUNT(*) as "managementCount"
FROM "TalentUserAccess"
WHERE "representationType" = 'MANAGEMENT'
AND "status" = 'ACTIVE';
```

---

## Backend Implementation Details

### New Route Handlers

All handlers are in `apps/api/src/routes/admin/talent.ts`:

1. **GET /:id/linked-users** (line ~1160)
   - Fetches all linked accounts for talent
   - Includes user details (email, name, avatar)
   - Sorted by creation date

2. **POST /:id/linked-users** (line ~1210)
   - Creates new TalentUserAccess record
   - Validates user exists
   - Checks duplicate link
   - Logs audit event

3. **PATCH /:talentId/linked-users/:accessId** (line ~1310)
   - Updates role, representation type, or status
   - Validates input types
   - Logs all changes

4. **DELETE /:talentId/linked-users/:accessId** (line ~1380)
   - Removes TalentUserAccess record
   - Logs destructive action
   - Non-cascading (safe deletion)

---

## Migration Steps (Already Completed)

✅ Updated `TalentUserAccess` model in `schema.prisma`  
✅ Applied database migration with `prisma db push`  
✅ Added new fields to schema  
✅ Created backend endpoints  
✅ Built frontend components  
✅ Integrated into AdminTalentDetailPage  

---

## Testing

### Manual Test Steps

1. **Add Account:**
   - Navigate to talent's detail page
   - Go to "Linked User Accounts" section
   - Click "Link Account"
   - Select user, representation type, access level
   - Click "Link"
   - Verify account appears in list

2. **Edit Account:**
   - Click edit icon on account card
   - Change representation type or access level
   - Click "Update"
   - Verify changes reflected

3. **Delete Account:**
   - Click delete icon
   - Confirm in dialog
   - Verify account removed from list

4. **Verify Audit Logging:**
   - Check AuditLog table for entries
   - Verify action, entityId, metadata

### API Test Examples

```bash
# List accounts
curl -X GET \
  "http://localhost:3001/api/admin/talent/talent_123/linked-users" \
  -H "Authorization: Bearer TOKEN"

# Add account
curl -X POST \
  "http://localhost:3001/api/admin/talent/talent_123/linked-users" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_456",
    "role": "MANAGE",
    "representationType": "EXCLUSIVE",
    "notes": "Primary manager"
  }'

# Update account
curl -X PATCH \
  "http://localhost:3001/api/admin/talent/talent_123/linked-users/acc_999" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "representationType": "MANAGEMENT"
  }'

# Delete account
curl -X DELETE \
  "http://localhost:3001/api/admin/talent/talent_123/linked-users/acc_999" \
  -H "Authorization: Bearer TOKEN"
```

---

## Security Considerations

✅ **Admin-Only** - All endpoints require admin authentication  
✅ **Audit Trail** - All changes logged for compliance  
✅ **Constraint** - Unique index prevents duplicate user links  
✅ **Validation** - Input types validated before database write  
✅ **Authorization** - Access checks on talentId ownership  

---

## Future Enhancements

- [ ] Bulk import/export of linked accounts
- [ ] Template-based role assignments
- [ ] Notification on role changes
- [ ] Account linking workflows
- [ ] Custom representation types
- [ ] Inheritance of roles for sub-accounts

---

## Files Modified

| File | Changes |
|------|---------|
| `apps/api/prisma/schema.prisma` | Added fields to TalentUserAccess |
| `apps/api/src/routes/admin/talent.ts` | Added 4 new endpoints |
| `apps/web/src/components/LinkedUserAccountsManager.jsx` | NEW - Main UI component |
| `apps/web/src/pages/AdminTalentDetailPage.jsx` | Integrated new component |

---

## Commit Reference

- **Hash**: fd98af6
- **Message**: feat: Implement multi-user account linking with role assignment for talents

---

## Support

For questions or issues with the multi-user talent linking feature:

1. Check the audit logs for what changed
2. Verify user exists in system
3. Ensure admin permissions
4. Review database constraints
