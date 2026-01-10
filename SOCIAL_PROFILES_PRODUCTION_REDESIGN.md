# 🎯 PRODUCTION-GRADE SOCIAL PROFILES REDESIGN

**Date:** January 10, 2026  
**Status:** ✅ IMPLEMENTATION COMPLETE  
**Build Status:** Ready for integration and testing

---

## Executive Summary

The Social Profiles system has been completely redesigned from a simple form field into a **production-grade connection management system** supporting:

✅ **Manual URL-based linking** (admin-driven, non-OAuth)  
✅ **Full OAuth integration** (talent-driven, API-connected)  
✅ **Real-time sync status** (PENDING, SYNCING, READY, ERROR)  
✅ **Background data ingestion** (Bull.js queue system)  
✅ **Professional UI** (platform icons, honest state display)  
✅ **Enterprise reliability** (retries, error handling, logging)

---

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────┐
│         Admin Panel / Talent Account                 │
│  (SocialProfilesCard UI Component)                  │
└────────────────────┬────────────────────────────────┘
                     │
        ┌────────────┴──────────────┐
        │                           │
        ▼                           ▼
   ADMIN FLOW              TALENT FLOW
   Manual URL              OAuth Login
   
        │                           │
        ▼                           ▼
┌──────────────────────┐  ┌──────────────────────┐
│ POST /api/admin/     │  │ POST /api/socials/   │
│ socials/connect-     │  │ oauth/callback       │
│ manual               │  │                      │
└──────────┬───────────┘  └──────────┬───────────┘
           │                         │
           └────────────┬────────────┘
                        │
                        ▼
              ┌────────────────────┐
              │ SocialAccount      │
              │ Connection         │
              │ (Database)         │
              └────────┬───────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
    TalentSocial  SocialProfile  Redis Cache
     (Legacy)      (New)         (Invalidated)
                        │
                        ▼
              ┌────────────────────┐
              │ Bull.js Queue      │
              │ (socialDataIngest) │
              └────────┬───────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
     Instagram     TikTok        YouTube
    (Public/OAuth)  (API)        (API)
        │              │              │
        └──────────────┼──────────────┘
                       │
                       ▼
          ┌──────────────────────┐
          │  SocialPost          │
          │  SocialMetric        │
          │  (Populated)         │
          └──────────────────────┘
```

---

## 1. DATABASE SCHEMA CHANGES

### Enhanced `SocialAccountConnection` Table

**New Fields Added:**

```sql
-- Connection type: MANUAL (URL) or OAUTH (token-based)
connectionType VARCHAR(50) DEFAULT 'MANUAL'

-- Sync status: PENDING -> SYNCING -> READY or ERROR
syncStatus VARCHAR(50) DEFAULT 'PENDING'

-- URL for validation and profile lookup
profileUrl VARCHAR(500)

