# Instagram Follower Count Estimation - Visual Guide

## User Flow

### Scenario 1: User Pastes Public Instagram URL

```
User Input:
┌─────────────────────────────────────┐
│ https://instagram.com/username      │
└─────────────────────────────────────┘
           ↓
System Checks: Cache (12hr TTL)
           ↓
Found in cache? → YES
           ↓
   Display with "(Cached)" badge
   ┌───────────────────────────────┐
   │     12.5K                     │
   │  ┌──────────┐                 │
   │  │ Cached   │  ← status badge │
   │  └──────────┘                 │
   │ Followers (Cached)            │
   │ Previously captured public    │
   │ follower count                │
   └───────────────────────────────┘
           
NOT in cache? → Fetch Fresh Data
           ↓
Extract from HTML metadata (2s timeout)
┌──────────────────────────────────────┐
│ og:description:                      │
│ "username posts, 12534 followers..."│
└──────────────────────────────────────┘
           ↓
Display with "(Estimated)" badge
┌───────────────────────────────┐
│     12.5K                     │
│  ┌──────────────┐             │
│  │ Estimated    │  ← badge    │
│  └──────────────┘             │
│ Followers (Estimated)         │
│ Estimated from publicly      │
│ available profile metadata    │
└───────────────────────────────┘
```

### Scenario 2: Instagram Blocks Request

```
User Input:
┌─────────────────────────────────────┐
│ https://instagram.com/blocked_user  │
└─────────────────────────────────────┘
           ↓
System Checks: Cache
    ↓ (Not found or expired)
Attempts: HTML Metadata Extract
    ↓ (2-second timeout)
Instagram Returns: 403 Forbidden (Bot Detection)
           ↓
Graceful Fallback:
Display with "Unavailable" status
┌───────────────────────────────┐
│         —                     │
│ Followers                     │
│                               │
│ 🔒 Hover Tooltip:            │
│ "Instagram restricts         │
│  automated access..."        │
└───────────────────────────────┘
```

---

## External Profile Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│                      ANALYTICS PAGE                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ⚠️  DISCLAIMER BANNER (External Profiles Only)            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ ⚠️ External profile — snapshot data                  │  │
│  │                                                      │  │
│  │ Metrics are based on publicly available information │  │
│  │ and may be estimated. Metrics are updated          │  │
│  │ periodically and may not reflect real-time data.   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  OVERVIEW SECTION                                           │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Total Reach │ Engagement │ Posts │ Sentiment       │    │
│  │ ─────────────────────────────────────────────────  │    │
│  │  12.5K      │    2.3%    │  342  │   Positive     │    │
│  │ [Estimated] │[Estimated] │[Meas.]│[Estimated]    │    │
│  │                                                    │    │
│  │ Top Platform                 │ Platform Followers │    │
│  │ ────────────────────────────────────────────────  │    │
│  │ Instagram                    │ 12.5K [Estimated]  │    │
│  │                              │ Followers         │    │
│  │                              │ Estimated from    │    │
│  │                              │ publicly available│    │
│  │                              │ profile metadata  │    │
│  └────────────────────────────────────────────────────┘    │
│                                                             │
│  CONTENT PERFORMANCE SECTION                                │
│  [Additional analytics modules...]                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

