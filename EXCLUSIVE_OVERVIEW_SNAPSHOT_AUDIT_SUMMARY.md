# Quick Reference: Exclusive Overview Snapshot Audit

**Audit Date:** January 9, 2026  
**Full Report:** `EXCLUSIVE_OVERVIEW_SNAPSHOT_AUDIT.md` (10 sections, comprehensive)

---

## 🎯 TL;DR

| Question | Answer |
|----------|--------|
| Which file is the real overview page? | `/apps/web/src/pages/ExclusiveOverviewEnhanced.jsx` (871 lines) |
| What route does it use? | `/admin/view/exclusive` (index route, admin-only) |
| Are snapshots used? | ❌ NO - Overview uses manual API instead of snapshot system |
| Are commerce metrics shown? | ❌ NO - Only payout-based revenue (RevenueCard) |
| Is commerce feature wired? | ✅ YES - But hidden behind "Commerce" tab (not on overview) |
| Snapshot keys vs usage? | ❌ MISMATCH - Registry defines TOTAL_REVENUE but overview doesn't use it |

---

## 🔗 Component Chain

```
App.jsx
  ↓ Route: /admin/view/exclusive
ExclusiveTalentDashboardLayout
  ↓ <Outlet context={{session, basePath}} />
ExclusiveOverviewPage (export function)
  ↓ Renders: <ExclusiveOverviewEnhanced />
ExclusiveOverviewEnhanced (the actual page)
  ↓ Line 305-310: case "revenue" → <RevenueCard />
RevenueCard component (ExclusiveOverviewComponents.jsx:294)
  ↓ Displays: Earnings, Potential, Trend (payout-based)
```

---

## 📊 What's Rendered vs What's Not

### ✅ Currently Visible on Overview
- Payout-based revenue (Earnings to date, Potential, Trend)
- Hardcoded RevenueCard component
- Data from `/exclusive/revenue/summary` endpoint
- Only shows deal/payout metrics

### ❌ NOT Visible on Overview
- Commerce revenue (Shopify, TikTok, LTK, Amazon)
- E-commerce snapshots (COMMERCE_REVENUE, TOTAL_REVENUE)
- Revenue goals (REVENUE_GOAL_PROGRESS snapshot)
- Snapshot-based metrics (dynamic cards)

### ✅ Available But Hidden
- Commerce feature at `/admin/view/exclusive/commerce`
- TalentRevenueDashboard component (531 lines)
- Full store management UI
- Requires clicking "Commerce" tab to access

---

## 🏗️ Architecture Issue

### Current (Manual)
```
Page → Hook → Manual API call → Hardcoded RevenueCard
```

### Intended (Snapshots)
```
Page → Snapshot hook → Snapshot resolver → Dynamic snapshot cards
```

**Gap:** No hook connects overview page to snapshot system.

---

## 📋 Snapshot Registry Status

**Registry File:** `snapshotRegistry.ts` (393 lines)

**Defined for EXCLUSIVE_TALENT_OVERVIEW:**
1. ✅ TOTAL_REVENUE (registry line 259)
2. ✅ DEAL_REVENUE (registry line 275)
3. ✅ COMMERCE_REVENUE (registry line 291)
4. ✅ REVENUE_GOAL_PROGRESS (registry line 307)

**All have:**
- ✅ Resolvers implemented (snapshotResolver.ts)
- ✅ Role visibility: EXCLUSIVE
- ✅ Dashboard type: EXCLUSIVE_TALENT_OVERVIEW
- ✅ Default enabled: true
- ❌ But NOT used by ExclusiveOverviewEnhanced page

---

## 🔄 Data Source Mismatch

| What Overview Uses | What Registry Defines |
|--------------------|----------------------|
| `/exclusive/revenue/summary` (payouts) | `revenue.total` (all sources) |
| RevenueCard (hardcoded) | TOTAL_REVENUE snapshot |
| Trend indicator | Not in snapshots |
| Deal revenue (implicit) | DEAL_REVENUE snapshot |
| NOT: Commerce revenue | COMMERCE_REVENUE snapshot ✅ exists |
| NOT: Revenue goals | REVENUE_GOAL_PROGRESS snapshot ✅ exists |

---

## ✅ What's Working

✅ Snapshot infrastructure complete (registry + resolvers)  
✅ Commerce feature fully implemented (components + routes)  
✅ Database migration applied (tables exist in PostgreSQL)  
✅ Role gating in place (admin-only access)  
✅ Overview page properly routed

---

## ❌ What's Broken/Missing

❌ Snapshot system NOT integrated into overview page  
❌ No API endpoint for `/api/snapshots`  
❌ No `useSnapshots()` hook in overview  
❌ Commerce revenue NOT visible in default view  
❌ Revenue goals NOT displayed  
❌ Manual API call instead of resolvers  

---

## 🚀 Integration Gap

**To show COMMERCE_REVENUE in overview:**

1. Create `useSnapshots()` hook
2. Add `/api/snapshots` endpoint
3. Replace RevenueCard with dynamic snapshot cards
4. Include COMMERCE_REVENUE in resolved snapshots

**Estimated effort:** 2-3 hours

---

## 📂 Key Files Reference

**Overview Page:**
- `/apps/web/src/pages/ExclusiveOverviewEnhanced.jsx` (871 lines)

**Components:**
- `/apps/web/src/components/ExclusiveOverviewComponents.jsx:294` (RevenueCard)
- `/apps/web/src/components/TalentRevenueDashboard.jsx` (531 lines, only on Commerce tab)

**Data Fetching:**
- `/apps/web/src/hooks/useExclusiveTalentData.js` (manual API)

**Backend:**
- `/apps/api/src/routes/exclusive.ts:292` (revenue/summary endpoint)
- `/apps/api/src/routes/revenue.ts` (revenue routes)

**Snapshots (Unused):**
- `/apps/api/src/services/snapshotRegistry.ts` (definitions)
- `/apps/api/src/services/snapshotResolver.ts` (resolvers)

---

## 🎓 Audit Conclusion

The Exclusive Talent overview page is a **working but isolated system**:
- It has its own data fetching (not connected to snapshots)
- Commerce feature exists but is hidden (requires tab click)
- Snapshot infrastructure is complete but unused
- No integration point between systems

**Current State:** Commerce revenue metrics are not visible by default.  
**To Fix:** Wire snapshot system into overview page (no new features needed, just integration).
