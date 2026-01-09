# Talent "View As" (Impersonation) Feature Implementation

**Status:** ✅ Complete  
**Commit:** `70ca279`  
**Date:** January 2025

## Overview

This document describes the complete implementation of the talent "View As" (impersonation) feature, which allows SUPERADMIN users to view the application as a specific talent would see it. This feature is essential for:

- Testing talent-facing features without switching accounts
- Debugging talent experience issues
- Supporting talent directly by seeing exactly what they see
- Auditing talent features and workflows

## Architecture

### 1. Frontend Context Layer

**File:** `apps/web/src/context/ImpersonationContext.jsx`

The impersonation context manages the client-side state for impersonation:

```javascript
const ImpersonationContext = createContext({
  isImpersonating: false,
  impersonatedTalent: null,
  startImpersonation: async (talentId, talentName) => {},
  stopImpersonation: async () => {},
});
```

**Key Features:**
- Stores impersonation state (talent ID, name, start time)
- Handles API calls to start/stop impersonation
- Provides hooks for components to react to impersonation state
- Tracks duration of impersonation session
- Persists state to localStorage for refresh resilience

**Provider:**
```javascript
const impersonationValue = {
  isImpersonating: Boolean(impersonationState.talentId),
  impersonatedTalent: impersonationState,
  startImpersonation: handleStartImpersonation,
  stopImpersonation: handleStopImpersonation
};

<ImpersonationContext.Provider value={impersonationValue}>
  {children}
</ImpersonationContext.Provider>
```

### 2. UI Components

#### ViewAsTalentButton

**File:** `apps/web/src/components/ViewAsTalentButton.jsx`

Button component displayed on talent profile pages (AdminTalentDetailPage):

```javascript
<ViewAsTalentButton 
  talentId={talent.id} 
  talentName={talent.displayName || talent.name} 
/>
```

**Behavior:**
- Only visible to SUPERADMIN users
- Displays "View as Talent" button with icon
- Shows loading state during API call
- Handles error states gracefully
- Confirmation dialog before starting impersonation
- Triggers impersonation context to start session

**Styling:**
- Primary button style with icon
- Disabled state while loading
- Tooltip showing feature description

#### ImpersonationBanner

**File:** `apps/web/src/components/ImpersonationBanner.jsx`

Persistent banner displayed globally when impersonating:

```javascript
<ImpersonationBanner />
```

**Features:**
- Appears at the top of all pages when impersonating
- Shows impersonated talent name and email
- Session duration tracking
- "Exit View As" button for ending impersonation
- Distinctive yellow/warning color scheme
- Cannot be dismissed while impersonating

**Location:** Rendered in `App.jsx` after the splash screen:
```javascript
<OnboardingReminderBanner />
<ImpersonationBanner />
<AppRoutes {...props} />
```

**Styling:**
- Yellow/amber background for visibility
- Icon indicating impersonation mode
- Real-time duration counter
- Responsive design

### 3. Backend Routes

**File:** `apps/api/src/routes/impersonate.ts`

Three main endpoints for managing impersonation:

#### POST /api/admin/impersonate/start

Initiates an impersonation session:

```bash
curl -X POST http://localhost:3000/api/admin/impersonate/start \
  -H "Content-Type: application/json" \
  -d '{"talentUserId": "user-id-123"}'
```

**Request:**
```json
{
  "talentUserId": "string (required)"
}
```

**Response:**
```json
{
  "success": true,
  "impersonationContext": {
    "actingAsUserId": "user-id-123",
    "actingAsRole": "CREATOR",
    "originalAdminId": "admin-id-456",
    "talentName": "Jane Doe",
    "talentEmail": "jane@example.com",
    "startedAt": "2025-01-15T10:30:00Z"
  }
}
```

**Security Checks:**
- Only SUPERADMIN can call this endpoint
- Cannot impersonate other admins/superadmins/founders
- Validates talent user exists
- Checks user role compatibility

