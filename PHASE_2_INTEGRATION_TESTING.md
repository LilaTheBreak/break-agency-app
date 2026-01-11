# Phase 2 Integration Testing Checklist

## Quick Start

**Goal**: Connect Phase 2 platform services to the existing analytics endpoint and verify real data flows through the system.

**Est. Time**: 2-3 hours  
**Prerequisites**: Environment variables set, Neon access, services compiled  

---

## ✅ Pre-Integration Checklist

### Environment Variables
- [ ] `GOOGLE_YOUTUBE_API_KEY` set in `.env.local` or Railway
- [ ] Database: `$DATABASE_URL` points to Neon (verify with `psql $DATABASE_URL -c "SELECT 1"`)
- [ ] JWT secret configured
- [ ] Node environment set to `development` or `production`

### Service Compilation
```bash
cd /Users/admin/Desktop/break-agency-app-1/apps/api
npx tsc --noEmit apps/src/services/platforms/youtube.ts
npx tsc --noEmit apps/src/services/platforms/instagram.ts
npx tsc --noEmit apps/src/services/platforms/tiktok.ts
```

- [ ] YouTube service compiles without errors
- [ ] Instagram service compiles without errors
- [ ] TikTok service compiles without errors

### Database Verification
```bash
psql $DATABASE_URL -c "
SELECT 
  table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'ExternalSocialProfile';"
```

- [ ] ExternalSocialProfile table exists
- [ ] Table has correct columns (platform, username, profileUrl, snapshotJson, lastFetchedAt)

---

## 🔌 Integration Steps

### Step 1: Update Analytics Ingestion Service

**File**: `apps/api/src/services/analyticsIngestionService.ts`

**Current State**: Service has YouTube, Instagram, TikTok stubs that log "Fetching X data..."

**Required Change**: Replace stubs with actual service calls

```typescript
// OLD (line ~XXX)
if (platform === 'youtube') {
  logInfo('[ANALYTICS] Fetching YouTube data...');
  // Stub implementation
}

// NEW
if (platform === 'youtube') {
  const metrics = await fetchYouTubeMetrics(normalizedUrl, {
    cacheMaxAge: 60 * 60 * 1000, // 1 hour
  });
  return metrics;
}
```

**Tasks**:
- [ ] Locate the YouTube stub in analyticsIngestionService.ts
- [ ] Replace with: `import { fetchYouTubeMetrics } from './platforms/youtube';`
- [ ] Replace YouTube stub with `fetchYouTubeMetrics()` call
- [ ] Locate the Instagram stub
- [ ] Replace with: `import { fetchInstagramMetrics } from './platforms/instagram';`
- [ ] Replace Instagram stub with `fetchInstagramMetrics()` call
- [ ] Locate the TikTok stub
- [ ] Replace with: `import { fetchTikTokMetrics } from './platforms/tiktok';`
- [ ] Replace TikTok stub with `fetchTikTokMetrics()` call
- [ ] Update error handling to return service errors honestly
- [ ] Verify TypeScript compilation

### Step 2: Test with Real URLs

**Start Server**:
```bash
cd /Users/admin/Desktop/break-agency-app-1
npm run dev
# or
yarn dev
```

Wait for API to start on port 5001.

**Test YouTube**:
```bash
curl -X POST http://localhost:5001/api/admin/analytics/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "url": "https://www.youtube.com/@cristiano",
    "platform": "youtube"
  }'
```

**Expected Response**:
```json
{
  "platform": "youtube",
  "data": {
    "channelId": "UC...",
    "channelName": "Cristiano",
    "subscriberCount": 630000000,
    "viewCount": 54000000000,
    "videoCount": 1234,
    "topVideos": [
      {
        "videoId": "...",
        "title": "...",
        "viewCount": 123456789
      }
    ],
    "bio": "...",
    "isVerified": true,
    "profileImage": "https://..."
  },
  "cachedAt": "2026-01-11T12:30:00Z",
  "source": "API"
}
```

**Check Logs**:
```bash
tail -f /tmp/api.log | grep YOUTUBE
```

- [ ] Request returns 200 status
- [ ] Data includes subscriberCount, viewCount, videoCount
- [ ] topVideos array populated
- [ ] Logs show [YOUTUBE] prefix
- [ ] No errors in response

**Test Instagram**:
```bash
curl -X POST http://localhost:5001/api/admin/analytics/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "url": "https://www.instagram.com/cristiano",
    "platform": "instagram"
  }'
```

**Expected Response**:
```json
{
  "platform": "instagram",
  "data": {
    "username": "cristiano",
    "followerCount": 645000000,
    "followingCount": 456,
    "postCount": 3456,
    "bio": "...",
    "isVerified": true,
    "profileImage": "https://...",
    "dataSource": "API" or "SCRAPE"
  },
  "cachedAt": "2026-01-11T12:30:00Z"
}
```

- [ ] Request returns 200 status
- [ ] Data includes followerCount, postCount
- [ ] dataSource indicates API or SCRAPE
- [ ] Logs show [INSTAGRAM] prefix
- [ ] No errors in response
- [ ] Wait 5+ seconds, try again (rate limit test)

**Test TikTok**:
```bash
curl -X POST http://localhost:5001/api/admin/analytics/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "url": "https://www.tiktok.com/@thesnowboard",
    "platform": "tiktok"
  }'
```

**Expected Response**:
```json
{
  "platform": "tiktok",
  "data": {
    "username": "thesnowboard",
    "followerCount": 1234567,
    "likeCount": 123456789,
    "videoCount": 456,
    "isVerified": true,
    "bio": "..."
  },
  "cachedAt": "2026-01-11T12:30:00Z"
}
```

