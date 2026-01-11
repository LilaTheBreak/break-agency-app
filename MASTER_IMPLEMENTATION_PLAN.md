# Master Implementation Plan: Social Intelligence & Operations Stack

**Date**: 11 January 2026  
**Status**: IN PROGRESS  
**Target**: Production-ready on Neon + Railway  

---

## 📊 Current State Assessment

### ✅ Already Implemented
1. **Analytics Core** (Phase 1)
   - POST `/api/admin/analytics/analyze` endpoint ✅
   - Input normalization (10+ formats) ✅
   - YouTube Data API v3 integration ✅
   - ExternalSocialProfile database table ✅
   - 12-hour cache with manual refresh ✅
   - Comprehensive logging with [ANALYTICS] prefix ✅

2. **Platform Foundation**
   - Service layer for YouTube ✅
   - Service stubs for Instagram/TikTok ✅
   - Database persistence ✅

3. **Frontend**
   - AdminAnalyticsPage with URL input ✅
   - Profile selector component ✅

### ⏳ TODO - Remaining Phases

| Phase | Component | Status | Priority | Effort |
|-------|-----------|--------|----------|--------|
| 1 | Analytics Core (Verification) | ✅ VERIFY | CRITICAL | 2h |
| 2 | YouTube Full Sync | TO BUILD | HIGH | 4h |
| 2 | Instagram Hybrid (API+Scrape) | TO BUILD | HIGH | 6h |
| 2 | TikTok Sync (Scrape) | TO BUILD | HIGH | 5h |
| 3 | Trending Topics Scraper | TO BUILD | MEDIUM | 4h |
| 3 | Web Intelligence Scraper | TO BUILD | MEDIUM | 8h |
| 4 | Community Health Signals | TO BUILD | MEDIUM | 5h |
| 5 | Gmail Integration | TO BUILD | MEDIUM | 6h |
| 5 | Calendar Integration | TO BUILD | MEDIUM | 4h |
| 6 | Talent Intelligence Aggregator | TO BUILD | HIGH | 6h |
| 7 | End-to-End Validation | FINAL | CRITICAL | 3h |

**Total Remaining Effort**: ~53 hours across remaining 11 components

---

## 🎯 Phase 1: Analytics Core Verification (2h)

### Goal
Verify POST /api/admin/analytics/analyze is fully functional end-to-end.

### Checklist
- [ ] POST /api/admin/analytics/analyze accepts YouTube URL
- [ ] Platform detection works correctly
- [ ] Cache logic respects TTL (12h default)
- [ ] Manual refresh bypasses cache
- [ ] Data persists to ExternalSocialProfile table
- [ ] [ANALYTICS] logs visible in API logs
- [ ] UI renders real returned values (not placeholders)

### Success Criteria
- Real YouTube channel returns real metrics
- Cache is used on subsequent calls (same timestamp)
- DB row exists and contains expected data

### Files Involved
- `apps/api/src/routes/admin/analytics.ts`
- `apps/api/src/services/analyticsIngestionService.ts`
- `apps/web/src/pages/AdminAnalyticsPage.jsx`
- Neon database `ExternalSocialProfile` table

---

## 🚀 Phase 2: Platform Sync (Real Data) (15h total)

### Component 2a: YouTube Sync (4h)
**Goal**: Full YouTube channel analytics ingestion using official API v3.

**Implementation**:
1. Create `apps/api/src/services/platforms/youtube.ts`
   - Fetch: subscriberCount, viewCount, videoCount
   - Top videos: Last 30 days
   - Raw API response storage
   - Quota handling + caching (1h TTL for videos)

2. Enhance ExternalSocialProfile table (if needed)
   - Add `syncMetadata` (JSON) for quota tracking
   - Add `lastVideoFetch` timestamp

3. Tests:
   - Real YouTube channel returns real metrics
   - Quota limits respected
   - Cache working correctly

**Environment Variables**:
```
GOOGLE_YOUTUBE_API_KEY=your-key-here
```

### Component 2b: Instagram Sync - Hybrid (6h)
**Goal**: Pull public IG insights safely (API fallback to scrape).

**Implementation**:
1. Create `apps/api/src/services/platforms/instagram.ts`
   - Check for official API credentials
   - If available: Use official endpoints (followers, posts, metrics)
   - Otherwise: Scrape public profile page
   - Extract: Follower count, bio, post count
   - Flag data source (API vs Scrape)