**Audit Logging:**
- Logs `IMPERSONATION_STARTED` event
- Records admin ID, talent ID, IP address
- Includes talent metadata for audit trail

#### POST /api/admin/impersonate/stop

Ends an impersonation session:

```bash
curl -X POST http://localhost:3000/api/admin/impersonate/stop \
  -H "Content-Type: application/json" \
  -d '{
    "originalAdminId": "admin-id-456",
    "actingAsUserId": "user-id-123",
    "durationSeconds": 300
  }'
```

**Request:**
```json
{
  "originalAdminId": "string (required)",
  "actingAsUserId": "string (optional)",
  "durationSeconds": "number (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Impersonation ended"
}
```

**Security Checks:**
- Verifies admin ending impersonation is same as who started it
- Validates original admin authentication

**Audit Logging:**
- Logs `IMPERSONATION_ENDED` event
- Records duration of impersonation
- Includes talent metadata for audit trail

#### GET /api/admin/impersonate/status

Checks current impersonation status:

```bash
curl http://localhost:3000/api/admin/impersonate/status
```

**Response (not impersonating):**
```json
{
  "isImpersonating": false,
  "context": null
}
```

**Response (impersonating):**
```json
{
  "isImpersonating": true,
  "context": {
    "actingAsUserId": "user-id-123",
    "originalAdminId": "admin-id-456",
    "talentName": "Jane Doe",
    "startedAt": "2025-01-15T10:30:00Z"
  }
}
```

### 4. Audit Logging

**File:** `apps/api/src/services/auditLogger.ts`

Comprehensive audit logging service for impersonation events:

```typescript
await logAuditEvent({
  eventType: "IMPERSONATION_STARTED",
  userId: adminUserId,
  targetUserId: talentUserId,
  metadata: {
    talentName: talentUser.name,
    talentEmail: talentUser.email,
    talentRole: talentUser.role,
    ipAddress: clientIp,
  },
});
```

**Logged Events:**
- `IMPERSONATION_STARTED`: When admin starts viewing as talent
- `IMPERSONATION_ENDED`: When admin stops impersonation

**Audit Trail Includes:**
- Admin user ID (who performed the impersonation)
- Talent user ID (who was impersonated)
- IP address of the request
- Timestamp of the event
- Talent metadata (name, email, role)
- Session duration (for END events)

## User Workflows

### 1. Starting Impersonation

**Step 1:** Admin navigates to talent profile page
- Route: `/admin/talent/{talentId}`
- Component: `AdminTalentDetailPage`

**Step 2:** Admin clicks "View as Talent" button
- Only visible to SUPERADMIN role
- Located in profile header section

**Step 3:** Confirmation dialog appears
```
"View as Jane Doe (jane@example.com)?"
[Cancel] [View as Talent]
```

**Step 4:** Frontend calls:
```javascript
POST /api/admin/impersonate/start
{
  "talentUserId": "user-123"
}
```

**Step 5:** Impersonation context is updated:
- Banner appears at top of page
- Admin navigation may be hidden
- Views are now filtered for talent role
- Session duration tracking begins

**Step 6:** Admin can browse as talent
- View dashboard as talent would
- See only talent-relevant features
- Interact with opportunity boards
- Check messages and notifications

### 2. Ending Impersonation

**Option 1:** Click "Exit View As" in banner
- Button located in the impersonation banner
- Calls: `POST /api/admin/impersonate/stop`
- Clears impersonation state
- Returns to admin view

**Option 2:** Direct API call
```javascript
POST /api/admin/impersonate/stop
{
  "originalAdminId": "admin-456",
  "actingAsUserId": "user-123",
  "durationSeconds": 300
}
```

**Step 3:** View returns to admin mode
- Banner disappears
- Admin navigation is restored
- Original admin context is restored
- Session duration is logged

## Security Considerations

### Access Control

1. **Role-Based Access:**
   - Only `SUPERADMIN` can use impersonation
   - Regular admins cannot access this feature
   - Users cannot impersonate themselves

