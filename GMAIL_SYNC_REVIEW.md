# Gmail Sync Feature - Technical Review

## Overview
The Gmail sync feature enables users to connect their Gmail accounts to the Break platform, sync emails into the database, and interact with them through the unified inbox interface.

---

## Architecture

### 1. OAuth Authentication Flow

#### Backend Routes
**File**: `/apps/api/src/routes/gmailAuth.ts`

```
GET  /api/gmail/auth/url          - Generate OAuth URL
GET  /api/gmail/auth/callback     - Handle OAuth callback
POST /api/gmail/auth/draft-queue  - Create Gmail draft from queue
```

#### OAuth Configuration
**File**: `/apps/api/src/integrations/gmail/googleAuth.ts`

**Scopes Requested**:
- `gmail.send` - Send emails via Gmail
- `gmail.readonly` - Read Gmail messages
- `userinfo.email` - User email address
- `userinfo.profile` - User profile info
- `openid` - OpenID Connect

**OAuth Settings**:
- `access_type: "offline"` - Get refresh token
- `prompt: "consent"` - Force consent screen (ensures refresh_token)

#### Token Storage
**Database Model**: `GmailToken`
```prisma
model GmailToken {
  userId       String    @id
  accessToken  String
  refreshToken String
  expiryDate   DateTime?
  scope        String?
  tokenType    String?
  idToken      String?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime
  User         User      @relation(...)
}
```

**Token Management**: `/apps/api/src/services/gmail/tokens.ts`
- Automatic token refresh via OAuth2 client event listener
- Updates database when tokens refresh
- Throws `GmailNotConnectedError` if no refresh token

---

### 2. Email Sync System

#### Sync Endpoint
```
POST /api/gmail/inbox/sync
```

**Controller**: `/apps/api/src/controllers/gmailInboxController.ts`
- Checks for Gmail connection
- Triggers sync via `syncInboxForUser()`
- Returns sync statistics

#### Sync Logic
**Service**: `/apps/api/src/services/gmail/syncInbox.ts`

**Process**:
1. Get OAuth client for user
2. Fetch last 100 messages from Gmail (filtered to `in:inbox`)
3. Get full message details via batch requests
4. Check existing messages in database (by `gmailId`)
5. Transform and map Gmail messages to database schema
6. Transactionally insert:
   - `InboxMessage` (thread-level)
   - `InboundEmail` (individual message)

**Sync Stats Returned**:
```typescript
{
  imported: number,  // New messages added
  updated: number,   // Existing messages updated
  skipped: number,   // Already in database
  failed: number     // Failed to process
}
```

**Performance**:
- Currently syncs last 100 messages
- Uses `Promise.all()` for parallel fetching
- ⚠️ **Limitation**: No incremental sync (always fetches 100)
- ⚠️ **Limitation**: No pagination for large mailboxes

---

### 3. Inbox Retrieval

#### Endpoints
```
GET /api/gmail/inbox              - Paginated inbox threads
GET /api/gmail/inbox/unread       - Unread threads only
GET /api/gmail/inbox/search?q=... - Search threads
GET /api/gmail/inbox/thread/:id   - Get single thread
```

**Service**: `/apps/api/src/services/gmail/inboxService.ts`

**Database Queries**:
- Fetches from `InboxMessage` + `InboundEmail` tables
- Filters by `userId`
- Supports pagination (`page`, `limit`)
- Filters by `isRead` status
- Full-text search on subject/body

---

### 4. Database Schema

#### InboxMessage (Thread Level)
```prisma
model InboxMessage {
  id              String          @id
  userId          String
  threadId        String          @unique
  subject         String?
  snippet         String?
  lastMessageTime DateTime?
  participants    String[]
  isRead          Boolean         @default(false)
  isStarred       Boolean         @default(false)
  labels          String[]
  createdAt       DateTime        @default(now())
  updatedAt       DateTime
  InboundEmail    InboundEmail[]
}
```