2. Scraper library: `puppeteer` or `cheerio`
   - Rate limiting (max 1 request/5sec per profile)
   - Retry logic (exponential backoff)
   - User-agent rotation
   - Clear error messages if blocked

3. Tests:
   - Public IG profile returns data
   - Honest errors if blocked
   - Source flagging works

**Environment Variables**:
```
INSTAGRAM_API_KEY=optional-key
INSTAGRAM_API_SECRET=optional-secret
```

### Component 2c: TikTok Sync - Scrape (5h)
**Goal**: Pull public TikTok creator data safely.

**Implementation**:
1. Create `apps/api/src/services/platforms/tiktok.ts`
   - Normalize: @handle, URL, handle variations
   - Scrape public profile:
     - Follower count
     - Total likes
     - Video count
     - Recent post velocity (last 7 days)
   - Cache results (1h TTL)
   - Persist snapshot

2. Rate limiting:
   - Max 1 profile/10sec
   - Backoff if rate limited
   - Clear error if blocked

3. Tests:
   - TikTok handle returns real data
   - Rate limiter working
   - Handles blockage gracefully

**No environment variables needed** (public data only)

---

## 🧠 Phase 3: Trend & Intelligence Layer (12h total)

### Component 3a: Trending Topics Scraper (4h)
**Goal**: Identify trending topics in creator's niche.

**Sources**:
1. Google Trends (unofficial API)
2. TikTok Trending (public page scrape)
3. Twitter/X Trending (public API)
4. Reddit Trends (subreddit analysis)

**Implementation**:
1. Create `apps/api/src/services/intel/trendingScraper.ts`
2. Each source as independent function
3. Tag by category (e.g., "gaming", "fashion", "tech")
4. Store ranked topics with daily snapshots
5. Link to talent niches (if available)

**Files to Create/Modify**:
- New: `TrendingTopic` model in schema
- New: `apps/api/src/services/intel/trendingScraper.ts`
- New: `apps/api/src/routes/intel/trends.ts`

### Component 3b: Web Intelligence Scraper - OSINT (8h)
**Goal**: Pull everything public about a talent.

**Sources**:
1. News articles (Google News API)
2. Blogs (Medium, Substack)
3. Podcasts (Podcast Index API)
4. Interviews (YouTube transcripts)
5. Reddit threads (Reddit API)
6. Forums (general scraping)

**Implementation**:
1. Create `apps/api/src/services/intel/osintScraper.ts`
2. Crawl name + handles across sources
3. Deduplicate results (URL-based)
4. Extract sentiment + keywords (basic NLP)
5. Store structured insights with timestamps

**Files to Create/Modify**:
- New: `WebIntelligence` model in schema
- New: `apps/api/src/services/intel/osintScraper.ts`
- New: `apps/api/src/routes/intel/osint.ts`

---

## 💬 Phase 4: Community Management (5h)

### Component 4a: Community Health & Signals
**Goal**: Understand audience quality beyond follower count.

**Tracking**:
1. Comment velocity (comments per post trend)
2. Sentiment analysis (positive/negative/neutral ratio)
3. Risk alerts (controversial spikes)
4. Engagement consistency (posting frequency + engagement ratio)

**Implementation**:
1. Create `apps/api/src/services/community/healthAnalyzer.ts`
2. Parse platform data for engagement metrics
3. Store community signals with timestamps
4. Calculate health score (1-100)
5. Generate alerts if thresholds crossed

**Files to Create/Modify**:
- New: `CommunitySignal` model in schema
- New: `apps/api/src/services/community/healthAnalyzer.ts`
- Enhance: AdminAnalyticsPage with health visualization

---

## 📧 Phase 5: Communication Integrations (10h total)

### Component 5a: Gmail Integration (6h)
**Goal**: Centralize creator communications.

**Implementation**:
1. OAuth: Google Gmail scope
2. Ingest inbound emails (thread-based)
3. Link conversations to talent + deals
4. Track: Opens, replies, response time
5. Store in new `GmailThread` model

**Files**:
- New: `GmailThread` model in schema
- New: `apps/api/src/services/comms/gmailSync.ts`
- New: `apps/api/src/routes/comms/gmail.ts`

