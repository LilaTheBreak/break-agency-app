# 🚀 Phase 2 Integration: Next Steps

**Your immediate task**: Connect the Phase 2 platform services to the analytics endpoint and verify they work with real URLs.

**Estimated Time**: 2-3 hours  
**Difficulty**: Medium (straightforward integration)  
**Success**: All services returning real data from YouTube, Instagram, TikTok

---

## 📍 Where We Are

✅ **Phase 2 Services Created**:
- YouTube service (565 lines) - Ready
- Instagram service (487 lines) - Ready
- TikTok service (427 lines) - Ready

✅ **Database**:
- ExternalSocialProfile table exists in Neon
- Prisma migration synced
- Ready for data persistence

❌ **NOT YET DONE**:
- Services not yet integrated into analytics endpoint
- analyticsIngestionService.ts still has stubs
- No real data flowing yet

---

## 🎯 Your Exact Next Tasks

### TASK 1: Integrate YouTube Service (30 minutes)

**Location**: `apps/api/src/services/analyticsIngestionService.ts`

**Find this code** (approximately line 150-180, search for `platform === 'youtube'`):
```typescript
if (platform === 'youtube') {
  logInfo('[ANALYTICS] Fetching YouTube data...');
  // This is the stub - currently just logs
  return { /* stub response */ };
}
```

**Replace with**:
```typescript
import { fetchYouTubeMetrics } from './platforms/youtube';

if (platform === 'youtube') {
  logInfo('[ANALYTICS] Calling YouTube service...');
  const metrics = await fetchYouTubeMetrics(normalizedUrl, {
    cacheMaxAge: 60 * 60 * 1000, // 1 hour cache
  });
  logInfo('[ANALYTICS] YouTube service returned metrics');
  return metrics;
}
```

**Verify**:
- [ ] Code compiles: `npx tsc --noEmit apps/api/src/services/analyticsIngestionService.ts`
- [ ] No import errors
- [ ] Function call looks correct

### TASK 2: Integrate Instagram Service (30 minutes)

**Find this code** (search for `platform === 'instagram'`):
```typescript
if (platform === 'instagram') {
  logInfo('[ANALYTICS] Fetching Instagram data...');
  // This is the stub
  return { /* stub response */ };
}
```

**Replace with**:
```typescript
import { fetchInstagramMetrics } from './platforms/instagram';

if (platform === 'instagram') {
  logInfo('[ANALYTICS] Calling Instagram service...');
  const metrics = await fetchInstagramMetrics(normalizedUrl, {
    cacheMaxAge: 5 * 60 * 1000, // 5 minute cache
  });
  logInfo('[ANALYTICS] Instagram service returned metrics');
  return metrics;
}
```

**Verify**:
- [ ] Code compiles
- [ ] Import statement added at top of file
- [ ] No syntax errors

### TASK 3: Integrate TikTok Service (30 minutes)

**Find this code** (search for `platform === 'tiktok'`):
```typescript
if (platform === 'tiktok') {
  logInfo('[ANALYTICS] Fetching TikTok data...');
  // This is the stub
  return { /* stub response */ };
}
```

**Replace with**:
```typescript
import { fetchTikTokMetrics } from './platforms/tiktok';

if (platform === 'tiktok') {
  logInfo('[ANALYTICS] Calling TikTok service...');
  const metrics = await fetchTikTokMetrics(normalizedUrl, {
    cacheMaxAge: 10 * 60 * 1000, // 10 minute cache
  });
  logInfo('[ANALYTICS] TikTok service returned metrics');
  return metrics;
}
```

**Verify**:
- [ ] Code compiles
- [ ] Import statement added
- [ ] Function calls match service signatures

### TASK 4: Test with Real URLs (30 minutes)

**Start your dev server**:
```bash
cd /Users/admin/Desktop/break-agency-app-1
npm run dev
# Wait for "listening on port 5001"
```

**Test YouTube** (in new terminal):
```bash
curl -X POST http://localhost:5001/api/admin/analytics/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/@cristiano"}'
```

**Expected**: Returns 200 with channel data (subscriberCount, etc.)
- [ ] Request returns 200 status
- [ ] Response includes subscriberCount, viewCount, videoCount
- [ ] Logs show [YOUTUBE] messages

**Test Instagram**:
```bash
curl -X POST http://localhost:5001/api/admin/analytics/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.instagram.com/cristiano"}'
```

**Expected**: Returns 200 with profile data (followerCount, postCount)
- [ ] Request returns 200 status
- [ ] Response includes followerCount, postCount
- [ ] Logs show [INSTAGRAM] messages

**Test TikTok**:
```bash
curl -X POST http://localhost:5001/api/admin/analytics/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.tiktok.com/@thesnowboard"}'
```

**Expected**: Returns 200 with profile data (followerCount, likeCount)
- [ ] Request returns 200 status
- [ ] Response includes followerCount, likeCount, videoCount
- [ ] Logs show [TIKTOK] messages

### TASK 5: Verify Database Persistence (15 minutes)