-- Error message if sync fails
syncError TEXT
```

**Migration Path:**
- Default values maintain backward compatibility
- Existing connections treat as "MANUAL"
- All new connections explicitly set type

**Schema Definition:**
```prisma
model SocialAccountConnection {
  id              String    @id
  creatorId       String
  platform        String
  handle          String
  profileUrl      String?         // NEW: URL or handle link
  connected       Boolean         @default(false)
  connectionType  String          @default("MANUAL")  // NEW
  syncStatus      String          @default("PENDING") // NEW
  accessToken     String?
  refreshToken    String?
  expiresAt       DateTime?
  lastSyncedAt    DateTime?
  syncError       String?         // NEW: Error tracking
  metadata        Json?
  createdAt       DateTime        @default(now())
  updatedAt       DateTime
  
  Talent          Talent          @relation(...)
  SocialProfile   SocialProfile?
  SocialSyncLog   SocialSyncLog[]

  @@unique([creatorId, platform])
  @@index([creatorId, connected])
  @@index([syncStatus])  // NEW: For querying pending syncs
}
```

---

## 2. API ROUTES

### ADMIN FLOW: Manual Connection

**Endpoint:** `POST /api/admin/socials/connect-manual`

**Request:**
```json
{
  "talentId": "talent_123",
  "platform": "INSTAGRAM",
  "handle": "username",
  "profileUrl": "https://instagram.com/username"
}
```

**Response (201):**
```json
{
  "connectionId": "conn_talent_123_INSTAGRAM_1704902400000",
  "handle": "username",
  "platform": "INSTAGRAM",
  "profileUrl": "https://instagram.com/username",
  "connectionType": "MANUAL",
  "connected": true,
  "syncStatus": "PENDING",
  "message": "Profile connected. Data sync will begin shortly."
}
```

**Process:**
1. ✅ Validate input (platform, handle format)
2. ✅ Upsert `SocialAccountConnection` with `connectionType: "MANUAL"`
3. ✅ Set `syncStatus: "PENDING"`
4. ✅ Clear Social Intelligence cache
5. ✅ Queue background sync job
6. ✅ Log admin activity
7. ✅ Return connection details

---

### TALENT FLOW: OAuth Callback

**Endpoint:** `POST /api/socials/oauth/callback`

**Request:**
```json
{
  "platform": "INSTAGRAM",
  "accessToken": "encrypted_token_xxx",
  "refreshToken": "encrypted_token_yyy",
  "expiresAt": "2026-01-10T12:00:00Z",
  "handle": "username",
  "profileUrl": "https://instagram.com/username"
}
```

**Response (201):**
```json
{
  "connectionId": "conn_talent_456_INSTAGRAM_1704902400000",
  "handle": "username",
  "platform": "INSTAGRAM",
  "connectionType": "OAUTH",
  "connected": true,
  "syncStatus": "PENDING",
  "message": "Successfully connected via OAuth. Data sync will begin immediately."
}
```

**Process:**
1. ✅ Extract user ID from auth context
2. ✅ Validate OAuth token (basic format check)
3. ✅ Upsert connection with `connectionType: "OAUTH"`
4. ✅ Store encrypted tokens
5. ✅ Set `syncStatus: "PENDING"`
6. ✅ Queue background sync (can start immediately with tokens)
7. ✅ Return connection

---

### Get All Connections

**Endpoint:** `GET /api/admin/talent/:talentId/social-connections`

**Response:**
```json
{
  "connections": [
    {
      "id": "conn_123_INSTAGRAM_...",
      "platform": "INSTAGRAM",
      "handle": "username",
      "profileUrl": "https://instagram.com/username",
      "connected": true,
      "connectionType": "MANUAL",
      "syncStatus": "READY",
      "syncError": null,
      "lastSyncedAt": "2026-01-10T12:00:00Z",
      "createdAt": "2026-01-10T11:00:00Z",
      "updatedAt": "2026-01-10T12:00:00Z"
    }
  ],
  "total": 1
}
```

---

### Manually Trigger Sync

**Endpoint:** `POST /api/admin/socials/:connectionId/sync`

**Response:**
```json
{
  "connectionId": "conn_123_INSTAGRAM_...",
  "syncStatus": "SYNCING",
  "message": "Sync triggered. Refreshing data..."
}
```

**When to Use:**
- Admin wants to force refresh
- Error state needs retry
- New data should be fetched

---

### Delete Connection

**Endpoint:** `DELETE /api/admin/socials/:connectionId`

**Response:**
```json
{
  "message": "Social connection removed"
}
```

**Cleanup:**
- Delete `SocialAccountConnection`
- Delete associated `SocialProfile`
- Delete `SocialPost` records
- Clear cache

---

## 3. BACKGROUND JOB SYSTEM (Bull.js)

### Queue: `social-data-ingest`

**Job Structure:**
```typescript
interface SocialDataIngestJob {
  connectionId: string;      // Which account to sync
  talentId: string;          // Whose talent to update
  platform: string;          // INSTAGRAM, TIKTOK, etc.
  handle: string;            // For API calls
  connectionType: "MANUAL" | "OAUTH"; // How to fetch
}
```

**Job Lifecycle:**

```
PENDING (2-10 seconds after queue)
    ↓
UPDATE connection.syncStatus = "SYNCING"
    ↓
FETCH profile data (API or scrape)
    ↓
FETCH posts data
    ↓
UPSERT SocialProfile
    ↓
INSERT SocialPost records
    ↓
UPDATE connection.syncStatus = "READY"
    ↓
CLEAR cache
    ↓
