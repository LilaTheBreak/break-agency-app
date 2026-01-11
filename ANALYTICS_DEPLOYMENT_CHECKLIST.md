# Admin Analytics Feature - Deployment Checklist ✅

## Pre-Deployment (Development)

- [x] Input normalization implemented (10+ URL/handle formats)
- [x] YouTube API integration complete
- [x] Instagram/TikTok stubs created with clear error messages
- [x] ExternalSocialProfile database model created
- [x] Sync logic with 12h caching implemented
- [x] API endpoints created (POST /analyze, POST /refresh, GET legacy)
- [x] Frontend components updated (AdminAnalyticsPage, ProfileInputSelector)
- [x] Comprehensive logging with [ANALYTICS] prefix
- [x] Error handling with user-friendly messages
- [x] API build: ✅ Passing
- [x] Web build: ✅ Passing
- [x] Test suite: ✅ All 9 categories passing

## Pre-Production Setup

Before deploying to production, complete these steps:

### Step 1: Environment Configuration
```bash
# Add to production .env file:
GOOGLE_YOUTUBE_API_KEY=<your_api_key_here>

# Optional (for future Instagram/TikTok integration):
INSTAGRAM_API_TOKEN=<token>
TIKTOK_API_KEY=<key>
TIKTOK_API_SECRET=<secret>
```

**Note:** YouTube API key is optional for development (will show "not configured" error). Required for production.

### Step 2: Database Migration
```bash
# Run Prisma migration to create ExternalSocialProfile table
npx prisma migrate deploy
```

### Step 3: Verify Builds
```bash
# Test both builds compile without errors
cd apps/api && npm run build
cd apps/web && npm run build
```

### Step 4: Run Test Suite
```bash
node test-analytics-flow.js
```

All tests should pass. Output will confirm:
- ✅ Input normalization
- ✅ API routes
- ✅ Database models
- ✅ Service functions
- ✅ Frontend integration
- ✅ Logging
- ✅ Error handling

## Deployment Steps

### Step 1: Deploy API Server
```bash
cd apps/api
npm run build
npm start  # Or your deployment command
```

**Verify:** Check logs for `[ANALYTICS] Server started` or similar

### Step 2: Deploy Web Application
```bash
cd apps/web
npm run build
npm run start  # Or your deployment command
```

**Verify:** Web app accessible at your domain

### Step 3: Test in Production

#### Test Case 1: YouTube URL
1. Go to Admin > Analytics
2. Paste URL: `https://youtube.com/@cristiano`
3. Click "Analyze"
4. ✅ Should load YouTube channel stats
5. ✅ Check logs for `[ANALYTICS] Synced profile`

#### Test Case 2: Cache Behavior
1. Analyze YouTube profile (takes 1-2s)
2. Go back and re-analyze same URL
3. ✅ Should load instantly (cached)
4. ✅ UI should show "cached" badge

#### Test Case 3: Manual Refresh
1. Click "Refresh" button
2. ✅ Should force new data fetch
3. ✅ Should bypass cache
4. ✅ UI should show "synced" badge

#### Test Case 4: Error Handling
1. Paste invalid URL: `https://example.com`
2. ✅ Should show "Could not parse URL" error
3. ✅ No server errors in logs

### Step 4: Monitor Logs

After deployment, monitor for:
```
[ANALYTICS] Analyze request
[ANALYTICS] Input normalized
[ANALYTICS] Fetching YouTube profile
[ANALYTICS] Synced profile
```

Any errors should be prefixed with `[ANALYTICS]` for easy filtering.

### Step 5: Database Verification

Check database has external profiles being saved:
```sql
SELECT COUNT(*) FROM "ExternalSocialProfile";
SELECT * FROM "ExternalSocialProfile" ORDER BY "lastFetchedAt" DESC LIMIT 5;
```

## Rollback Plan

If issues arise during deployment:

### Issue: "YouTube API not configured"
- **Cause:** GOOGLE_YOUTUBE_API_KEY not set in production
- **Fix:** Add key to .env and redeploy
- **Temporary:** Users will see helpful error message (no data loss)

### Issue: "Could not fetch profile data"
- **Cause:** API key invalid or YouTube API disabled
- **Fix:** Verify API key is correct, re-enable YouTube API in Google Cloud
- **Rollback:** Revert to previous commit: `git revert <commit_hash>`

### Issue: Database migration failed
- **Cause:** ExternalSocialProfile table already exists or migration conflict
- **Fix:** Check migration logs: `npx prisma migrate resolve`
- **Rollback:** `npx prisma migrate resolve --rolled-back <migration_name>`

## Post-Deployment

### Monitor (First 24 Hours)
- [ ] Check error logs for any `[ANALYTICS]` errors
- [ ] Verify cache behavior (should see mix of "synced" and "cached" badges)
- [ ] Test with different input formats (URLs, @handles)
- [ ] Check database growth (new rows in ExternalSocialProfile)

### Metrics to Track
- API response time (should be <500ms for cached, <2s for fresh)
- Cache hit rate (should increase over time)
- Error rate (should be <1%)
- Database growth (number of unique profiles cached)

### Performance Tuning (If Needed)
```typescript
// In analyticsIngestionService.ts, adjust cache TTL:
const maxAge = 24;  // Change from 12 to 24 hours for less frequent updates
```

## Rollback Procedure

If critical issues occur:

```bash
# Revert to previous stable commit
git revert <problematic_commit_hash>
git push

# Or rollback database migration
npx prisma migrate resolve --rolled-back <migration_name>

# Redeploy API and Web
cd apps/api && npm run build && npm start
cd apps/web && npm run build && npm start
```

## Success Criteria

After deployment, verify:
- [ ] ✅ Users can paste YouTube URLs in Analytics page
- [ ] ✅ Real YouTube stats display (subscriber count, video count, etc.)
- [ ] ✅ Data persists in database
- [ ] ✅ Caching works (second request is instant)
- [ ] ✅ Manual refresh bypasses cache
- [ ] ✅ Error messages are helpful and clear
- [ ] ✅ No server errors in logs
- [ ] ✅ API response time acceptable (<2s)

## Support Contacts

For issues during deployment:
- **API Errors:** Check `/logs` for `[ANALYTICS]` prefix
- **Frontend Issues:** Check browser console (F12)
- **Database Issues:** Use Prisma Studio: `npx prisma studio`
- **YouTube API:** Check Google Cloud project dashboard

## Documentation

- **Implementation Details:** See `ANALYTICS_IMPLEMENTATION.md`
- **Architecture Diagram:** See `ANALYTICS_IMPLEMENTATION.md`
- **Testing Guide:** See `ANALYTICS_IMPLEMENTATION.md`
- **API Contract:** See `/apps/api/src/routes/admin/analytics.ts`
- **Service Code:** See `/apps/api/src/services/analyticsIngestionService.ts`

---

**Deployment Date:** ___________  
**Deployed By:** ___________  
**Environment:** ☐ Development ☐ Staging ☐ Production  
**Status:** ☐ Successful ☐ Issues Found (describe below)

**Notes:**
_________________________________
_________________________________
_________________________________