#### InboundEmail (Individual Messages)
```prisma
model InboundEmail {
  id                  String               @id
  userId              String?
  inboxMessageId      String?
  fromEmail           String
  toEmail             String
  subject             String?
  body                String?
  gmailId             String?              @unique
  threadId            String?
  receivedAt          DateTime             @default(now())
  direction           String               @default("inbound")
  parsedData          Json?
  rawPayload          Json?
  createdAt           DateTime             @default(now())
  updatedAt           DateTime
  InboxMessage        InboxMessage?
  // ... relations
}
```

---

## Frontend Integration

### 1. Gmail Connection Flow

**Hook**: `/apps/web/src/hooks/useGmailAuth.js`
**Service**: `/apps/web/src/services/gmailClient.js`

```javascript
// Get OAuth URL
const { url } = await getGmailAuthUrl();

// Redirect user to Google OAuth
window.location.href = url;

// After auth, user redirected to:
// http://localhost:5173/inbox?gmail_connected=1
```

### 2. Inbox UI
**Component**: `/apps/web/src/pages/InboxPage.jsx`

Features:
- Display synced Gmail messages
- Filter by read/unread
- Search messages
- View thread details
- Initiate new sync

---

## Current Issues & Limitations

### ⚠️ Critical Issues

1. **No Incremental Sync**
   - Always fetches last 100 messages
   - No tracking of last sync point
   - Wastes API quota on repeat syncs
   - **Fix**: Implement `historyId` tracking

2. **No Automatic Sync**
   - Only manual sync via button/API call
   - No background jobs or webhooks
   - **Fix**: Add scheduled job or Gmail Push notifications

3. **Limited Message Count**
   - Hard-coded 100 message limit
   - No way to sync older messages
   - **Fix**: Add pagination and history sync

4. **No Real-time Updates**
   - Changes in Gmail not reflected automatically
   - **Fix**: Implement Gmail Push API (Pub/Sub)

5. **Refresh Token Issues**
   - Warning logged if no refresh_token returned
   - Uses `prompt: "consent"` but should handle token expiry
   - **Fix**: Better error handling and re-auth flow

### ⚠️ Performance Issues

1. **Batch Request Pattern**
   - Uses `Promise.all()` for 100 messages
   - Could hit rate limits
   - **Fix**: Use Gmail batch API properly

2. **Database Transaction Overhead**
   - Each message in separate transaction
   - Could be batched
   - **Fix**: Batch insert operations

3. **No Caching**
   - Re-fetches all data on every request
   - **Fix**: Add Redis cache for frequently accessed threads

### ⚠️ Security Issues

1. **Token Storage**
   - Tokens stored in plaintext in database
   - **Fix**: Encrypt refresh tokens at rest

2. **No Token Rotation**
   - Refresh tokens never rotated
   - **Fix**: Implement periodic re-authentication

---

## Recommended Improvements

### 1. Implement Incremental Sync
```typescript
// Add to GmailToken model
model GmailToken {
  // ... existing fields
  lastHistoryId String?  // Track last sync point
  lastSyncAt    DateTime?
}

// Update sync logic
async function incrementalSync(userId: string) {
  const token = await prisma.gmailToken.findUnique({ where: { userId } });
  const historyId = token?.lastHistoryId;
  
  if (historyId) {
    // Use history.list to get only new changes
    const changes = await gmail.users.history.list({
      userId: 'me',
      startHistoryId: historyId
    });
    // Process only changed messages
  } else {
    // Full sync on first run
    await fullSync(userId);
  }
}
```

### 2. Add Background Sync Job
```typescript
// Add cron job or queue worker
import { CronJob } from 'cron';

// Sync every 5 minutes for active users
new CronJob('*/5 * * * *', async () => {
  const activeUsers = await prisma.gmailToken.findMany({
    where: {
      lastSyncAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Synced in last 24h
      }
    }
  });
  
  for (const token of activeUsers) {
    await syncInboxForUser(token.userId);
  }
});
```

