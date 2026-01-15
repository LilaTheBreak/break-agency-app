# 🔄 BRAND ENRICHMENT FLOW DIAGRAM

## How Brand Enrichment Works

### 1️⃣ CREATE BRAND WITH WEBSITE URL

```
POST /api/crm-brands
├─ brandName: "David Lloyd"
└─ website: "https://www.davidlloyd.co.uk/"
        ↓
    [Create brand in DB]
        ↓
    [Response returned immediately]
        ↓
    [Async enrichment STARTS in background]
```

### 2️⃣ ASYNC ENRICHMENT PROCESS (Non-blocking)

```
[Async enrichment starts]
    ↓
[Fetch website HTML]
    ├─ ✅ Apple.com → 2MB HTML (success)
    ├─ ❌ David Lloyd → HTTP 403 (blocked)
    └─ ❌ Slow site → Timeout (>10s)
    ↓
[Parse with Cheerio]
    ├─ Extract logo
    ├─ Extract description
    ├─ Extract social links
    └─ Classify industry
    ↓
[Update brand in DB with enriched data]
    ├─ ✅ Success → "Brand enriched from website"
    └─ ❌ Failure → Log error, don't update
```

### 3️⃣ IF ENRICHMENT FAILED

**Before fix:** Silent failure, user doesn't know why

```
[User creates brand]
    ↓
[Response: Success, brand created]
    ↓
[Enrichment fails in background]
    ↓
[Only admins see error in server logs]
    ↓
[User sees empty logo/description fields]
    ↓
[User confused: "Why didn't it pull data?"]
```

**After fix:** Clear visibility + retry option

```
[User creates brand]
    ↓
[Response: Success, brand created]
    ↓
[Enrichment attempt logged]
    ├─ ✅ Success case:
    │   └─ [Data populated]
    └─ ❌ Failure case:
        └─ [Logged: "HTTP 403: Forbidden"]
    ↓
[User can see error in logs OR...]
    ↓
[User triggers POST /api/crm-brands/{id}/enrich]
    ↓
[Get real-time response with reason]
    ├─ ✅ Success: Data returned
    └─ ❌ Failure: Error message shows why
```

---

## Manual Enrichment Flow

### When User Triggers Manual Enrichment

```
User clicks "Retry enrichment" button
    ↓
POST /api/crm-brands/{brandId}/enrich
    ↓
[Fetch website HTML - synchronous]
    ├─ ✅ Success (2xx)
    │   ├─ Parse HTML
    │   ├─ Extract data
    │   ├─ Update brand DB
    │   └─ Return success response
    ├─ ❌ Forbidden (403)
    │   └─ Return error response
    ├─ ❌ Not Found (404)
    │   └─ Return error response
    └─ ❌ Timeout (>10s)
        └─ Return timeout error
    ↓
User sees result immediately
    ├─ ✅ Data populated
    └─ ❌ Error message explaining why
```

---

## Data Extraction Priority

### Logo Discovery
```
1. Check og:image meta tag
   ↓
2. Check apple-touch-icon link
   ↓
3. Check favicon link
   ↓
4. Try common paths (/logo.png, /logo.svg, etc.)
   ↓
5. Look for img tags with "logo" in class/id/alt
   ↓
6. ❌ Not found → Return undefined
```

### Description
```
1. Check meta description tag
   ↓
2. Check og:description tag
   ↓
3. Look for "about" section in HTML
   ↓
4. ❌ Not found → Return undefined
```

### Social Links
```
Scan ALL <a> tags for social patterns:
├─ instagram.com/username
├─ linkedin.com/company/name
├─ tiktok.com/@username
├─ twitter.com/username
├─ facebook.com/page
└─ Return all found or undefined
```

### Industry
```
Scan page text + brand name for keywords:
├─ Fashion, Beauty, Tech, Food, Travel, etc.
├─ Return first match
└─ Return undefined if no match
```

---

## Error Scenarios

### Scenario 1: Website Blocks Scrapers

```
POST /api/crm-brands/{id}/enrich
    ↓
[Fetch https://davidlloyd.co.uk/]
    ↓
Response: HTTP 403 Forbidden
    ↓
{
  "success": false,
  "error": "HTTP 403: Forbidden"
}
    ↓
[User manually adds logo from site]
PATCH /api/crm-brands/{id}
{ "logo": "https://..." }
```

### Scenario 2: Website Too Slow

```
POST /api/crm-brands/{id}/enrich
    ↓
[Fetch website...]
    ↓
[Still fetching after 10 seconds...]
    ↓
⏱️ TIMEOUT
    ↓
{
  "success": false,
  "error": "The operation was aborted"
}
    ↓
[User waits and tries again later]
```