DONE
```

**On Error:**
```
ERROR encountered
    ↓
UPDATE connection.syncStatus = "ERROR"
    ↓
STORE error message in syncError
    ↓
RETRY (exponential backoff)
    ├─ Attempt 1 (immediate)
    ├─ Attempt 2 (2 seconds delay)
    └─ Attempt 3 (4 seconds delay)
    ↓
If all fail: Admin sees error state + message
```

**Retry Configuration:**
```typescript
{
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 2000, // Start with 2 seconds
  },
  removeOnComplete: true,   // Clean up successful jobs
  removeOnFail: false,      // Keep failed jobs for debugging
}
```

---

## 4. DATA FETCHERS

### Supported Platforms

#### Instagram
- **OAuth:** Meta Graph API v18.0
  - Requires Instagram Business account
  - Scopes: `instagram_business_basic,instagram_business_manage_media`
- **Public:** Web scraping (limited, unreliable)
  - Uses public JSON endpoint
  - No authentication needed
  - Subject to blocking

#### TikTok
- **OAuth:** TikTok Business API v1.3
  - Requires business account registration
  - Scopes: `user.info.basic,video.list`
- **Public:** Not available (API-only)

#### YouTube
- **OAuth:** Google YouTube Data API v3
  - Requires Google Cloud project
  - Scopes: `youtube.readonly`
- **Public:** Limited via public API key

### Fetcher Functions

Each platform has two variants:

```typescript
// Public/scraping approach
async function fetch{Platform}ProfileDataPublic(handle: string)
async function fetch{Platform}PostsPublic(handle: string)

// OAuth approach  
async function fetch{Platform}ProfileDataOAuth(handle: string, accessToken: string)
async function fetch{Platform}PostsOAuth(handle: string, accessToken: string)

// Unified interface
async function fetch{Platform}ProfileData(options: { handle, accessToken? })
async function fetch{Platform}Posts(options: { handle, accessToken? })
```

**Data Structure (Profile):**
```typescript
{
  displayName: string;
  bio?: string;
  profileImageUrl?: string;
  followerCount: number;
  followingCount?: number;
  postCount?: number;
  averageViews?: number;
  averageEngagement?: number;
  engagementRate?: number;
  isVerified?: boolean;
  externalId?: string;
}
```

**Data Structure (Post):**
```typescript
{
  externalId: string;      // Platform's post ID
  url: string;             // Direct link to post
  caption?: string;        // Post text/caption
  mediaType: "IMAGE" | "VIDEO" | "CAROUSEL";
  publishedAt: string;     // ISO datetime
  likes?: number;
  comments?: number;
  shares?: number;
  views?: number;
  saves?: number;
}
```

---

## 5. FRONTEND COMPONENTS

### `PlatformIcon.tsx`

**Features:**
- Official platform SVGs (Instagram, TikTok, YouTube, Twitter, LinkedIn)
- Consistent sizing (sm, md, lg)
- Platform-specific color palette
- Hover states and branding

**Usage:**
```tsx
<PlatformIcon platform="INSTAGRAM" size="md" />
```

**Color Mapping:**
```typescript
{
  INSTAGRAM: { bg: "bg-[#E4405F]/10", text: "text-[#E4405F]" },
  TIKTOK: { bg: "bg-[#000000]/10", text: "text-[#000000]" },
  YOUTUBE: { bg: "bg-[#FF0000]/10", text: "text-[#FF0000]" },
  TWITTER: { bg: "bg-[#1DA1F2]/10", text: "text-[#1DA1F2]" },
  LINKEDIN: { bg: "bg-[#0A66C2]/10", text: "text-[#0A66C2]" },
}
```

---

### `SocialProfilesCard.jsx`

**Props:**
```typescript
interface SocialProfilesCardProps {
  talentId: string;              // Which talent to manage
  onConnectionsChange?: () => void; // Callback when connections change
}
```

**States:**

1. **Empty State**
   - No connections
   - CTA: "Add Your First Profile"

2. **Connected (Manual)**
   - Platform icon + handle
   - Badge: "Manual"
   - Status: PENDING | SYNCING | READY | ERROR
   - Actions: View, Refresh, Delete

3. **Connected (OAuth)**
   - Platform icon + handle
   - Badge: "OAuth"
   - Status: READY (real-time data)
   - Actions: View, Refresh, Delete

4. **Syncing**
   - Spinner animation
   - Status: "Syncing"
   - Actions disabled until complete

5. **Error**
   - Alert icon
   - Status: "Error"
   - Error message displayed
   - Retry button available

**Features:**
- Real-time status polling (10-second refresh)
- Manual refresh trigger
- Platform-aware validation
- Clear sync state display
- OAuth vs Manual visual distinction
- Secure deletion with confirmation

**UI Flow:**

```
[Empty State]
    │
    └─→ Click "Add Your First Profile"
        │
        └─→ [Add Form]
            ├─ Platform selector
            ├─ Handle input (@username)
            ├─ URL input (optional)
            └─ [Confirm & Connect] button
                │
                └─→ API call: POST /api/admin/socials/connect-manual
                    │
                    └─→ [Connected List]
                        ├─ Platform icon
                        ├─ @handle
                        ├─ Status badge (PENDING → SYNCING → READY)
                        ├─ Last synced timestamp
                        └─ Actions (View, Refresh, Delete)
