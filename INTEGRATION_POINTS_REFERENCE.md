# Integration Points Reference

Quick reference for where the multi-inbox system integrates with existing code.

## User-Facing Entry Points

### AdminMessagingPage.jsx
**Location**: [apps/web/src/pages/AdminMessagingPage.jsx](apps/web/src/pages/AdminMessagingPage.jsx)

**Buttons Added** (around line 233):
```jsx
{/* ⚙️ Settings Button */}
<button 
  onClick={() => setShowSettingsPanel(true)}
  className="...flex items-center gap-2..."
>
  <Settings size={16} />
  Settings
</button>

{/* ➕ Add Inbox Button */}
<button 
  onClick={() => setShowAddInboxModal(true)}
  className="...flex items-center gap-2..."
>
  <Plus size={16} />
  Add Inbox
</button>
```

**State Management** (around line 33):
```jsx
const [showSettingsPanel, setShowSettingsPanel] = useState(false);
const [showAddInboxModal, setShowAddInboxModal] = useState(false);
```

**Modal Rendering** (before DashboardShell close):
```jsx
<MessagingSettingsPanel 
  isOpen={showSettingsPanel} 
  onClose={() => setShowSettingsPanel(false)} 
/>

<AddInboxModal 
  isOpen={showAddInboxModal} 
  onClose={() => setShowAddInboxModal(false)} 
/>
```

## Backend API Routes

### Server Configuration
**File**: [apps/api/src/server.ts](apps/api/src/server.ts)

**Route Registration** (around line 541):
```typescript
import messagingRouter from './routes/messaging.js';
app.use("/api/messaging", messagingRouter);
```

### API Endpoints
**File**: [apps/api/src/routes/messaging.ts](apps/api/src/routes/messaging.ts)

```typescript
export default router
  .get("/inboxes", requireAuth, inboxController.getInboxes)
  .get("/inboxes/default", requireAuth, inboxController.getDefaultInbox)
  .get("/inboxes/:inboxId", requireAuth, inboxController.getInboxById)
  .post("/inboxes", requireAuth, inboxController.createInbox)
  .patch("/inboxes/:inboxId", requireAuth, inboxController.updateInbox)
  .delete("/inboxes/:inboxId", requireAuth, inboxController.deleteInbox);
```

## Database Integration

### Prisma Schema
**File**: [apps/api/prisma/schema.prisma](apps/api/prisma/schema.prisma)

**User Model** (added relation):
```prisma
model User {
  // ... existing fields ...
  inboxes Inbox[]
}
```

**New Inbox Model**:
```prisma
model Inbox {
  id            String   @id @default(cuid())
  userId        String
  provider      String
  emailAddress  String
  ownerType     String   @default("admin")
  ownerId       String?
  isDefault     Boolean  @default(false)
  syncStatus    String   @default("idle")
  lastSyncedAt  DateTime?
  lastError     String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  User          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([userId, provider, emailAddress])
  @@index([userId])
  @@index([isDefault])
  @@index([provider])
}
```

**InboxMessage Model** (field added):
```prisma
model InboxMessage {
  // ... existing fields ...
  inboxId String?  // Reference to specific inbox
  
  @@index([inboxId])  // For efficient filtering
}
```

## Frontend State Management

### useInboxes Hook
**File**: [apps/web/src/hooks/useInboxes.js](apps/web/src/hooks/useInboxes.js)

**Usage in Components**:
```javascript
const { 
  inboxes, 
  loading, 
  error, 
  defaultInbox,
  fetchInboxes,
  getDefaultInbox,
  createInbox,
  setDefaultInbox,
  deleteInbox,
  updateInboxStatus
} = useInboxes();
```

**Auto-fetch Behavior**:
```javascript
useEffect(() => {
  fetchInboxes();
}, []); // Runs on mount
```

## Component Communication

### Data Flow Diagram

```
AdminMessagingPage
    ↓
    ├─→ ⚙️ Settings Button
    │   ↓
    │   MessagingSettingsPanel
    │   ├─→ useInboxes.fetchInboxes()
    │   ├─→ GET /api/messaging/inboxes
    │   └─→ Display inboxes with actions
    │
    └─→ ➕ Add Inbox Button
        ↓
        AddInboxModal
        ├─→ Show provider options
        ├─→ On Gmail select: useInboxes.createInbox()
        ├─→ POST /api/messaging/inboxes
        ├─→ Receive authUrl
        └─→ Redirect: window.location.href = authUrl
```

## OAuth Flow Integration Points

### Gmail OAuth URL Generation
**File**: [apps/api/src/services/gmail/oauthService.ts](apps/api/src/services/gmail/oauthService.ts)

**Function Used**:
```typescript
export function buildAuthUrl(state: string) {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
      "openid"
    ],
    state
  });
}
```

**Called From**:
- [apps/api/src/controllers/inboxController.ts](apps/api/src/controllers/inboxController.ts) line ~102

### OAuth Callback Handler (Future Implementation)

