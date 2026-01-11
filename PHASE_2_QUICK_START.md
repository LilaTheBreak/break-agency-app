# ⚡ Phase 2 Quick Reference Card

**What**: Integrate Platform Services into Analytics Endpoint  
**Time**: 2-3 hours  
**Difficulty**: Medium  
**Files to Edit**: 1 (`analyticsIngestionService.ts`)  
**Files Created**: 3 (youtube.ts, instagram.ts, tiktok.ts) ✅ Already Done

---

## 🎯 The 3-Minute Overview

You have 3 production-ready platform services sitting in `/services/platforms/`:

1. **youtube.ts** (565 lines) - Fetch YouTube channel data via official API
2. **instagram.ts** (487 lines) - Fetch Instagram profile data via API or scrape
3. **tiktok.ts** (427 lines) - Fetch TikTok profile data via scraping

They're currently **NOT connected** to the analytics endpoint. You need to:

1. Open `analyticsIngestionService.ts`
2. Replace 3 stub functions with actual service calls
3. Test with real URLs
4. Verify database persistence

**Time to complete**: 2-3 hours  
**Difficulty**: 3/10 (mostly copy-paste integration)

---

## 📋 The Exact Changes Needed

### File: `apps/api/src/services/analyticsIngestionService.ts`

#### Change 1: YouTube (Lines ~150-180)

**BEFORE**:
```typescript
if (platform === 'youtube') {
  logInfo('[ANALYTICS] Fetching YouTube data...');
  // stub implementation
  return stubResponse;
}
```

**AFTER**:
```typescript
import { fetchYouTubeMetrics } from './platforms/youtube';

if (platform === 'youtube') {
  const metrics = await fetchYouTubeMetrics(normalizedUrl, {
    cacheMaxAge: 60 * 60 * 1000,
  });
  return metrics;
}
```

#### Change 2: Instagram (Lines ~180-210)

**BEFORE**:
```typescript
if (platform === 'instagram') {
  logInfo('[ANALYTICS] Fetching Instagram data...');
  // stub implementation
  return stubResponse;
}
```

**AFTER**:
```typescript
import { fetchInstagramMetrics } from './platforms/instagram';

if (platform === 'instagram') {
  const metrics = await fetchInstagramMetrics(normalizedUrl, {
    cacheMaxAge: 5 * 60 * 1000,
  });
  return metrics;
}
```

#### Change 3: TikTok (Lines ~210-240)

**BEFORE**:
```typescript
if (platform === 'tiktok') {
  logInfo('[ANALYTICS] Fetching TikTok data...');
  // stub implementation
  return stubResponse;
}
```

**AFTER**:
```typescript
import { fetchTikTokMetrics } from './platforms/tiktok';

if (platform === 'tiktok') {
  const metrics = await fetchTikTokMetrics(normalizedUrl, {
    cacheMaxAge: 10 * 60 * 1000,
  });
  return metrics;
}
```

That's it! 3 simple changes.

---

## ✅ Verification Checklist

### Step 1: Compile (5 min)
```bash
cd /Users/admin/Desktop/break-agency-app-1/apps/api
npx tsc --noEmit src/services/analyticsIngestionService.ts
```
- [ ] No errors

### Step 2: Start Server (5 min)
```bash
cd /Users/admin/Desktop/break-agency-app-1
npm run dev
# Wait for "listening on port 5001"
```
- [ ] Server starts
- [ ] No errors in console

### Step 3: Test YouTube (5 min)
```bash
curl -X POST http://localhost:5001/api/admin/analytics/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "youtube.com/@cristiano"}'
```
- [ ] Returns 200
- [ ] Has subscriberCount in response
- [ ] Logs show [YOUTUBE]

### Step 4: Test Instagram (5 min)
```bash
curl -X POST http://localhost:5001/api/admin/analytics/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "instagram.com/cristiano"}'
```
- [ ] Returns 200
- [ ] Has followerCount in response
- [ ] Logs show [INSTAGRAM]