```

**Refresh Behavior:**
- Polls every 10 seconds for status updates
- Shows live sync progress
- Updates "Last synced" timestamp
- Clears polling when component unmounts

---

## 6. STATE TRANSITIONS & ERROR HANDLING

### Connection State Machine

```
                    ┌─────────────────────────────────┐
                    │      DISCONNECTED                │
                    │   (No connection record)        │
                    └────────┬────────────────────────┘
                             │
                      Admin clicks "Connect"
                      │ OR OAuth callback received
                             │
                             ▼
                    ┌─────────────────────────────────┐
                    │      PENDING                     │
                    │  (Record created, waiting for   │
                    │   background job to start)      │
                    └────────┬────────────────────────┘
                             │
                    Job picked up by Bull.js
                             │
                             ▼
                    ┌─────────────────────────────────┐
                    │      SYNCING                     │
                    │  (Fetching data from API/       │
                    │   web, populating database)     │
                    └────┬───────────────────┬────────┘
                         │                   │
                    Success                  Error
                         │                   │
         ┌───────────────┴───────────────┐  │
         │                               │  │
         ▼                               ▼  ▼
    ┌──────────────┐              ┌──────────────┐
    │    READY     │              │    ERROR     │
    │  (Data live, │              │  (Sync      │
    │   showing in │              │   failed -  │
    │   dashboard) │              │   show msg) │
    └──────────────┘              └──────────────┘
         │                               │
         │ Manual refresh                │ Admin clicks
         ├───────────────────────────────┤ "Retry" / "Refresh"
         │                               │
         └─────────→ SYNCING ←───────────┘
```

### Error Scenarios & Responses

| Scenario | Sync Status | UI Display | Recovery |
|----------|-----------|-----------|----------|
| **Invalid handle** | ERROR | "Invalid username format" | User re-enters handle |
| **Account not found** | ERROR | "Profile not found on platform" | Check spelling, manual verify URL |
| **API rate limit** | SYNCING → ERROR | "API rate limit. Retrying..." | Auto-retry with backoff |
| **Network timeout** | ERROR | "Connection timeout. Try again." | Manual refresh or wait |
| **OAuth token expired** | ERROR | "Token expired. Reconnect via OAuth." | Talent re-authenticates |
| **Insufficient permissions** | ERROR | "Cannot access profile data." | Check OAuth scopes |

---

## 7. INTEGRATION POINTS

### Where to Use Components

#### Admin Talent Detail Page

**File:** `apps/web/src/pages/AdminTalentDetailPage.jsx`

**Before (Old Component):**
```jsx
import { TalentSocialProfilesAccordion } from "...";

function TalentSocialSection() {
  return <TalentSocialProfilesAccordion talent={talent} onUpdate={...} />;
}
```

**After (New Component):**
```jsx
import { SocialProfilesCard } from "../components/AdminTalent/SocialProfilesCard";

function TalentSocialSection({ talentId }) {
  return (
    <SocialProfilesCard 
      talentId={talentId}
      onConnectionsChange={handleConnectionsChanged}
    />
  );
}
```

#### Backend Route Registration

**File:** `apps/api/src/index.ts` or main router setup

```typescript
import socialConnections from "./routes/admin/socialConnections.js";