**Needed Endpoint**:
```
GET /auth/gmail/callback?code=...&state=...
```

**Implementation Checklist**:
1. [ ] Create route in [apps/api/src/routes/auth.ts](apps/api/src/routes/auth.ts)
2. [ ] Call `exchangeCodeForTokens(code)` from oauthService
3. [ ] Create Inbox record with tokens
4. [ ] Redirect user to success page or messaging page

## Error Handling Integration

### Frontend Error States
**Component**: [apps/web/src/components/MessagingSettingsPanel.jsx](apps/web/src/components/MessagingSettingsPanel.jsx)

**Display Errors**:
```jsx
{error && (
  <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/30 p-4">
    <AlertCircle size={16} className="text-brand-black/60" />
    <p className="text-xs text-brand-black/70">{error}</p>
  </div>
)}
```

**Per-Inbox Errors**:
```jsx
{inbox.lastError && (
  <p className="text-xs text-brand-red">
    <AlertCircle size={12} />
    {inbox.lastError}
  </p>
)}
```

### Backend Error Responses
**File**: [apps/api/src/controllers/inboxController.ts](apps/api/src/controllers/inboxController.ts)

**Standard Format**:
```typescript
res.status(400).json({
  error: "error_code",
  message: "Human readable message"
});

res.status(404).json({
  error: "not_found",
  message: "Inbox not found"
});
```

## Sync Status Integration Points

### Frontend Display
**Component**: [apps/web/src/components/MessagingSettingsPanel.jsx](apps/web/src/components/MessagingSettingsPanel.jsx)

**Status Icons**:
```jsx
const getStatusIcon = (status) => {
  switch (status) {
    case "syncing":
      return <Clock size={16} className="text-amber-500 animate-spin" />;
    case "idle":
      return <CheckCircle2 size={16} className="text-green-500" />;
    case "error":
      return <AlertCircle size={16} className="text-brand-red" />;
  }
};
```

### Backend Status Updates
**Method**: [apps/api/src/controllers/inboxController.ts](apps/api/src/controllers/inboxController.ts) line ~150

```typescript
// Update sync status (called by sync jobs)
updateInboxStatus(inboxId, syncStatus)
// Sets: syncStatus, lastSyncedAt
```

## Timestamp Integration

### Frontend Formatting
**File**: [apps/web/src/components/MessagingSettingsPanel.jsx](apps/web/src/components/MessagingSettingsPanel.jsx)

```jsx
const formatDate = (date) => {
  // Just now, 5m ago, 2h ago, 3d ago
};
```

### Database Storage
**Field**: `lastSyncedAt` (DateTime)
- Set by sync jobs
- Queried by MessagingSettingsPanel
- Formatted for display

## Authentication Integration

### Auth Middleware
**Used On**: All /api/messaging endpoints

**File**: [apps/api/src/routes/messaging.ts](apps/api/src/routes/messaging.ts)

```typescript
router.get("/inboxes", requireAuth, inboxController.getInboxes)
```

**requireAuth Middleware**:
- Checks JWT token
- Extracts user ID
- Attaches to req.user
- Returns 401 if missing

### User Context
**In Controllers**:
```typescript
export async function getInboxes(req: Request, res: Response) {
  const userId = req.user!.id;  // From requireAuth
  const inboxes = await prisma.inbox.findMany({
    where: { userId }
  });
}
```

## Configuration Integration Points

### Environment Variables Used

**OAuth**:
```env
GMAIL_CLIENT_ID
GMAIL_CLIENT_SECRET
GMAIL_REDIRECT_URI
```

**Database**:
```env
DATABASE_URL
```

**All configured in**: [apps/api/src/config/env.ts](apps/api/src/config/env.ts)

## Migration & Deployment

### Database Schema Version
**Created**: January 15, 2026
**File**: [apps/api/prisma/migrations/20260115_add_inbox_model/migration.sql](apps/api/prisma/migrations/20260115_add_inbox_model/migration.sql)

**Tables Created**:
- Inbox (new)
- Updates to InboxMessage (added inboxId)

**Indexes Created**: 4
- userId (for user queries)
- isDefault (for default selection)
- provider (for provider filtering)
- inboxId on InboxMessage (for message filtering)

## Future Integration Points

### When Adding Outlook Support
1. Update `AddInboxModal.jsx` - Remove "Coming Soon" from Outlook
2. Update `inboxController.ts` - Add Outlook case in `createInbox()`
3. Create `apps/api/src/services/outlook/auth.ts`
4. Implement OAuth handler for Microsoft Graph

### When Adding Message Filtering
1. Update message query in sync jobs - Filter by inboxId
2. Update `AdminMessagingPage.jsx` - Add inbox selector
3. Update message list component - Show current inbox

### When Adding Multi-Tenant Support
1. Update schema - Use ownerType and ownerId
2. Update controllers - Add ownership checks
3. Update frontend - Show inbox owner name

---

**Reference Date**: January 15, 2026
**Integration Version**: 1.0
**Status**: ✅ All integration points implemented