2. **Protected Users:**
   - Cannot impersonate other admins
   - Cannot impersonate superadmins
   - Cannot impersonate founders
   - Can only impersonate talent/creators/creators

3. **Authentication:**
   - Requires valid admin session
   - Middleware enforces admin role check
   - Admin ID is verified on both start and stop

### Audit Trail

1. **Comprehensive Logging:**
   - Every impersonation is logged
   - Original admin ID is recorded
   - Impersonated user ID is recorded
   - IP address is captured
   - Timestamp is recorded
   - Session duration is tracked

2. **Audit Query:**
   - Can search for all impersonations by admin
   - Can search for all impersonations of a user
   - Can track duration and time of impersonations
   - Can identify suspicious patterns

### Data Isolation

1. **Session Context:**
   - Impersonation is session-based, not account-based
   - Original admin credentials are not changed
   - Logout ends impersonation immediately
   - Refresh may restore impersonation from localStorage

2. **Frontend State:**
   - Context stored in React state and localStorage
   - Not stored in secure HTTP-only cookies
   - Frontend handles impersonation state
   - Backend validates admin credentials on each request

## Integration Points

### 1. AdminTalentDetailPage

**Location:** `apps/web/src/pages/AdminTalentDetailPage.jsx`

**Integration:**
```javascript
import { ViewAsTalentButton } from "../components/ViewAsTalentButton.jsx";

// In the talent profile header:
<ViewAsTalentButton 
  talentId={talent.id} 
  talentName={talent.displayName || talent.name} 
/>
```

**Placement:**
- Profile header section
- Next to other action buttons
- Only visible when talent data is loaded
- Only visible to SUPERADMIN users

### 2. App.jsx

**Location:** `apps/web/src/App.jsx`

**Integration:**
```javascript
import { ImpersonationBanner } from "./components/ImpersonationBanner.jsx";

// In the main app layout:
<MessagingContext.Provider value={messagingValue}>
  <OnboardingReminderBanner />
  <ImpersonationBanner />
  <AppRoutes {...props} />
</MessagingContext.Provider>
```

**Placement:**
- Global banner displayed on all routes
- Appears after splash screen and onboarding banner
- Always accessible during impersonation
- Cannot be dismissed

### 3. Server Registration

**Location:** `apps/api/src/server.ts`

**Integration:**
```typescript
import impersonateRouter from "./routes/impersonate.js";

// Register routes
app.use("/api/admin/impersonate", impersonateRouter);
```

**Endpoint Prefix:** `/api/admin/impersonate`

## Testing Checklist

### Frontend Tests

- [ ] "View as Talent" button only visible to SUPERADMIN
- [ ] Button click triggers confirmation dialog
- [ ] Dialog accepts/cancels impersonation
- [ ] Banner appears when impersonating
- [ ] Banner shows correct talent name
- [ ] Duration counter updates in real-time
- [ ] "Exit View As" button works correctly
- [ ] Impersonation persists on page refresh
- [ ] Navigation reflects talent role permissions
- [ ] Admin features are hidden while impersonating

### Backend Tests

- [ ] POST /admin/impersonate/start validates talent ID
- [ ] POST /admin/impersonate/start rejects non-SUPERADMIN
- [ ] POST /admin/impersonate/start rejects admin users
- [ ] POST /admin/impersonate/start creates audit log
- [ ] POST /admin/impersonate/stop validates admin ID
- [ ] POST /admin/impersonate/stop creates audit log
- [ ] GET /admin/impersonate/status returns correct state
- [ ] IP address captured correctly
- [ ] Timestamps are accurate

### Security Tests

- [ ] Regular admin cannot start impersonation
- [ ] User cannot impersonate self
- [ ] Cannot impersonate other admins
- [ ] Cannot impersonate superadmins
- [ ] Logout clears impersonation
- [ ] Session cannot be hijacked
- [ ] Audit trail is comprehensive