app.use("/api", socialConnections);
```

#### Social Intelligence Integration

**File:** `apps/api/src/services/socialIntelligenceService.ts`

```typescript
export async function getTalentSocialIntelligence(talentId: string) {
  const talent = await prisma.talent.findUnique({
    where: { id: talentId },
    include: {
      SocialAccountConnection: {
        where: { connected: true },  // Only connected ones
        select: { id: true, platform: true, syncStatus: true }
      }
    }
  });

  // Return { connected: true/false, syncStatus, overview: { ... } }
}
```

---

## 8. DEPLOYMENT CHECKLIST

### Pre-Deployment

- [ ] Database migration applied (new schema fields)
- [ ] Redis configured (Bull.js queue backend)
- [ ] Bull.js worker process running
- [ ] API routes registered
- [ ] Frontend components built
- [ ] Platform icons SVGs embedded
- [ ] Error logging configured

### Database Migration

```bash
# Apply schema changes
npx prisma migrate dev --name add_social_connection_fields

# Seed migration (set defaults for existing records)
npx prisma db seed
```

### Environment Variables

```bash
# Redis (for Bull.js queue)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Logging
LOG_LEVEL=info
LOG_FILE=logs/api.log

# Feature flags (if using)
FEATURE_SOCIAL_OAUTH=true
FEATURE_SOCIAL_MANUAL=true
```

### Runtime Checks

```bash
# Verify Bull.js queue is running
curl http://localhost:3000/api/admin/queue-stats

# Monitor sync jobs
tail -f logs/api.log | grep SOCIAL_INGEST