```
╔════════════════════════════════════════════════════════════════╗
║                    SYSTEM ARCHITECTURE                          ║
╚════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────┐
│ FRONTEND (React Components)                                 │
│                                                             │
│  AdminAnalyticsPage.jsx                                    │
│  ├── Shows disclaimer banner                              │
│  └── Passes data to components                            │
│                                                             │
│  AnalyticsOverviewIntelligence.jsx                         │
│  ├── Displays follower count metric                       │
│  ├── Shows status badge (Estimated/Cached)               │
│  └── Adds "(Estimated)" label to followers                │
└─────────────────────────────────────────────────────────────┘
                            ↓
        ┌───────────────────┴──────────────────┐
        │         API Gateway                   │
        │    /api/admin/analytics/analyze       │
        └───────────────────┬──────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ BACKEND (Express Routes)                                    │
│                                                             │
│ analytics.ts - Route Handler                              │
│ └── buildAnalyticsFromExternalProfile()                   │
│     ├── Detects data source (cache vs scrape)            │
│     ├── Adds status: "estimated" or "cached"             │
│     ├── Adds source: "scrape" or "cache"                 │
│     └── Returns MetricResponse with explanation          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ DATA LAYER (Instagram Service + Cache)                      │
│                                                             │
│ scrapeInstagramProfile() → Strategy 1:                    │
│ └── extractFollowerCountFromHTML()                        │
│     ├── Fetch HTML with 2s timeout                        │
│     ├── Extract from og:description meta tag              │
│     ├── Fallback: JSON-LD schema parsing                  │
│     └── Return: {followerCount, displayName}             │
│                                                             │
│ Cache Layer (ExternalSocialProfile):                      │
│ ├── Model: {platform, username, snapshotJson, ..}        │
│ ├── TTL: 12 hours                                         │
│ └── Checked automatically in buildAnalytics()             │
└─────────────────────────────────────────────────────────────┘
                            ↓
        ┌───────────────────┴──────────────────┐
        │    Instagram's Public HTML            │
        │    (Accessible without login)         │
        │                                       │
        │  ┌────────────────────────────────┐  │
        │  │ og:description:                │  │
        │  │ "username posts,              │  │
        │  │  12534 followers,             │  │
        │  │  8901 following"              │  │
        │  └────────────────────────────────┘  │
        └──────────────────┬───────────────────┘
                            ↓
                   Returns: 12534
```

---

## Metric Response Structure

### Example 1: Fresh Scrape (Estimated)

```json
{
  "overview": {
    "totalReach": {
      "value": 12534,
      "status": "estimated",
      "explanation": "Estimated from publicly available profile metadata",
      "source": "scrape"
    },
    "topPlatformFollowers": {
      "value": 12534,
      "status": "estimated",
      "explanation": "Estimated from publicly available profile metadata",
      "source": "scrape"
    }
  }
}
```

### Example 2: Cached Data

```json
{
  "overview": {
    "totalReach": {
      "value": 12534,
      "status": "estimated",
      "explanation": "Previously captured public follower count (cached)",
      "source": "cache"
    },
    "topPlatformFollowers": {
      "value": 12534,
      "status": "estimated",
      "explanation": "Previously captured public follower count (cached)",
      "source": "cache"
    }
  }
}
```

### Example 3: Blocked / Unavailable

```json
{
  "overview": {
    "totalReach": {
      "value": null,
      "status": "unavailable",
      "explanation": "Instagram restricts automated access to follower counts",
      "source": "inferred"
    },
    "topPlatformFollowers": {
      "value": null,
      "status": "unavailable",
      "explanation": "Instagram restricts automated access to follower counts",
      "source": "inferred"
    }
  }
}
```

---

## Component Behavior Tree

```
┌──────────────────────────────────────────────────┐
│ AnalyticsOverviewIntelligence Component           │
└──────────────────────────────────────────────────┘
                    │
                    ├─ Check: topPlatformFollowers exists?
                    │
                    ├─ YES: Render card with follower metric
                    │       │
                    │       ├─ Display: Value
                    │       │   Example: "12.5K"
                    │       │
                    │       ├─ Display: Status Badge
                    │       │   If status === "estimated" → "Estimated"
                    │       │   If status === "cached" → "Cached"
                    │       │
                    │       ├─ Display: Label
                    │       │   "Followers"
                    │       │   + (status === "estimated" ? " (Estimated)" : "")
                    │       │
                    │       └─ Display: Explanation (hover)
                    │           Shows metric.explanation text
                    │
                    └─ NO: Skip card
```

---

## Cache Lifecycle

```
Timeline: Profile Data in Cache
═════════════════════════════════════════

t=0s  : User pastes Instagram URL
        ↓
       System fetches ExternalSocialProfile from DB
        ↓ NOT FOUND
       Scrape Instagram HTML (2s timeout)
        ↓
       Extract follower count: 12534
        ↓
       Save to ExternalSocialProfile:
       {
         platform: "instagram",
         username: "username",
         snapshotJson: {..., followerCount: 12534},
         lastFetchedAt: 2024-01-15T10:00:00Z
       }
        ↓
       Return with source: "scrape"

────────────────────────────────────────

t=1m  : User refreshes page (same URL)
        ↓
       System checks cache:
       lastFetchedAt = 1 minute ago
       Age = 1 minute < 12 hours ✓
        ↓
       Return cached value with source: "cache"

────────────────────────────────────────

t=11h59m : Same user, same URL (before cache expires)
        ↓
       Cache still valid
       Return with source: "cache"

────────────────────────────────────────

t=12h1m : Cache expires
        ↓
       System refetches fresh data
       (Only on next user request)
        ↓
       New data with source: "scrape"
```