### Scenario 3: Website Has No Meta Tags

```
POST /api/crm-brands/{id}/enrich
    ↓
[Fetch website]
    ↓
✅ Got HTML
    ↓
[Parse and extract...]
    ↓
❌ No meta description
❌ No og:image
❌ No social links
    ↓
{
  "success": false,
  "error": "No data could be extracted from the website"
}
```

### Scenario 4: Success - Data Extracted

```
POST /api/crm-brands/{id}/enrich
    ↓
[Fetch Apple.com]
    ↓
✅ Got HTML
    ↓
✅ Extract: og:image → Logo URL
✅ Extract: og:description → About
✅ Extract: Found Instagram link
✅ Extract: Classified as "Technology"
    ↓
[Update brand in DB]
    ↓
{
  "success": true,
  "enrichment": {
    "logoUrl": "https://apple.com/logo.png",
    "about": "Apple is an American technology company...",
    "industry": "Technology",
    "socialLinks": { "instagram": "..." }
  }
}
    ↓
✅ Brand updated
```

---

## Timing Diagram

### Async Enrichment (Background)
```
Time    Action                              Blocking?
────────────────────────────────────────────────────
0ms     POST /api/crm-brands                ✅ User waits
50ms    Create brand in DB                  ✅ User waits
100ms   Response sent                       ❌ NOT blocking
105ms   Start async enrichment              ❌ Background
200ms   Fetch HTML (usually 100-500ms)     ❌ Background
500ms   Parse & extract data                ❌ Background
600ms   Update database                     ❌ Background
610ms   Done                                ❌ Background
────────────────────────────────────────────────────
User   sees result at 100ms, enrichment completes at 610ms
```

### Manual Enrichment (Synchronous)
```
Time    Action                              Blocking?
────────────────────────────────────────────────────
0ms     POST /api/crm-brands/{id}/enrich   ✅ User waits
5ms     Fetch HTML                          ✅ User waits
200ms   Parse & extract data                ✅ User waits
250ms   Update database                     ✅ User waits
260ms   Response sent with result           ✅ User gets answer
────────────────────────────────────────────────────
User   sees result in 260ms (real-time feedback)
```

---

## Decision Tree

### What Happens When?

```
Brand created with website URL?
    ├─ YES
    │   ├─ Valid HTTP/HTTPS URL?
    │   │   ├─ YES → Start async enrichment
    │   │   └─ NO → Skip enrichment, log error
    │   └─ Enrichment starts in background (non-blocking)
    └─ NO → Skip enrichment entirely

User calls POST /api/crm-brands/{id}/enrich?
    ├─ Brand exists?
    │   ├─ YES
    │   │   ├─ Brand has website?
    │   │   │   ├─ YES → Fetch and enrich immediately
    │   │   │   └─ NO → Return "Brand has no website URL"
    │   └─ NO → Return "Brand not found"
    └─ Admin/Superadmin only?
        ├─ YES → Allowed
        └─ NO → Return 403 Forbidden
```

---

## Key Timeouts & Limits

```
Operation                   Timeout    Impact if exceeded
──────────────────────────────────────────────────────
Website fetch              10 seconds  Aborted, returns error
HTML parsing               <100ms      Usually instant
Database update            <100ms      Usually instant
Total async enrichment     ~1 second   If site is fast
Total manual enrichment    ~1 second   If site is fast
```

---

## Success Criteria

### Async Enrichment
✅ Success if:
- Website responded (2xx status)
- HTML parsed successfully
- At least ONE field extracted (logo, about, industry, or social)

❌ Fails if:
- Website blocked (403, 429)
- Website not found (404)
- Fetch timed out (>10s)
- No HTML returned
- No data could be extracted

### Manual Enrichment
Same as async + returns response immediately

---

## Logging

### What Gets Logged

```
[BRAND ENRICHMENT] Fetching https://example.com...
    ↓
[Success path]
[BRAND ENRICHMENT] Successfully enriched brand {id}

[Failure path]
[BRAND ENRICHMENT] Failed to enrich {website}: HTTP 403: Forbidden
```

### Debug Logs (if enabled)

```
[BRAND ENRICHMENT] Result for {id}: { success: false, error: "HTTP 403: Forbidden" }
[BRAND ENRICHMENT] Updating logoUrl for {id}: https://...
[BRAND ENRICHMENT] Updating industry for {id}: Technology
```

---

**This diagram shows the complete enrichment flow, error handling, and timing characteristics.**