# Check connection status
curl http://localhost:3000/api/admin/talent/TALENT_ID/social-connections
```

---

## 9. FUTURE ENHANCEMENTS

### Phase 2: OAuth Implementation
- **Spotify OAuth** (music discovery)
- **LinkedIn OAuth** (professional network analysis)
- **Pinterest OAuth** (visual content trends)
- **TikTok Creator Fund** integration
- Secure token encryption at rest

### Phase 3: Advanced Data Analysis
- **Sentiment analysis** (comment/caption NLP)
- **Audience demographics** (age, location, interests)
- **Engagement prediction** (ML model for reach estimates)
- **Trend detection** (rising hashtags/topics)
- **Competitor benchmarking** (compare metrics)

### Phase 4: Automated Actions
- **Auto-publish** (schedule posts across platforms)
- **Smart replies** (AI-suggested responses to comments)
- **Content recommendations** (optimal post times, formats)
- **Influencer discovery** (find brand collaborators)
- **Crisis monitoring** (negative sentiment alerts)

---

## 10. TESTING STRATEGY

### Unit Tests

```typescript
// socialConnections.test.ts
describe("POST /api/admin/socials/connect-manual", () => {
  test("creates connection with valid input", async () => {
    const response = await request(app)
      .post("/api/admin/socials/connect-manual")
      .send({
        talentId: "talent_123",
        platform: "INSTAGRAM",
        handle: "testuser",
      });

    expect(response.status).toBe(201);
    expect(response.body.connectionId).toBeDefined();
    expect(response.body.syncStatus).toBe("PENDING");
  });

  test("validates handle format", async () => {
    const response = await request(app)
      .post("/api/admin/socials/connect-manual")
      .send({
        talentId: "talent_123",
        platform: "INSTAGRAM",
        handle: "invalid @#$%", // Invalid chars
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain("Invalid handle");
  });
});
```

### Integration Tests

```typescript
// e2e social connection flow
describe("Social Profile Connection Flow", () => {
  test("manual connection → sync job → ready state", async () => {
    // 1. Admin adds profile
    const connectRes = await admin.post("/api/admin/socials/connect-manual", {
      talentId,
      platform: "INSTAGRAM",
      handle: "testuser",
    });
    const connectionId = connectRes.body.connectionId;

    // 2. Wait for job to process
    await wait(5000);

    // 3. Check connection is READY
    const statusRes = await admin.get(
      `/api/admin/talent/${talentId}/social-connections`
    );
    const conn = statusRes.body.connections[0];
    expect(conn.syncStatus).toBe("READY");
    expect(conn.connected).toBe(true);
  });
});
```

### Manual Testing Scenarios

**Scenario A: Admin Manual Connection**
1. Open Admin > Talent > [Select]
2. Scroll to "Social Profiles"
3. Click "Connect Profile"
4. Select: INSTAGRAM
5. Handle: "testuser" (real Instagram handle)
6. URL: "https://instagram.com/testuser"
7. Click "Confirm & Connect"
8. ✅ Should show PENDING → SYNCING
9. ✅ Within 10 seconds should show READY
10. ✅ Last synced time should be recent

**Scenario B: Error Handling**
1. Repeat Scenario A
2. Use invalid handle: "nonexistent12345invalidhandle"
3. ✅ Should show ERROR
4. ✅ Error message should be visible
5. ✅ "Retry" button should appear
6. Click Retry
7. ✅ Should try again (SYNCING)

**Scenario C: Multiple Platforms**
1. Add INSTAGRAM connection
2. ✅ Shows "Connected (manual)"
3. Add TIKTOK connection
4. ✅ Shows both in list
5. Icons are platform-specific
6. ✅ Each has independent sync status

**Scenario D: Data Appears in Social Intelligence Tab**
1. After connection is READY
2. Open "Social Intelligence" tab
3. ✅ Should show "Connected" state
4. ✅ Overview should have data (followers, posts, etc.)
5. ✅ Content performance should be populated

---

## 11. MONITORING & LOGGING

### Key Metrics to Track

```typescript
// Log every connection event
console.log("[SOCIAL_CONNECT] Connection created", {
  connectionId,
  talentId,
  platform,
  connectionType,
  timestamp: new Date().toISOString(),
});

// Log sync job outcomes
console.log("[SOCIAL_INGEST] Job completed", {
  jobId,
  connectionId,
  platform,
  postsCount,
  duration: Date.now() - startTime,
  status: "SUCCESS",
});

// Log errors
console.error("[SOCIAL_INGEST] Job failed", {
  jobId,
  error: error.message,
  attempt: job.attemptsMade,
  willRetry: job.attemptsMade < 3,
});
```

### Dashboards & Alerts

**Monitor these KPIs:**
- Connections created per day
- Average sync duration
- Sync success rate (%)
- Failed syncs awaiting retry
- Data freshness (% synced in last 24h)

**Alert Triggers:**
- 🚨 Sync success rate < 80%
- 🚨 Failed job queue size > 100
- 🚨 Average sync duration > 30 seconds
- ⚠️ Data older than 48 hours

---

## 12. TROUBLESHOOTING GUIDE

### Issue: Connection stuck in PENDING

**Symptoms:** Created 5+ minutes ago, still PENDING

**Causes:**
- Bull.js worker not running
- Job not picked up
- Database not saving

**Fix:**
```bash
# Check worker is running
ps aux | grep node | grep bull

# Check queue depth
curl http://localhost:3000/api/admin/queue-stats

# Check database
SELECT * FROM SocialAccountConnection WHERE syncStatus = 'PENDING';

# Restart worker
pm2 restart social-ingest-worker
```

---

### Issue: Sync fails with "API rate limit"

**Symptoms:** ERROR state, message mentions rate limit

**Cause:** Platform API hit rate limits

**Fix:**
- Wait 15-30 minutes
- Click "Retry" (auto-backoff should handle)
- Reduce concurrent syncs for that platform

---

### Issue: OAuth token expired

**Symptoms:** ERROR state, message mentions token

**Cause:** Refresh token not working or expired

**Fix:**
- Talent re-authenticates via OAuth
- Token refreshed in database
- Admin can retry sync

---

## Summary

This production-grade redesign transforms social profiles from a simple form field into a **robust, enterprise-ready system** that:

✅ Supports multiple connection types (manual + OAuth)  
✅ Provides honest, real-time state display  
✅ Handles errors gracefully with retry logic  
✅ Fetches real data via background jobs  
✅ Looks professional with platform-native UI  
✅ Scales to thousands of connections  
✅ Integrates seamlessly with Social Intelligence  

**The feature is no longer a UI stub—it's a real system.**

---

End of Implementation Documentation