---

## HTML Metadata Extraction

### Source Format: og:description Meta Tag

```html
<!-- Instagram Profile Page -->
<html>
  <head>
    <meta property="og:description" content="johnny_doe posts, 12534 followers, 843 following" />
    <meta property="og:title" content="Johnny Doe (@johnny_doe) • Instagram" />
    <meta property="og:image" content="https://..." />
  </head>
  <body>
    ...
  </body>
</html>
```

### Extraction Logic

```typescript
// Step 1: Extract og:description
const descriptionMatch = html.match(/<meta property="og:description" content="([^"]+)"/);
// Result: "johnny_doe posts, 12534 followers, 843 following"

// Step 2: Find follower count in description
const followerMatch = description.match(/(\d+(?:,\d+)*)\s+followers/i);
// Result: ["12534 followers", "12534"]

// Step 3: Parse number and remove commas
const followerCount = parseInt("12534".replace(/,/g, ''), 10);
// Result: 12534
```

---

## Error Handling Flow

```
Fetch Instagram HTML
│
├─ Network Error → Return null
│  "Network timeout or unreachable"
│
├─ 404 Profile Not Found → Return null
│  "Profile does not exist"
│
├─ 403/401 Forbidden/Unauthorized → Return null
│  "Instagram blocked bot request"
│  (Expected for many profiles)
│
├─ 2-second Timeout → Return null
│  "Request took too long, Instagram likely blocking"
│
├─ HTML fetch OK (200) but no metadata → Return null
│  "Could not parse follower count from metadata"
│  (Instagram changed page structure)
│
└─ HTML fetch OK + metadata found → Return followerCount
   "Successfully extracted follower count"
```

---

## Badge Color Legend

```
Status Badge Colors
═════════════════════════════════════════

┌─────────────────────────────────┐
│ Estimated │ Gray badge          │
│           │ Source: Fresh scrape │
│           │ or cached estimate   │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ Cached    │ Gray badge          │
│           │ Source: Database     │
│           │ (< 12 hours old)     │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ Unavailable│ Gray badge          │
│           │ Source: Fallback     │
│           │ (Instagram blocked)  │
└─────────────────────────────────┘
```

---

## Security & Privacy Notes

```
✅ Secure Implementation
─────────────────────────────────────

1. PUBLIC HTML ONLY
   └─ No login required
   └─ No OAuth tokens
   └─ No authentication

2. NO HEADLESS BROWSER
   └─ No Puppeteer
   └─ No Selenium
   └─ No heavy scraping tools

3. NO API KEYS
   └─ No Instagram Graph API
   └─ No third-party APIs
   └─ No secret storage

4. BOT DETECTION SAFE
   └─ 2-second timeout prevents hanging
   └─ User-agent rotation
   └─ No aggressive retries
   └─ Graceful fallback

5. RATE LIMITING
   └─ One request per profile analysis
   └─ 12-hour cache reduces requests
   └─ No hammering same profile

6. DATA MINIMIZATION
   └─ Only extract follower count
   └─ No email, DMs, or private data
   └─ No profile scraping beyond public metadata
```

---

## User Experience Comparison

### Before Implementation
```
User: "Why does the Analytics page show nothing for external profiles?"
System: Shows empty metrics with no explanation
User: Confused, unsure if feature works or if data exists
```

### After Implementation
```
User: Pastes Instagram URL
System: Shows follower count with "(Estimated)" label
User: Understands data is snapshot, not real-time
User: Sees disclaimer explaining limitations
User: Confident in data quality and source
```

---

## Summary

The Instagram Follower Count Estimation feature provides:

✅ **Best-effort estimates** for public Instagram profiles  
✅ **No login required** - uses public HTML only  
✅ **Transparent labeling** - "(Estimated)", "(Cached)", or unavailable  
✅ **Clear disclaimer** - warns about snapshot data  
✅ **Graceful degradation** - returns null when blocked  
✅ **Safe extraction** - lightweight HTML parsing only  
✅ **User-friendly UX** - badges, tooltips, explanations  
✅ **Backward compatible** - no changes to connected profiles  
