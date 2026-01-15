# External Analytics — Quick Implementation Guide

**Status:** Ready for development  
**Priority 1 (MUST FIX):** API Response Standardization  
**Estimated Time:** 6 hours total  

---

## What Works ✅

- ✅ URL parsing (Instagram, TikTok, YouTube)
- ✅ Backend scraping + caching (NO official APIs)
- ✅ All analytics sections populate
- ✅ No OAuth flows triggered
- ✅ No tokens stored or sent to frontend
- ✅ Connection boundary maintained

## What Needs Fixing 🔧

1. **API Response Standardization** (2 hours)
2. **Add External Data Disclaimer** (30 min)
3. **Improve Null Value Labels** (1 hour)
4. **Add Data Source Badges** (2 hours)

---

## Priority 1: Fix API Response Structure

### Current Issue
Backend returns null values without context:
```json
{
  "overview": {
    "sentimentScore": null,
    "engagementRate": null
  }
}
```

### Required Solution
```json
{
  "overview": {
    "sentimentScore": {
      "value": null,
      "status": "external_estimate",
      "explanation": "Estimated from public comments only"
    },
    "engagementRate": {
      "value": 3.5,
      "status": "calculated",
      "explanation": "Calculated as (likes + comments) ÷ followers"
    }
  }
}
```

### Files to Modify

**Backend (2 files):**
1. `apps/api/src/routes/admin/analytics.ts` (line ~130)
   - Function: `buildAnalyticsFromExternalProfile()`
   - Change: Wrap all metrics in { value, status, explanation }
   - Time: 45 min

2. `apps/api/src/services/analyticsIngestionService.ts` (line ~200)
   - Function: Any helper functions that build metric objects
   - Change: Add status and explanation fields
   - Time: 30 min

**Frontend (4 files):**
1. `apps/web/src/components/Analytics/AnalyticsOverviewIntelligence.jsx` (line 30-50)
   - Change: Handle new nested structure
   - Time: 20 min

2. `apps/web/src/components/Analytics/AnalyticsContentPerformance.jsx`
   - Change: Update metric display logic
   - Time: 20 min

3. `apps/web/src/components/Analytics/AnalyticsAudienceHealth.jsx`
   - Change: Update metric display logic
   - Time: 20 min

4. `apps/web/src/components/Analytics/AnalyticsKeywordsThemes.jsx`
   - Change: Update metric display logic
   - Time: 15 min

### Test Cases
```bash
# Test external Instagram profile
curl -X POST /api/admin/analytics/analyze \
  -d '{"url": "https://instagram.com/instagram"}' \
# Should return: all metrics with status + explanation

# Test TikTok profile
curl -X POST /api/admin/analytics/analyze \
  -d '{"url": "https://tiktok.com/@tiktok"}' \
# Should return: all metrics with status + explanation

# Frontend should show:
# "Engagement Rate: 3.5% (Calculated from public metrics)"
# "Sentiment: Not available (Estimated from public comments only)"
```

---

## Priority 2: Add External Data Disclaimer (30 min)

**File:** `apps/web/src/pages/AdminAnalyticsPage.jsx`

**Location:** Header section (around line 237)

**Add:**
```jsx
{/* Disclaimer: External Profile */}
<div className="rounded-2xl bg-brand-linen/30 border border-brand-black/10 p-4 flex items-start gap-3">
  <InfoIcon className="h-5 w-5 text-brand-red flex-shrink-0 mt-0.5" />
  <div>
    <p className="text-xs uppercase tracking-[0.2em] font-semibold text-brand-black mb-1">
      External Profile — Snapshot Data
    </p>
    <p className="text-xs text-brand-black/60">
      Data is estimated from public metrics. Not pulled from private APIs. 
      Accuracy may vary by platform and availability of public data.
    </p>
  </div>
</div>
```

---

## Priority 3: Improve Null Value Labels (1 hour)

**File:** `apps/web/src/components/Analytics/AnalyticsOverviewIntelligence.jsx`

**Change all "—" to meaningful labels:**

```jsx
// Before:
value: overview.sentimentScore ? ... : "—"

// After:
value: overview.sentimentScore?.value 
  ? `${(overview.sentimentScore.value * 100).toFixed(0)}%` 
  : "Not Available",
subtext: overview.sentimentScore?.explanation 
  || "Estimated from public comments"
```

---

## Priority 4: Add Data Source Badges (2 hours)

**Files:** All 4 analytics component files

**Add to each section header:**
```jsx
{/* Data Source Badge */}
<span className="text-[0.65rem] uppercase tracking-[0.15em] font-semibold px-2 py-1 rounded-full bg-brand-red/10 text-brand-red">
  {data.overview?.dataSource || "external"}
</span>
```

---

## Verification After Implementation

Run this checklist:

- [ ] Paste Instagram URL → All sections populate with explanations
- [ ] Paste TikTok URL → All sections populate with explanations
- [ ] All null values show "Not Available" or "Estimated" label
- [ ] "External profile — snapshot data" disclaimer visible
- [ ] Data source badge shown on sections (API / Scraped / Cached)
- [ ] Status field in API response (external_estimate / calculated / api)
- [ ] No OAuth redirects triggered
- [ ] No tokens logged or sent to frontend
- [ ] Demo works cleanly for business use case

---

## Testing Commands

```bash
# Test basic endpoint
curl -X POST https://api.tbctbctbc.online/api/admin/analytics/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://instagram.com/instagram"}'

# Should see in response:
# - overview.sentimentScore = { value: X, status: "...", explanation: "..." }
# - overview.engagementRate = { value: X, status: "...", explanation: "..." }
# - contentPerformance = [ posts with metric objects ]
# - audience = { ... with explanation fields }
# - keywords = [ { word, explanation, source } ]
```

---

## Success Criteria

✅ All metrics return structured objects with status + explanation  
✅ Frontend displays explanations inline  
✅ Disclaimer visible on page  
✅ Data source badges shown  
✅ No API errors silently swallowed  
✅ Demo works for uninformed viewer (no technical jargon needed)

---

## Timeline

- **Day 1:** API response standardization (2 hrs) + tests (1 hr)
- **Day 2:** Frontend component updates (3 hrs) + disclaimer (30 min)
- **Day 3:** Testing + refinement (2 hrs)

**Total:** 6 hours implementation, 8-10 hours with QA

---

**Audit Document:** See EXTERNAL_ANALYTICS_AUDIT_COMPLETE.md for full details