### Step 5: Test TikTok (5 min)
```bash
curl -X POST http://localhost:5001/api/admin/analytics/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "tiktok.com/@thesnowboard"}'
```
- [ ] Returns 200
- [ ] Has followerCount in response
- [ ] Logs show [TIKTOK]

### Step 6: Check Database (5 min)
```bash
psql $DATABASE_URL -c "SELECT platform, username, \"lastFetchedAt\" FROM \"ExternalSocialProfile\" ORDER BY \"lastFetchedAt\" DESC LIMIT 5;"
```
- [ ] 3 records exist (youtube, instagram, tiktok)
- [ ] Data looks correct
- [ ] lastFetchedAt is recent

### Step 7: Test Cache (5 min)
```bash
# First request (slow)
time curl -X POST http://localhost:5001/api/admin/analytics/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "youtube.com/@cristiano"}'

# Second request (fast)
time curl -X POST http://localhost:5001/api/admin/analytics/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "youtube.com/@cristiano"}'
```
- [ ] First request: ~1-2 seconds
- [ ] Second request: <500ms

---

## 🆘 If Something Breaks

| Problem | Solution |
|---------|----------|
| "Cannot find module" | Check import paths: `./platforms/youtube` |
| "Type error" | Run: `npx tsc --noEmit` to see full error |
| Server won't start | Check: `npm install`, then `npm run dev` |
| 500 error response | Check logs: Look for [YOUTUBE]/[INSTAGRAM]/[TIKTOK] errors |
| 429 rate limit | Wait 5+ sec for Instagram, 10+ sec for TikTok, retry |
| Database error | Verify: `echo $DATABASE_URL` points to Neon |
| Empty response | Check: Profile must be public (instagram.com/cristiano) |

---

## 📊 Success = All Checkboxes Green

| Task | Status |
|------|--------|
| YouTube stub → fetchYouTubeMetrics() | ☐ |
| Instagram stub → fetchInstagramMetrics() | ☐ |
| TikTok stub → fetchTikTokMetrics() | ☐ |
| Compiles without errors | ☐ |
| Server starts (`npm run dev`) | ☐ |
| YouTube returns real subscriber count | ☐ |
| Instagram returns real follower count | ☐ |
| TikTok returns real follower count | ☐ |
| Database has 3+ records | ☐ |
| Cache works (2nd request faster) | ☐ |
| Rate limiting works (returns 429) | ☐ |
| All logs show platform prefixes | ☐ |

---

## 📚 More Info

- **Detailed Integration Guide**: [PHASE_2_INTEGRATION_TESTING.md](PHASE_2_INTEGRATION_TESTING.md)
- **Service Documentation**: [PHASE_2_IMPLEMENTATION.md](PHASE_2_IMPLEMENTATION.md)
- **Full Status**: [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md)
- **Master Plan**: [MASTER_IMPLEMENTATION_PLAN.md](MASTER_IMPLEMENTATION_PLAN.md)

---

## ⏱️ Time Breakdown

| Task | Time |
|------|------|
| Make 3 code changes | 15 min |
| Compile & verify | 10 min |
| Start server | 5 min |
| Test 3 platforms | 20 min |
| Verify database | 10 min |
| Test cache/rate-limit | 10 min |
| **TOTAL** | **~70 minutes** |

**Buffer**: Add 30 minutes for debugging = ~2 hours total

---

## 🚀 After You're Done

1. ✅ Phase 2 Integration Testing complete
2. ✅ Services connected to analytics endpoint
3. ✅ Real data flowing through system
4. 📋 Next: Phase 3 (Trends + Web Intelligence scrapers)

---

**Status**: Ready to integrate  
**Services**: 3 created ✅ (YouTube, Instagram, TikTok)  
**Database**: Connected ✅ (Neon with ExternalSocialProfile)  
**Next Step**: Edit analyticsIngestionService.ts with 3 simple changes

**Good luck! 🎉**
