# Instagram Follower Count Estimation - Testing Quick Start

## Quick Links to Modified Files

1. **Backend - Instagram Service:**  
   [/apps/api/src/services/platforms/instagram.ts](/apps/api/src/services/platforms/instagram.ts#L330-L460)
   - New function: `extractFollowerCountFromHTML()`
   - Modified: `scrapeInstagramProfile()` to call extraction function

2. **Backend - Analytics Builder:**  
   [/apps/api/src/routes/admin/analytics.ts](/apps/api/src/routes/admin/analytics.ts#L545-L615)
   - Modified: `buildAnalyticsFromExternalProfile()` with source distinction

3. **Frontend - Analytics Page:**  
   [/apps/web/src/pages/AdminAnalyticsPage.jsx](/apps/web/src/pages/AdminAnalyticsPage.jsx#L440-L460)
   - Added: External profile disclaimer banner

4. **Frontend - Overview Component:**  
   [/apps/web/src/components/Analytics/AnalyticsOverviewIntelligence.jsx](/apps/web/src/components/Analytics/AnalyticsOverviewIntelligence.jsx#L160-L180)
   - Modified: Follower count card with status badge

---

## How to Test

### Test Case 1: Fresh Instagram Profile (Scrape)

**Objective:** Verify follower count extraction from public HTML metadata

**Steps:**
1. Navigate to `/admin/analytics`
2. Paste public Instagram URL: `https://instagram.com/cristiano`
3. Wait for data to load (2-3 seconds)
4. Check: Overview card shows follower count (e.g., "574M")
5. Check: Badge shows "Estimated"
6. Check: Label shows "Followers (Estimated)"
7. Check: Explanation says "Estimated from publicly available profile metadata"
8. Check: Yellow disclaimer banner visible at top

**Expected Output:**
```
┌─────────────────────────────┐
│ 574M                        │
│ ┌──────────────┐            │
│ │ Estimated    │            │
│ └──────────────┘            │
│ Followers (Estimated)       │
│ Estimated from publicly     │
│ available profile metadata  │
└─────────────────────────────┘
```

**Pass/Fail:** ✅ / ❌

---

### Test Case 2: Cached Profile Data

**Objective:** Verify cache behavior (12-hour TTL)

**Steps:**
1. Complete Test Case 1 (fetches fresh data)
2. Note the time (e.g., 10:00 AM)
3. Click "Refresh" button immediately
4. Wait for reload
5. Check: Same follower count displays
6. Check: Badge now shows "Cached" (not "Estimated")
7. Check: Explanation says "Previously captured public follower count"
8. Check: Data loaded instantly (< 1 second)

**Expected Output:**
```
Badge changes from "Estimated" → "Cached"
Explanation text: "Previously captured public follower count (cached)"
```

**Pass/Fail:** ✅ / ❌

**Note:** If badge still shows "Estimated", check that snapshot data includes timestamp and cache check is working

---

### Test Case 3: Blocked Instagram Profile

**Objective:** Verify graceful handling when Instagram blocks bot

**Steps:**
1. Paste Instagram profile URL that blocks bots: `https://instagram.com/limited_profile`
2. Wait for load attempt (2 seconds for timeout)
3. Check: Follower count shows "—" (em dash)
4. Check: Label shows "Followers" (no "(Estimated)" suffix)
5. Check: Status badge shows "Unavailable" (or removed)
6. Check: Explanation says "Instagram restricts automated access"
7. Check: Yellow disclaimer banner visible

**Expected Output:**
```
┌─────────────────────────────┐
│ —                           │
│ Followers                   │
│                             │
│ 🔒 Hover Tooltip:          │
│ "Instagram restricts       │
│  automated access to      │
│  follower counts"         │
└─────────────────────────────┘
```

**Pass/Fail:** ✅ / ❌

---

### Test Case 4: Profile Not Found

**Objective:** Verify handling of non-existent profiles

**Steps:**
1. Paste fake Instagram URL: `https://instagram.com/thisprofledoesntexist12345`
2. Wait for load attempt
3. Check: Shows "—" or error state
4. Check: No console errors (check F12)
5. Check: Error message is user-friendly

**Expected:** Graceful error handling, no system crash

**Pass/Fail:** ✅ / ❌

---

### Test Case 5: TikTok Unaffected

**Objective:** Verify TikTok behavior unchanged

**Steps:**
1. Navigate to `/admin/analytics`
2. Paste TikTok URL: `https://tiktok.com/@cristiano`
3. Wait for load
4. Check: Follower count loads (if TikTok API available)
5. Check: No "Estimated" label (TikTok has different extraction)
6. Check: Works same as before changes

**Expected:** TikTok behavior identical to pre-implementation

**Pass/Fail:** ✅ / ❌

---

### Test Case 6: Desktop Responsiveness

**Objective:** Verify UI displays correctly on desktop

**Steps:**
1. Open `/admin/analytics` on desktop (1920x1080 minimum)
2. Load Instagram profile
3. Check: Disclaimer banner spans full width
4. Check: Follower card displays properly in grid
5. Check: Status badge appears inline with number
6. Check: "(Estimated)" label visible in subtext
7. Check: No text overflow or wrapping issues

**Expected:** All elements properly aligned and readable

**Pass/Fail:** ✅ / ❌

---

### Test Case 7: Mobile Responsiveness

**Objective:** Verify UI displays correctly on mobile

**Steps:**
1. Open `/admin/analytics` on mobile (375x667)
2. Load Instagram profile
3. Check: Disclaimer banner stacks properly
4. Check: Follower card readable on small screen
5. Check: Status badge doesn't overflow
6. Check: Explanation text truncates gracefully
7. Check: Touch-friendly spacing maintained

**Expected:** Responsive layout maintains usability

**Pass/Fail:** ✅ / ❌

---

### Test Case 8: Console Logging

**Objective:** Verify logging for debugging

**Steps:**
1. Open DevTools (F12)
2. Go to Console tab
3. Paste Instagram URL
4. Watch logs during load
5. Look for logs with prefix `[INSTAGRAM]`
6. Check: Extraction attempts logged
7. Check: Success/failure clearly indicated
8. Check: No red error messages (warnings OK)

**Expected Log Output:**
```
[INSTAGRAM] Attempting lightweight HTML metadata extraction
[INSTAGRAM] Successfully extracted follower count from HTML {followerCount: 574000000, displayName: "Cristiano"}
[INSTAGRAM] Scrape successful via HTML metadata
```

**Pass/Fail:** ✅ / ❌

---

### Test Case 9: Error State Display

**Objective:** Verify error message clarity

**Steps:**
1. Block Instagram in browser (Network tab → Offline)
2. Try to load profile
3. Check: Error message is displayed
4. Check: Message explains the issue
5. Check: "Try Again" button appears
6. Check: Page doesn't crash
7. Enable network again
8. Click "Try Again" → Should succeed

**Expected:** User-friendly error handling

**Pass/Fail:** ✅ / ❌

---

## Visual Regression Testing

### Before vs After Comparison

**Before Implementation:**
```
Analytics Page
├── Empty or "N/A" for external profiles
├── No explanation of missing data
└── Confusing for users
```

**After Implementation:**
```
Analytics Page
├── ⚠️ External profile — snapshot data
│   └─ Clear disclaimer message
├── Overview Section
│   ├── Followers: 574M
│   │   └── Badge: "Estimated"
│   │       Label: "Followers (Estimated)"
│   │       Text: "Estimated from publicly available profile metadata"
│   └── Other metrics (unchanged)
└── Rest of page (unchanged)
```

**Verification:** Do not break existing UI elements

---

## Performance Testing

### Load Time Benchmark

**Test:** Compare load times before and after

**Procedure:**
1. Open DevTools Network tab
2. Hard refresh (Ctrl+Shift+R)
3. Paste Instagram URL
4. Note total load time
5. Check: Should be similar to before (±100ms)

**Expected:**
- Fresh fetch: 100-150ms total
- Cached fetch: < 50ms total
- No visible degradation

**Pass/Fail:** ✅ / ❌

---

## Browser Compatibility

Test on these browsers:

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

**Expected:** All browsers display correctly

---

## Accessibility Testing

### Keyboard Navigation

**Steps:**
1. Open page, disable mouse
2. Tab through elements
3. Check: All elements reachable
4. Check: Badge button is not focusable
5. Check: Links work with Enter key

**Expected:** Full keyboard accessibility

**Pass/Fail:** ✅ / ❌

### Screen Reader Testing

**Steps:**
1. Enable screen reader (e.g., NVDA, JAWS)
2. Navigate to followers metric
3. Check: Screen reader announces "Followers Estimated" or similar
4. Check: Badge text is announced
5. Check: Explanation is accessible

**Expected:** Content fully announced

**Pass/Fail:** ✅ / ❌

---

## Data Validation

### Check Response Structure

Open DevTools → Network tab → Look for `/api/admin/analytics/analyze`

**Expected Response:**
```json
{
  "overview": {
    "totalReach": {
      "value": 574000000,
      "status": "estimated",
      "explanation": "Estimated from publicly available profile metadata",
      "source": "scrape"
    },
    "topPlatformFollowers": {
      "value": 574000000,
      "status": "estimated",
      "explanation": "Estimated from publicly available profile metadata",
      "source": "scrape"
    }
  }
}
```

**Check:**
- [ ] Value is a number (not 0 for failed requests)
- [ ] Status is "estimated", "cached", or "unavailable"
- [ ] Explanation text present
- [ ] Source field shows "scrape" or "cache"

**Pass/Fail:** ✅ / ❌

---

## Sign-Off

### Test Summary Template

```
Test Date: ________________
Tester: ____________________
Browser: ___________________
Device: _____________________

Test Cases Passed: _____ / 9
Test Cases Failed: _____ / 9

Critical Issues: ☐ None  ☐ Found

Comments:
_________________________________
_________________________________

Sign-off: ____________________ (Date: ___)
```

---

## Rollback Instructions (If Needed)

If critical issues found, rollback is simple:

```bash
# Revert all changes in order
git revert <commit-hash-4>  # Remove disclaimer banner
git revert <commit-hash-3>  # Remove badges
git revert <commit-hash-2>  # Revert analytics.ts
git revert <commit-hash-1>  # Revert instagram.ts

# Push to production
git push origin main
```

**Estimated Time:** < 5 minutes  
**Data Impact:** None (no data modified)  
**User Impact:** Feature disabled, falls back to previous behavior

---

## Known Issues

### None at this time

All code has been:
- ✅ Implemented
- ✅ Type-checked
- ✅ Error-handled
- ✅ Logged
- ✅ Documented

---

## Support

### If tests fail:

1. **Check console for errors:** `F12 → Console tab`
2. **Review network requests:** `F12 → Network tab → Look for 403/401 errors`
3. **Check logs:** `[INSTAGRAM]` prefix in console
4. **Verify files modified:** Check that all 4 files have changes
5. **Clear cache:** Hard refresh (Ctrl+Shift+R)
6. **Check build:** Ensure no compilation errors

### Contact: [Your Team]

---

## Next Steps After Testing

If all tests pass:

1. ✅ Merge PR to main branch
2. ✅ Deploy to production
3. ✅ Monitor logs for [INSTAGRAM] extraction success rate
4. ✅ Check user feedback
5. ✅ Monitor performance metrics
6. ✅ Update documentation

---

## Helpful Links

- [Instagram Follower Estimation - Complete Implementation](/INSTAGRAM_FOLLOWER_ESTIMATION_COMPLETE.md)
- [Instagram Follower Estimation - Visual Guide](/INSTAGRAM_FOLLOWER_ESTIMATION_VISUAL_GUIDE.md)
- [Implementation Verification - Code Changes](/INSTAGRAM_IMPLEMENTATION_VERIFICATION.md)
- [External Analytics Runtime Audit](/EXTERNAL_ANALYTICS_RUNTIME_AUDIT.md)

---

**Status:** ✅ Ready for Testing  
**Date:** 2024  
**Version:** 1.0