- [ ] Request returns 200 status
- [ ] Data includes followerCount, likeCount, videoCount
- [ ] Logs show [TIKTOK] prefix
- [ ] No errors in response
- [ ] Wait 10+ seconds, try again (rate limit test)

### Step 3: Verify Database Persistence

```bash
psql $DATABASE_URL << EOF
SELECT 
  platform,
  username,
  "lastFetchedAt",
  "snapshotJson" ->> 'subscriberCount' as subscribers,
  "createdAt"
FROM "ExternalSocialProfile"
ORDER BY "lastFetchedAt" DESC
LIMIT 10;
EOF
```

**Expected Output**:
```
 platform  | username  | lastFetchedAt        | subscribers | createdAt
-----------+-----------+----------------------+-------------+---------------------
 youtube   | cristiano | 2026-01-11T12:30:00 | 630000000   | 2026-01-11T12:30:00
 instagram | cristiano | 2026-01-11T12:29:45 | 645000000   | 2026-01-11T12:29:45
 tiktok    | thesnowboard | 2026-01-11T12:29:30 |  1234567   | 2026-01-11T12:29:30
```

- [ ] All three records exist
- [ ] lastFetchedAt is recent
- [ ] snapshotJson contains data
- [ ] createdAt timestamp present

### Step 4: Test Cache & Rate Limiting

**Cache Test** (YouTube, 1 hour TTL):
```bash
# First request (cache miss)
time curl -X POST http://localhost:5001/api/admin/analytics/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/@cristiano"}'

# Second request (cache hit, should be much faster)
time curl -X POST http://localhost:5001/api/admin/analytics/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/@cristiano"}'
```

- [ ] First request ~1-2 seconds
- [ ] Second request <500ms
- [ ] Logs show cache HIT on second request

**Rate Limit Test** (Instagram, 5-second cooldown):
```bash
# Request 1
curl -X POST http://localhost:5001/api/admin/analytics/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.instagram.com/cristiano"}'

# Request 2 (immediately after)
curl -X POST http://localhost:5001/api/admin/analytics/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.instagram.com/cristiano"}'
```

- [ ] Second request returns 429 Too Many Requests
- [ ] Error message mentions rate limit
- [ ] Logs show rate limit warning
- [ ] Wait 6 seconds, try again
- [ ] Request succeeds after waiting

### Step 5: Test Error Handling

**Invalid URL**:
```bash
curl -X POST http://localhost:5001/api/admin/analytics/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/invalid", "platform": "youtube"}'
```

- [ ] Returns 400 or 404
- [ ] Error message is honest (not generic)
- [ ] Logs show error with [YOUTUBE] prefix

**API Quota Exceeded** (if YouTube quota limit):
```bash
# Make many requests to YouTube endpoint until quota hits
for i in {1..500}; do
  curl -s -X POST http://localhost:5001/api/admin/analytics/analyze \
    -H "Content-Type: application/json" \
    -d '{"url": "https://www.youtube.com/@cristiano"}' > /dev/null
done
```

- [ ] Eventually returns 403 or 500 with quota error
- [ ] Error message mentions YouTube API quota
- [ ] Logs show quota exhaustion warning
- [ ] Service doesn't crash or hang

**Network Error** (disconnect internet):
```bash
curl -X POST http://localhost:5001/api/admin/analytics/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.instagram.com/cristiano"}'
```

- [ ] Returns 503 Service Unavailable
- [ ] Error message mentions network issue
- [ ] Service recovers after connection restored
- [ ] Logs show error with [INSTAGRAM] prefix

---

## 📊 Success Criteria

All of the following must be true:

- [x] Phase 2 services created (youtube.ts, instagram.ts, tiktok.ts)
- [ ] Services integrated into analyticsIngestionService.ts
- [ ] Services integrated into analytics endpoint
- [ ] YouTube service returns real data for @cristiano
- [ ] Instagram service returns real data for cristiano
- [ ] TikTok service returns real data for @thesnowboard
- [ ] Cache works (TTL respected)
- [ ] Rate limiting works (429 returned on second request)
- [ ] Database persistence works (ExternalSocialProfile table populated)
- [ ] Error handling is honest (not generic)
- [ ] All logs have [YOUTUBE], [INSTAGRAM], [TIKTOK] prefixes
- [ ] No hardcoded API keys in code
- [ ] No localhost assumptions
- [ ] Environment variables used for config
- [ ] TypeScript compiles without errors

---

## 🔍 Debugging

### If YouTube service fails:
1. Check `GOOGLE_YOUTUBE_API_KEY` is set: `echo $GOOGLE_YOUTUBE_API_KEY`
2. Verify API is enabled in Google Cloud Console
3. Check quota usage in Cloud Console
4. Look for [YOUTUBE] in logs
5. Verify channel/handle is public

### If Instagram service fails:
1. Check if profile is public: `curl https://www.instagram.com/cristiano/`
2. If using API, verify `INSTAGRAM_API_TOKEN` is valid
3. Check for 429 (rate limit) in logs
4. Wait 5+ seconds before retrying
5. Look for [INSTAGRAM] in logs

### If TikTok service fails:
1. Verify profile is public
2. Check for 429 (rate limit) in logs
3. Wait 10+ seconds before retrying
4. Look for [TIKTOK] in logs
5. Verify user-agent is not being blocked

---

## 🚀 When Complete

Once all checkboxes are ✅:

1. Commit changes: `git add -A && git commit -m "feat: integrate Phase 2 platform services"`
2. Deploy to staging: `git push origin main` (triggers Railway)
3. Test on staging: Repeat all tests on staging URL
4. Approve for production: Review logs and metrics
5. Create Phase 3 issues: Trending topics, web intelligence

---

**Checklist Version**: 1.0  
**Last Updated**: 2026-01-11