**Check that data was saved**:
```bash
psql $DATABASE_URL << EOF
SELECT 
  platform,
  username,
  "lastFetchedAt",
  "snapshotJson" ->> 'subscriberCount' as sub_count,
  "createdAt"
FROM "ExternalSocialProfile"
WHERE platform IN ('youtube', 'instagram', 'tiktok')
ORDER BY "lastFetchedAt" DESC
LIMIT 10;
EOF
```

**Expected Output**:
```
 platform  | username | lastFetchedAt | sub_count | createdAt
-----------+----------+---------------+-----------+---------------------
 youtube   | cristiano | 2026-01-11T... | 630000000 | 2026-01-11T...
 instagram | cristiano | 2026-01-11T... | 645000000 | 2026-01-11T...
 tiktok    | thesnowboard | 2026-01-11T... | 1234567   | 2026-01-11T...
```

- [ ] All three records exist
- [ ] Data was saved to database
- [ ] Timestamps are recent

### TASK 6: Verify Caching Works (10 minutes)

**First request** (cache miss, slower):
```bash
time curl -X POST http://localhost:5001/api/admin/analytics/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/@cristiano"}'
# Should take ~1-2 seconds
```

**Second request** (cache hit, much faster):
```bash
time curl -X POST http://localhost:5001/api/admin/analytics/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/@cristiano"}'
# Should take <500ms
```

- [ ] First request slower (~1-2 seconds)
- [ ] Second request much faster (<500ms)
- [ ] Cache is working

---

## ⚠️ Common Issues & Fixes

### Issue: "GOOGLE_YOUTUBE_API_KEY is not set"

**Fix**:
```bash
export GOOGLE_YOUTUBE_API_KEY="your-api-key-here"
npm run dev
```

### Issue: "Cannot find module './platforms/youtube'"

**Fix**: Make sure all three files exist:
```bash
ls -la apps/api/src/services/platforms/
# Should show: youtube.ts, instagram.ts, tiktok.ts
```

### Issue: "Query failed: relation 'ExternalSocialProfile' does not exist"

**Fix**: Connect to correct database:
```bash
echo $DATABASE_URL
# Should be: postgresql://... from Neon
```

### Issue: Request returns 429 (Too Many Requests)

**Fix**: Wait 5+ seconds for Instagram, 10+ seconds for TikTok:
```bash
sleep 6
curl -X POST http://localhost:5001/api/admin/analytics/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.instagram.com/cristiano"}'
```

### Issue: "Connection refused on localhost:5001"

**Fix**: Make sure dev server is running:
```bash
cd /Users/admin/Desktop/break-agency-app-1
npm run dev
# Wait for "listening on port 5001"
```

---

## ✅ Definition of Done

You're done when ALL of these are true:

- [x] Phase 2 services created (youtube.ts, instagram.ts, tiktok.ts)
- [ ] YouTube service integrated into analyticsIngestionService.ts
- [ ] Instagram service integrated into analyticsIngestionService.ts
- [ ] TikTok service integrated into analyticsIngestionService.ts
- [ ] Dev server starts without errors: `npm run dev`
- [ ] YouTube URL returns real subscriber/view count
- [ ] Instagram URL returns real follower/post count
- [ ] TikTok URL returns real follower/like count
- [ ] Database has 3+ records in ExternalSocialProfile
- [ ] Cache works (2nd request faster than 1st)
- [ ] Rate limiting works (429 on rapid requests)
- [ ] All logs show [YOUTUBE], [INSTAGRAM], [TIKTOK] prefixes
- [ ] No hardcoded API keys in code
- [ ] TypeScript compiles without errors

---

## 📞 When You're Stuck

1. **Check logs** for [YOUTUBE], [INSTAGRAM], [TIKTOK] error messages
2. **Read service file** (youtube.ts, instagram.ts, tiktok.ts) to understand expected inputs
3. **Look at error message** - it should tell you what went wrong
4. **Check environment variables** - ensure GOOGLE_YOUTUBE_API_KEY is set
5. **Verify database connection** - try: `psql $DATABASE_URL -c "SELECT 1"`
6. **Read PHASE_2_IMPLEMENTATION.md** for detailed API documentation

---

## 🎉 What Happens After

Once all checkboxes are ✅:

1. **Phase 2 is COMPLETE** - Real data flowing through system
2. **Next: Phase 3** - Build Trending Topics & Web Intelligence scrapers
3. **After that**: Phase 4-7 (Community signals, Gmail/Calendar, Aggregator, Validation)

---

## 📚 Reference Files

- **Service Implementation**: [PHASE_2_IMPLEMENTATION.md](PHASE_2_IMPLEMENTATION.md)
- **Testing Guide**: [PHASE_2_INTEGRATION_TESTING.md](PHASE_2_INTEGRATION_TESTING.md)
- **Overall Plan**: [MASTER_IMPLEMENTATION_PLAN.md](MASTER_IMPLEMENTATION_PLAN.md)
- **Status Dashboard**: [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md)

---

**Ready? Start with TASK 1 above.**

**Questions? Check the troubleshooting section.**

**Stuck? Read the error message carefully - it usually tells you exactly what's wrong.**