### Component 5b: Calendar Integration (4h)
**Goal**: Centralize schedules + obligations.

**Implementation**:
1. OAuth: Google Calendar scope
2. Pull events daily
3. Link events to deals/campaigns/deliverables
4. Detect conflicts (overlapping commitments)
5. Store in new `CalendarEvent` model

**Files**:
- New: `CalendarEvent` model in schema (enhanced)
- New: `apps/api/src/services/comms/calendarSync.ts`
- New: `apps/api/src/routes/comms/calendar.ts`

---

## 🧩 Phase 6: Talent Intelligence Aggregator (6h)

### Component 6a: Unified Intelligence Profile
**Goal**: One intelligence snapshot per talent merging all sources.

**Data Merged**:
1. Social analytics (followers, engagement, growth)
2. Trends (relevant topics)
3. Web intel (news, interviews, mentions)
4. Community signals (health score, risks)
5. Email context (communication patterns)
6. Calendar (availability, commitments)

**Implementation**:
1. Create `TalentIntelligenceSnapshot` model
2. Create `apps/api/src/services/intel/aggregator.ts`
3. Endpoint: `GET /api/intel/talent/:talentId/snapshot`
4. Support refresh + history
5. Store monthly snapshots for comparison

**Files**:
- New: `TalentIntelligenceSnapshot` model
- New: `apps/api/src/services/intel/aggregator.ts`
- New: `apps/api/src/routes/intel/aggregator.ts`

---

## 🧪 Phase 7: End-to-End Validation (3h)

### Final Verification Checklist
- [ ] No mock data anywhere
- [ ] All APIs authenticated + rate-limited
- [ ] All scrapers respecting robots.txt
- [ ] All data persisted to DB (no in-memory)
- [ ] All errors logged honestly
- [ ] [SYNC], [ANALYTICS], [SCRAPER] logs visible
- [ ] Neon database reflects all changes
- [ ] No secrets hardcoded
- [ ] Ready for Railway deployment

### Testing with Real Creators
1. Test with 5+ real creators
2. Verify data accuracy
3. Check sync frequency + timing
4. Monitor API quota usage
5. Performance metrics collection

---

## 🛡️ Global Rules (NON-NEGOTIABLE)

✅ **DO**:
- Use environment variables for all keys/secrets
- Log every operation with [PREFIX] tags
- Persist all data to Neon database
- Fail honestly with clear error messages
- Respect API rate limits
- Version all database changes via migrations

❌ **DON'T**:
- Reset the database
- Use `prisma migrate dev` on production
- Add UI-only or mocked data
- Hardcode API keys or passwords
- Assume localhost environment

---

## 📈 Success Criteria

By the end of Phase 7:

1. **Admin Analytics is trustworthy**
   - Real data, not mock
   - Properly cached and refreshed
   - Logged comprehensively

2. **Talent profiles are alive**
   - Social metrics updated daily
   - Web intelligence aggregated
   - Community health tracked

3. **Community signals are actionable**
   - Risk alerts work
   - Engagement quality measurable
   - Opportunity identification automated

4. **Platform is investor-ready**
   - Zero hardcoded secrets
   - Production-grade error handling
   - Audit trail complete
   - Scalable on Railway

---

## 📋 Implementation Order

**CRITICAL PATH** (must complete in order):
1. ✅ Phase 1: Verify Analytics Core
2. → Phase 2: Platform Syncs (YouTube, Instagram, TikTok)
3. → Phase 6: Talent Intelligence Aggregator (depends on Phase 2)
4. → Phase 7: Final Validation

**PARALLEL** (can start anytime):
- Phase 3: Trends & OSINT
- Phase 4: Community Signals
- Phase 5: Comms Integrations

---

## 🚀 Deployment Strategy

### Local Testing (Neon + Local API)
1. Run API against Neon database
2. Test all scrapers + API calls
3. Verify logging + error handling
4. Performance profiling

### Staging (Railway Test)
1. Deploy to Railway staging environment
2. Test with real external APIs
3. Monitor rate limits + quota usage
4. Full end-to-end user flows

### Production (Railway Main)
1. Production database: Neon
2. All secrets in Railway environment variables
3. Scheduled syncs via cron
4. Monitoring + alerting enabled

---

**Last Updated**: 2026-01-11  
**Next Phase Start**: Phase 1 Verification (Now)