### 3. Implement Gmail Push Notifications
```typescript
// Watch Gmail mailbox for changes
async function watchMailbox(userId: string) {
  const oauth = await getOAuthClientForUser(userId);
  const gmail = google.gmail({ version: 'v1', auth: oauth });
  
  await gmail.users.watch({
    userId: 'me',
    requestBody: {
      topicName: 'projects/YOUR_PROJECT/topics/gmail-push',
      labelIds: ['INBOX']
    }
  });
}

// Handle push notification webhook
router.post('/api/gmail/webhook', async (req, res) => {
  const message = req.body.message;
  const data = Buffer.from(message.data, 'base64').toString();
  const notification = JSON.parse(data);
  
  // Trigger sync for affected user
  await syncInboxForUser(notification.emailAddress);
  res.sendStatus(200);
});
```

### 4. Add Retry Logic
```typescript
async function syncWithRetry(userId: string, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await syncInboxForUser(userId);
    } catch (error) {
      if (attempt === maxRetries) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}
```

### 5. Encrypt Refresh Tokens
```typescript
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.TOKEN_ENCRYPTION_KEY; // 32 bytes
const IV_LENGTH = 16;

function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text: string): string {
  const parts = text.split(':');
  const iv = Buffer.from(parts.shift()!, 'hex');
  const encryptedText = Buffer.from(parts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}
```

---

## Testing Checklist

### OAuth Flow
- [ ] User can initiate Gmail connection
- [ ] OAuth callback stores tokens correctly
- [ ] Refresh token is present (not null)
- [ ] Access token refreshes automatically
- [ ] Error handling for denied consent
- [ ] Re-authentication flow when token revoked

### Email Sync
- [ ] Manual sync fetches messages
- [ ] Duplicate messages not created
- [ ] Thread grouping works correctly
- [ ] Sync stats accurate
- [ ] Large mailboxes handled (100+ messages)
- [ ] Error handling for API failures

### Inbox Display
- [ ] Messages display correctly
- [ ] Pagination works
- [ ] Search returns relevant results
- [ ] Unread filter works
- [ ] Thread view shows all messages
- [ ] Performance with large inboxes

### Token Management
- [ ] Expired tokens refresh automatically
- [ ] Invalid refresh token handled gracefully
- [ ] Token revocation detected
- [ ] Re-authentication prompt shown

---

## Environment Variables Required

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5001/api/gmail/auth/callback

# Frontend
FRONTEND_ORIGIN=http://localhost:5173

# Optional: For encryption
TOKEN_ENCRYPTION_KEY=your_32_byte_key
```

---

## API Documentation

### Connect Gmail Account
```
GET /api/gmail/auth/url
Response: { url: string }
```

### Manual Sync
```
POST /api/gmail/inbox/sync
Auth: Required
Response: {
  message: string,
  imported: number,
  updated: number,
  skipped: number,
  failed: number
}
```

### Get Inbox
```
GET /api/gmail/inbox?page=1&limit=25
Auth: Required
Response: {
  threads: InboxThread[],
  total: number,
  page: number,
  limit: number
}
```

### Search Inbox
```
GET /api/gmail/inbox/search?q=keyword
Auth: Required
Response: InboxThread[]
```

### Get Thread Details
```
GET /api/gmail/inbox/thread/:threadId
Auth: Required
Response: {
  thread: InboxThread,
  messages: InboundEmail[]
}
```

---

## Status: ✅ Functional with Limitations

**Working**:
- OAuth authentication flow
- Token storage and refresh
- Manual email sync
- Inbox display and search
- Thread grouping

**Needs Improvement**:
- Incremental sync (currently full sync only)
- Automatic background sync
- Message limits (100 cap)
- Real-time updates
- Token security
- Error handling
- Performance optimization

**Priority Fixes**:
1. Implement incremental sync with `historyId`
2. Add background sync job
3. Improve error handling and user feedback
4. Add token encryption
5. Implement Gmail Push notifications for real-time sync
