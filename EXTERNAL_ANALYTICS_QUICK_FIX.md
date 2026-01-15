# External Analytics — Quick Implementation Guide

**Time to Fix:** 2 hours (P0 + P1)  
**Time to Perfect:** 4 hours (+ P2 + P3 + P4)  
**Ship-Ready:** After P0 + P1

---

## 🎯 What You Need to Know

**The Problem in One Sentence:**  
Instagram blocks bot requests (returns 401), so the feature returns empty data for Instagram profiles. The UI doesn't explain this, so users think the feature is broken. TikTok/YouTube work fine.

**The Solution in One Sentence:**  
Add an error banner explaining "Instagram is blocking requests" + add disclaimer "External profile — snapshot data."

---

## 🔴 P0: FIX (2 hours) - Add Error Banner

### Step 1: Modify AdminAnalyticsPage to show errors

**File:** [apps/web/src/pages/AdminAnalyticsPage.jsx](apps/web/src/pages/AdminAnalyticsPage.jsx#L80-L120)

**Find this line (around line 100):**
```jsx
if (!response.ok) {
  const errorMsg = data?.details || data?.error || response.statusText || "Failed to fetch analytics";
```

**Replace with:**
```jsx
if (!response.ok) {
  const errorMsg = data?.details || data?.error || response.statusText || "Failed to fetch analytics";
  console.error("[ANALYTICS] API Error:", errorMsg);
  setError(errorMsg);  // ← ADD THIS
  toast.error(errorMsg);  // ← ADD THIS
  setLoading(false);
  return;
}
```

### Step 2: Display error in UI

**In the same file, find the error render section (around line 310-330):**

```jsx
{error && (
  <div className="rounded-2xl border border-brand-red/30 bg-brand-red/5 p-6 mb-6">
    <p className="text-sm font-semibold text-brand-red">⚠️ Error</p>
    <p className="text-xs text-brand-black/60 mt-2">{error}</p>
  </div>
)}
```

**If it doesn't exist, add after the profile selector:**

```jsx
{/* Error Banner */}
{error && (
  <section className="rounded-3xl border border-red-300 bg-red-50 p-6 mb-6">
    <div className="flex gap-4">
      <div className="flex-shrink-0">⚠️</div>
      <div>
        <p className="font-semibold text-red-900">Data Not Available</p>
        <p className="text-sm text-red-800 mt-2">{error}</p>
        {error.includes("Instagram") && (
          <p className="text-xs text-red-700 mt-2">
            Instagram blocks automated profile analysis. Try a TikTok or YouTube profile instead.
          </p>
        )}
      </div>
    </div>
  </section>
)}
```

---

## 🟡 P1: FIX (30 minutes) - Add Disclaimer for External Profiles

### Step 1: Add disclaimer banner

**In AdminAnalyticsPage.jsx, after profile selection, add:**

```jsx
{/* External Profile Disclaimer */}
{selectedProfile?.type === "external" && analyticsData && (
  <section className="rounded-3xl border border-yellow-300 bg-yellow-50 p-6 mb-6">
    <div className="flex gap-3">
      <div className="flex-shrink-0 text-xl">📸</div>
      <div>
        <p className="text-xs uppercase tracking-[0.2em] font-semibold text-yellow-900">
          External Profile — Snapshot Data
        </p>
        <p className="text-xs text-yellow-800 mt-2">
          Based on publicly available information. Metrics may be estimated and are not real-time.
        </p>
      </div>
    </div>
  </section>
)}
```

### Step 2: Add to each analytics component

For each analytics section component (AnalyticsOverviewIntelligence, AnalyticsContentPerformance, etc.), wrap with:

```jsx
{analyticsData?.dataSource === "external" && (
  <div className="text-[0.65rem] uppercase tracking-[0.15em] text-gray-500 mb-2">
    📊 External data — Snapshot only
  </div>
)}
```

---

## 🟢 TESTING (30 minutes)

### Test Instagram (Should Show Error)
```bash
# Open AdminAnalyticsPage in browser
# Paste: https://instagram.com/cristiano
# Expected: Error banner explaining Instagram is blocking
```

### Test TikTok (Should Show Data)
```bash
# Paste: https://tiktok.com/@therock
# Expected: Real metrics (followers, videos, etc.)
```

### Test YouTube (Should Show Data)
```bash
# Paste: https://youtube.com/@LinusTechTips
# Expected: Real metrics (subscribers, videos, etc.)
```

### Check Logs
```bash
# Watch for: [INSTAGRAM] Returning placeholder data due to Instagram blocking
# Watch for: [TIKTOK] Successfully fetched profile from API
```

---

## 📊 WHAT YOU'LL SEE AFTER FIX

### Before (User Confused)
```
Paste: https://instagram.com/instagram
↓
Analytics shows: (blank page with "—" and 0s)
↓
User thinks: "Feature is broken"
```

### After (User Informed)
```
Paste: https://instagram.com/instagram
↓
Error banner shows:
  "⚠️ Data Not Available
   Instagram blocks automated profile analysis. Try TikTok or YouTube instead."
↓
Yellow disclaimer shows:
  "📸 External Profile — Snapshot Data
   Based on publicly available information. Metrics may be estimated."
↓
User thinks: "Oh, Instagram blocks it. That's fine, let me try TikTok."
```

---

## 🚀 DEPLOY CHECKLIST

- [ ] P0 implemented (error banner)
- [ ] P1 implemented (disclaimer)
- [ ] Tested Instagram URL → Shows error
- [ ] Tested TikTok URL → Shows data
- [ ] Tested YouTube URL → Shows data
- [ ] No console errors
- [ ] Logs show proper flow
- [ ] CSS doesn't break on mobile
- [ ] Accessibility: Error is readable, not just color

---

## 📅 NEXT PHASES (After Launch)

### P2 (This Week) - Improve Null Handling
- Show "Not available" instead of "—"
- Add tooltips with explanation text
- ~1 hour work

### P3 (Next Sprint) - Data Source Badges
- Add "Scraped", "API", "Cached" badges to metrics
- Show source on hover
- ~1.5 hours work

### P4 (Q2) - Instagram Official API
- Switch to official Instagram Graph API
- Requires Meta app review (4-6 weeks)
- Cost: Free (rate limits apply)
- Reliability: 99.9%

---

## 🔍 DEBUG COMMANDS

If something doesn't work:

```bash
# Check API is responding
curl -X POST http://localhost:5001/api/admin/analytics/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://tiktok.com/@therock"}'

# Watch logs
tail -f api-logs.txt | grep ANALYTICS

# Check database cache
sqlite3 home.db "SELECT username, platform, lastFetchedAt FROM ExternalSocialProfile LIMIT 5;"

# Clear cache (if stuck)
# DELETE FROM ExternalSocialProfile WHERE platform = 'INSTAGRAM';
```

---

**Ready to ship!** 🚀