### Integration Tests

- [ ] ViewAsTalentButton displays on talent profile
- [ ] ImpersonationBanner displays globally
- [ ] Impersonation context providers work correctly
- [ ] API routes register correctly
- [ ] Audit logging fires correctly

## Future Enhancements

1. **Time Limits:**
   - Auto-exit impersonation after 60 minutes
   - Warning before auto-logout

2. **Scope Limiting:**
   - Restrict which features can be accessed while impersonating
   - Disable account modifications while impersonating
   - Read-only mode option

3. **Notifications:**
   - Alert talent that they were viewed as
   - Email notification to talent
   - Opt-in/opt-out for notifications

4. **Advanced Auditing:**
   - Record all actions taken while impersonating
   - Screenshot capability
   - Action replay/audit trail

5. **Temporary Passwords:**
   - Generate one-time password for talent
   - Allow actual login instead of impersonation
   - Shorter session lifetime

6. **Delegation:**
   - Allow admins to delegate impersonation to other admins
   - Role-based impersonation permissions
   - Manager-level approval

## Files Changed

### New Files
- `apps/web/src/context/ImpersonationContext.jsx` - Context provider
- `apps/web/src/components/ViewAsTalentButton.jsx` - UI button
- `apps/web/src/components/ImpersonationBanner.jsx` - Banner display
- `apps/api/src/routes/impersonate.ts` - Backend routes
- `apps/api/src/services/auditLogger.ts` - Audit logging

### Modified Files
- `apps/web/src/App.jsx` - Added banner import and display
- `apps/api/src/server.ts` - Registered impersonate routes
- `apps/web/src/pages/AdminTalentDetailPage.jsx` - Added button

## Deployment Notes

### Prerequisites
- Node.js with Express.js running
- Prisma ORM configured
- Database with User and AuditLog tables
- Environment variables configured

### Environment Variables
No new environment variables required. Uses existing:
- `DATABASE_URL` - Database connection
- `API_BASE_URL` - API endpoint (frontend)
- `NODE_ENV` - Environment mode

### Database
No database migrations required. Uses existing:
- `User` table (already exists)
- `AuditLog` table (already exists)

### Build & Deploy

```bash
# Frontend
cd apps/web
npm install
npm run build

# Backend
cd apps/api
npm install
npm run build

# Deploy as usual
```

## Monitoring & Support

### Key Metrics to Monitor
- Number of impersonation sessions per admin
- Average duration of impersonation
- Most frequently impersonated users
- Failed impersonation attempts
- Time between impersonations

### Support Commands

**Check audit logs:**
```sql
SELECT * FROM "AuditLog" 
WHERE "eventType" IN ('IMPERSONATION_STARTED', 'IMPERSONATION_ENDED')
ORDER BY "createdAt" DESC
LIMIT 100;
```

**Find all impersonations by admin:**
```sql
SELECT * FROM "AuditLog"
WHERE "userId" = 'admin-id-123'
AND "eventType" LIKE 'IMPERSONATION%'
ORDER BY "createdAt" DESC;
```

**Find all times a talent was impersonated:**
```sql
SELECT * FROM "AuditLog"
WHERE "targetUserId" = 'talent-id-456'
AND "eventType" = 'IMPERSONATION_STARTED'
ORDER BY "createdAt" DESC;
```

## Summary

The talent "View As" feature is now fully implemented with:

✅ **Frontend:**
- Impersonation context for state management
- View As button on talent profiles
- Persistent impersonation banner
- Responsive UI components

✅ **Backend:**
- API endpoints for starting/stopping impersonation
- Comprehensive security checks
- Audit logging for all impersonations

✅ **Security:**
- Role-based access control
- Protected user classes
- IP address tracking
- Session-based impersonation

✅ **Audit Trail:**
- Complete impersonation history
- Admin and talent tracking
- Duration and IP logging

The feature is ready for testing and deployment.
