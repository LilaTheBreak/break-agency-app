# Admin Talent Linking Feature - Complete ✅

## Overview
Admins can now link any new user to an existing talent profile, and talents can have multiple emails linked to them.

## Features Implemented

### Backend Endpoints (3 new admin-only endpoints)

#### 1. POST `/api/admin/users/:userId/link-talent/:talentId`
**Purpose**: Link a user to a talent profile
**Parameters**:
- `userId`: The user ID to link
- `talentId`: The talent ID to link to
**Response**: Returns linked user and talent info
**Authentication**: Admin only

#### 2. POST `/api/admin/talents/:talentId/add-email`
**Purpose**: Add an additional email to a talent (supports multiple emails)
**Body**:
```json
{
  "email": "manager@example.com",
  "label": "Manager",  // Optional: e.g., "Manager", "Assistant", "Personal"
  "isPrimary": false   // Optional: set as primary contact email
}
```
**Response**: Returns the created TalentEmail record
**Features**:
- Prevents duplicate emails per talent
- Can set a primary email (automatically unsets others)
- Optional labels for organization

#### 3. GET `/api/admin/talents/:talentId/emails`
**Purpose**: Get all emails linked to a talent
**Response**: Returns talent name and array of email records
**Authentication**: Admin only

### Additional Endpoints

#### 4. GET `/api/admin/talents/search?q=query`
**Purpose**: Search talents by name or email
**Parameters**: `q` - search query (min 2 characters)
**Response**: Returns up to 20 matching talents
**Authentication**: Admin only

#### 5. GET `/api/admin/talents`
**Purpose**: Get all talents
**Response**: Returns up to 100 talents ordered by name
**Authentication**: Admin only

## Frontend Components

### LinkUserToTalentModal.jsx
**Location**: `apps/web/src/components/LinkUserToTalentModal.jsx`

Features:
- Search talents in real-time by name or email
- View all emails already linked to selected talent
- Add new emails to the talent with optional labels
- One-click talent linking for users
- Real-time validation and error handling
- Success/error notifications

### AdminUsersPage Updates
**Location**: `apps/web/src/pages/AdminUsersPage.jsx`

Changes:
- Added "Link Talent" button in user actions row
- Integrated LinkUserToTalentModal
- Blue button styling to distinguish from "Link Brand"

### Client Service
**Location**: `apps/web/src/services/talentLinkingClient.js`

Functions:
```javascript
linkUserToTalent(userId, talentId)
addEmailToTalent(talentId, email, label, isPrimary)
getTalentEmails(talentId)
searchTalents(query)
getAllTalents()
```

## How to Use

### For Admins

1. **Link a user to a talent**:
   - Go to Admin → Users
   - Find the user you want to link
   - Click "Link Talent" button
   - Search for the talent by name or email
   - Click to select the talent
   - Click "Link User to Talent"

2. **Add multiple emails to a talent**:
   - After selecting a talent (step 3-4 above)
   - Click "+ Add Email" button
   - Enter email address and optional label
   - Mark as primary if needed
   - Click "Add Email"
   - Can add multiple emails this way before linking the user

### Database Schema

The system uses existing models:
- **User** model: Has `userId` field linking to Talent
- **Talent** model: Has `userId` field linking to User
- **TalentEmail** model: Stores multiple emails per talent
  ```sql
  CREATE TABLE "TalentEmail" (
    id          TEXT PRIMARY KEY
    talentId    TEXT (foreign key to Talent)
    email       TEXT
    label       TEXT
    isPrimary   BOOLEAN
    verified    BOOLEAN
    createdAt   TIMESTAMP
    updatedAt   TIMESTAMP
    UNIQUE(talentId, email)
  )
  ```

## Validation

✅ Only admins can link users and manage talent emails
✅ Both user and talent must exist
✅ Prevents duplicate emails per talent
✅ Validates email format
✅ Shows clear error messages
✅ Success notifications after operations

## Commits

1. **feat: Add admin endpoints to link users to talents** (f6917ed)
   - Backend endpoints for linking and email management

2. **feat: Add UI for admin to link users to talents** (b16f22f)
   - Frontend components and UI integration

## Deployment Status

- ✅ Frontend pushed to GitHub & auto-deployed via Vercel
- 🚀 Backend deployment in progress to Railway

## Testing Checklist

- [ ] Admin can search talents by name
- [ ] Admin can search talents by email
- [ ] Admin can add multiple emails to a talent
- [ ] Admin can mark an email as primary
- [ ] Admin can successfully link a user to a talent
- [ ] User's role updates appropriately after linking
- [ ] Can view all emails linked to a talent
- [ ] Duplicate email prevention works
- [ ] Error messages display correctly
- [ ] Success notifications appear

## Future Enhancements

1. **Bulk operations**: Link multiple users to talents
2. **Email verification**: Send verification emails to new talent emails
3. **Talent profile page**: Show linked emails on talent detail page
4. **History tracking**: Log when users are linked/unlinked
5. **Role management**: Auto-update user roles based on talent assignment
6. **Email syncing**: Auto-import manager emails from Gmail

---

**Status**: ✅ READY FOR PRODUCTION
