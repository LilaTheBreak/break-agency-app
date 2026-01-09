# AUDIT: Exclusive Talent Overview, Revenue Snapshots & Commerce Integration

**Date:** January 9, 2026  
**Type:** Snapshot Infrastructure & Revenue Rendering Audit  
**Scope:** Exclusive Talent overview page wiring to snapshot system and commerce feature  
**Audit Status:** ✅ COMPLETE - Findings documented below  

---

## PART 1 — EXCLUSIVE TALENT OVERVIEW PAGE IDENTIFICATION

### 📍 Real Overview Page Location

**Primary File:** `/Users/admin/Desktop/break-agency-app-1/apps/web/src/pages/ExclusiveOverviewEnhanced.jsx`

**Composition Chain:**
```
App.jsx (routing) 
  ↓ Route: /admin/view/exclusive (index)
  ↓
ExclusiveTalentDashboardLayout (outer shell)
  ↓ <Outlet context={session, basePath} />
  ↓
ExclusiveOverviewPage (page component export)
  ↓ Renders: <ExclusiveOverviewEnhanced session={session} basePath={basePath} />
  ↓
ExclusiveOverviewEnhanced (actual overview page - 871 lines)
  ↓ Renders dynamic sections in section.id switch statement
```

### 🔗 Route Configuration

**Route Path:** `/admin/view/exclusive` (index route)  
**Alternative Path:** `/exclusive-talent` (creator-side, if applicable)

**In App.jsx - Lines 1028-1034:**
```jsx
<Route
  path="/admin/view/exclusive"
  element={
    <ProtectedRoute session={session} allowed={[Roles.ADMIN, Roles.SUPERADMIN]}>
      <ExclusiveTalentDashboardLayout basePath="/admin/view/exclusive" session={session} />
    </ProtectedRoute>
  }
>
  <Route index element={<ExclusiveOverviewPage />} />
```

### 🔐 Role Gating

- **Access Control:** `ProtectedRoute` requires `session` + `[Roles.ADMIN, Roles.SUPERADMIN]`
- **Page Location:** Behind `/admin/view/exclusive` (admin-only path)
- **Note:** Only admins viewing exclusive talent overview, NOT talents viewing their own overview

### 📋 Component Composition

**ExclusiveOverviewEnhanced Structure:**
```jsx
export function ExclusiveOverviewEnhanced({ session, basePath }) {
  // Line 44: Data fetching hook
  const { data, loading, error, isFirstTime, refresh } = useExclusiveTalentData(session);

  // Line 45-46: Event and wellness hooks
  const { acceptEvent, declineEvent, processing } = useEventActions();
  const wellness = useWellnessCheckin();

  // Lines 101-114: Hero section (greeting, focus priorities)
  
  // Lines 262-275: Top Performing Posts section

  // Lines 277-278: Goals Progress Summary

  // Lines 280-285: Wellness Check-in (conditional)

  // Lines 287-368: Dynamic sections switch statement
  //   Cases: events, tasks, opportunities, projects, calendar, insights, REVENUE, ai-assistant
}
```

---

## PART 2 — SNAPSHOT RENDERING AUDIT

### 🔍 Snapshot Infrastructure Analysis

#### ❌ **Finding #1: NO Snapshot Registry Integration**

The ExclusiveOverviewEnhanced page does **NOT** use the snapshot registry system.

**Evidence:**
- No import of `snapshotRegistry.ts`
- No import of `snapshotResolver.ts`
- No API call to `/api/snapshots` or similar endpoint
- No `useSnapshots()` hook

**What IS being rendered instead:**
```jsx
// Line 305-310 in ExclusiveOverviewEnhanced.jsx
case "revenue":
  return (
    <RevenueCard
      key={section.id}
      revenue={data.revenue}
    />
  );
```

This hardcoded `case "revenue"` with `RevenueCard` component is **NOT driven by snapshot registry**.

#### ❌ **Finding #2: Data Source NOT from Snapshots**

**Where revenue data actually comes from:**

1. **Hook:** `useExclusiveTalentData()` in `apps/web/src/hooks/useExclusiveTalentData.js`
2. **API Call:** `apiFetch("/exclusive/revenue/summary", { signal: controller.signal })` (Line 65)
3. **Backend:** `GET /exclusive/revenue/summary` in `apps/api/src/routes/exclusive.ts` (Line 292)

**What this endpoint returns:**
```javascript
{
  totalEarned: formatSafeRevenue(totalEarned),        // Safe formatted number
  potentialRevenue: formatSafeRevenue(potentialRevenue),
  trend: "up" | "flat" | "down",
  rawTotal: totalEarned,
  rawPotential: potentialRevenue,
  agentMessage: "Managed by your agent. Questions? Just ask."
}
```

This is **deal-based revenue from payouts**, NOT e-commerce snapshots.

#### ✅ **Finding #3: Snapshot Registry DOES Exist (But Unused)**

**Snapshot Registry File:** `apps/api/src/services/snapshotRegistry.ts` (393 lines)

**Revenue Snapshots Defined (Lines 259-310):**
1. **TOTAL_REVENUE** (id: "TOTAL_REVENUE")
   - Data source: `"revenue.total"`
   - Type: currency
   - Role visibility: ["EXCLUSIVE"]
   - Dashboard type: ["EXCLUSIVE_TALENT_OVERVIEW"]
   - Default: enabled, order 1

2. **DEAL_REVENUE** (id: "DEAL_REVENUE")
   - Data source: `"revenue.deals"`
   - Type: currency
   - Role visibility: ["EXCLUSIVE"]
   - Default: enabled, order 2

3. **COMMERCE_REVENUE** (id: "COMMERCE_REVENUE")
   - Data source: `"revenue.commerce"`
   - Type: currency
   - Description: "Revenue from Shopify, TikTok, LTK, Amazon"
   - Default: enabled, order 3

4. **REVENUE_GOAL_PROGRESS** (id: "REVENUE_GOAL_PROGRESS")
   - Data source: `"revenue.goal_progress"`
   - Type: percentage
   - Default: enabled, order 4

#### ✅ **Finding #4: Snapshot Resolvers IMPLEMENTED**

**Snapshot Resolver File:** `apps/api/src/services/snapshotResolver.ts` (458 lines)

**Revenue Resolvers Implemented:**

- Line 215: `"revenue.total"` - Fetches sum of all RevenueEvent netAmount
- Line 252: `"revenue.deals"` - Fetches completed deal fees
- Line 286: `"revenue.commerce"` - Fetches RevenueEvent from Shopify/TikTok/LTK/Amazon/Custom platforms
- Line 322: `"revenue.goal_progress"` - Calculates goal completion percentage

**Example Resolver (commerce revenue):**
```typescript
"revenue.commerce": async (userId: string) => {
  const talent = await prismaClient.talent.findFirst({
    where: { userId },
    select: { id: true },
  });

  if (!talent) return 0;

  const sources = await prismaClient.revenueSource.findMany({
    where: {
      talentId: talent.id,
      platform: {
        in: ["SHOPIFY", "TIKTOK_SHOP", "LTK", "AMAZON", "CUSTOM"],
      },
    },
    select: { id: true },
  });

  if (sources.length === 0) return 0;

  const sourceIds = sources.map((s) => s.id);
  const events = await prismaClient.revenueEvent.findMany({
    where: {
      revenueSourceId: {
        in: sourceIds,
      },
    },
    select: { netAmount: true },
  });

  return events.reduce((sum, e) => sum + (e.netAmount || 0), 0);
}
```

**Status:** Resolvers are ready to work BUT database tables (RevenueSource, RevenueEvent) don't exist yet.

---

## PART 3 — REVENUE DATA RENDERING AUDIT

### 🔄 Current Revenue Rendering Flow

```
ExclusiveOverviewEnhanced
  ├─ Hook: useExclusiveTalentData(session)
  │   ├─ API: GET /exclusive/revenue/summary
  │   │   └─ Backend: apps/api/src/routes/exclusive.ts:292
  │   │       └─ Queries: prisma.payout.findMany()
  │   │           └─ Returns: { totalEarned, potentialRevenue, trend, ... }
  │   │
  │   └─ Stores in: data.revenue = { ... }
  │
  └─ Render Switch Case: case "revenue"
      └─ Component: <RevenueCard revenue={data.revenue} />
          └─ File: apps/web/src/components/ExclusiveOverviewComponents.jsx:294
              └─ Displays:
                  ├─ Earnings to date: {revenue.earningsFormatted}
                  ├─ Potential revenue: {revenue.potentialFormatted}
                  └─ Trend: {revenue.trend}
```

### 📊 What RevenueCard Currently Shows

**Component:** `RevenueCard` (lines 294-354 in ExclusiveOverviewComponents.jsx)

**Renders:**
```
┌─────────────────────────────────────────┐
│ Revenue overview                         │
│ Confidence, not accounting               │
│ Managed by your agent.                   │
├────────────┬────────────┬────────────────┤
│ Earnings   │ Potential  │ Trend           │
│ to date    │ revenue    │ (up/flat/down)  │
│ (YTD)      │ (pipeline) │ (description)   │
└────────────┴────────────┴────────────────┘
```

**Data Fields Used:**
- `revenue.earningsFormatted` - YTD formatted
- `revenue.potentialFormatted` - Pipeline formatted
- `revenue.trend` - Trend direction
- `revenue.trendDescription` - Trend explanation

**Source of Data:**
- From `/exclusive/revenue/summary` endpoint
- Calculated from payout records (Payout model)
- NOT from commerce/e-commerce platforms

### ❌ **Finding #5: Commerce Revenue NOT Displayed**

The current RevenueCard shows **payout-based revenue only**.

It does **NOT** show:
- ❌ Shopify store revenue
- ❌ TikTok Shop revenue
- ❌ LTK revenue
- ❌ Amazon affiliate revenue
- ❌ Commerce revenue snapshots (COMMERCE_REVENUE, TOTAL_REVENUE, REVENUE_GOAL_PROGRESS)

---

## PART 4 — COMMERCE INTEGRATION AUDIT

### 🏗️ Commerce Feature Status in Overview

#### ❌ **Finding #6: Commerce Tab NOT in Admin Overview Nav**

The "Commerce" tab is only in the **ExclusiveTalentDashboard** (exclusive talent's own dashboard), not in the Admin overview page.

**Admin Navigation** (ExclusiveTalentDashboard.jsx lines 20-32):
```javascript
const NAV_LINKS = (basePath) => [
  { label: "Overview", to: `${basePath}`, end: true },
  { label: "My Profile", to: `${basePath}/profile` },
  { label: "Socials", to: `${basePath}/socials` },
  { label: "Campaigns", to: `${basePath}/campaigns` },
  { label: "Analytics", to: `${basePath}/analytics` },
  { label: "Calendar", to: `${basePath}/calendar` },
  { label: "Commerce", to: `${basePath}/commerce` },  // ✅ PRESENT
  { label: "Projects", to: `${basePath}/projects` },
  { label: "Opportunities", to: `${basePath}/opportunities` },
  { label: "Tasks", to: `${basePath}/tasks` },
  { label: "Messages", to: `${basePath}/messages` },
  { label: "Settings", to: `${basePath}/settings` }
];
```

**However:** When admin clicks "Overview" (index route), they go to `ExclusiveOverviewEnhanced`, which does NOT render the "Commerce" tab in the header. It only renders the internal overview sections.

#### ❌ **Finding #7: Snapshots NOT Integrated in Overview**

The snapshot registry system is **not used** in ExclusiveOverviewEnhanced.

**Would need to:**
1. Fetch snapshots for role=EXCLUSIVE
2. Filter for dashboardTypes=["EXCLUSIVE_TALENT_OVERVIEW"]
3. Call snapshot resolvers for each enabled snapshot
4. Render snapshot cards dynamically

**Currently:** Hardcoded RevenueCard with manual API call.

#### ✅ **Finding #8: Commerce Component IS Wired to Route**

The TalentRevenueDashboard component **IS** routed:

**In App.jsx - Line 1041:**
```jsx
<Route path="commerce" element={<ExclusiveCommercePage />} />
```

**In ExclusiveTalentDashboard.jsx - Line 371-374:**
```typescript
export function ExclusiveCommercePage() {
  const { session } = useOutletContext() || {};
  return <TalentRevenueDashboard talentId={session?.talentId} />;
}
```

**Route Path:** `/admin/view/exclusive/commerce`

**What This Shows:**
- TalentRevenueDashboard (531 lines) - Full commerce management UI
- Allows adding Shopify, TikTok Shop, LTK, Amazon stores
- Displays revenue events and goals

**Condition:** Only visible if admin navigates to the "Commerce" tab, NOT on the overview page.

---

## PART 5 — DATA FLOW MAPPING

### 📡 Current (Simplified) Revenue Data Flow

```
Admin accesses /admin/view/exclusive
  │
  ├─→ ExclusiveOverviewEnhanced loads
  │    │
  │    ├─→ useExclusiveTalentData() hook
  │    │    │
  │    │    └─→ Promise.allSettled([
  │    │        apiFetch("/exclusive/revenue/summary"),
  │    │        ... other endpoints
  │    │      ])
  │    │
  │    ├─→ GET /exclusive/revenue/summary (exclusive.ts:292)
  │    │    │
  │    │    ├─→ prisma.payout.findMany({ where: { creatorId } })
  │    │    ├─→ Filter completed vs pending
  │    │    ├─→ Calculate trend
  │    │    │
  │    │    └─→ Return: {
  │    │          totalEarned: formatted,
  │    │          potentialRevenue: formatted,
  │    │          trend: "up|flat|down",
  │    │          agentMessage: "Managed by your agent..."
  │    │        }
  │    │
  │    └─→ data.revenue = { ... }
  │
  └─→ Render RevenueCard with data.revenue
       │
       └─→ Display:
           ├─ Earnings to date (YTD)
           ├─ Potential revenue (pipeline)
           └─ Trend indicator
```

### 📡 Snapshot-Based Revenue Flow (NOT CURRENTLY USED)

```
If using snapshot system:

Admin accesses /admin/view/exclusive
  │
  ├─→ ExclusiveOverviewEnhanced loads
  │    │
  │    ├─→ useSnapshots({ role: "EXCLUSIVE", dashboard: "EXCLUSIVE_TALENT_OVERVIEW" })
  │    │    │
  │    │    └─→ GET /api/snapshots?role=EXCLUSIVE&dashboard=EXCLUSIVE_TALENT_OVERVIEW
  │    │        │
  │    │        ├─→ snapshotRegistry.getTalentSnapshots()
  │    │        │    │
  │    │        │    └─→ Filter snapshots where:
  │    │        │         ✓ roleVisibility includes "EXCLUSIVE"
  │    │        │         ✓ dashboardTypes includes "EXCLUSIVE_TALENT_OVERVIEW"
  │    │        │
  │    │        ├─→ resolveSnapshotsData(snapshots, userId)
  │    │        │    │
  │    │        │    ├─→ For each snapshot:
  │    │        │    │    ├─ TOTAL_REVENUE → resolver["revenue.total"]()
  │    │        │    │    │   └─ Query RevenueEvent sum across all sources
  │    │        │    │    ├─ DEAL_REVENUE → resolver["revenue.deals"]()
  │    │        │    │    │   └─ Query Deal fees for completed deals
  │    │        │    │    ├─ COMMERCE_REVENUE → resolver["revenue.commerce"]()
  │    │        │    │    │   └─ Query RevenueEvent for SHOPIFY/TIKTOK/LTK/AMAZON/CUSTOM
  │    │        │    │    └─ REVENUE_GOAL_PROGRESS → resolver["revenue.goal_progress"]()
  │    │        │    │        └─ Calculate goal completion %
  │    │        │    │
  │    │        │    └─→ Return: SnapshotData[]
  │    │        │
  │    │        └─→ Return: {
  │    │             snapshots: [
  │    │               { id: "TOTAL_REVENUE", value: 45000, ... },
  │    │               { id: "DEAL_REVENUE", value: 30000, ... },
  │    │               { id: "COMMERCE_REVENUE", value: 15000, ... },
  │    │               { id: "REVENUE_GOAL_PROGRESS", value: 75, ... },
  │    │             ]
  │    │           }
  │    │
  │    └─→ data.snapshots = { ... }
  │
  └─→ Render dynamic snapshot cards:
       ├─ Total Revenue: £45,000
       ├─ Deal Revenue: £30,000
       ├─ Commerce Revenue: £15,000
       └─ Goal Progress: 75%
```

---

## PART 6 — SNAPSHOT REGISTRY AUDIT TABLE

### Registry Configuration for Revenue Snapshots

| Snapshot ID | Key | Title | Type | Data Source | Resolver Line | Role Visibility | Dashboard Type | Default Enabled | Order |
|------------|-----|-------|------|-------------|--------------|-----------------|----------------|-----------------|-------|
| TOTAL_REVENUE | total_revenue | Total Revenue | currency | revenue.total | 215 | EXCLUSIVE | EXCLUSIVE_TALENT_OVERVIEW | Yes | 1 |
| DEAL_REVENUE | deal_revenue | Deal Revenue | currency | revenue.deals | 252 | EXCLUSIVE | EXCLUSIVE_TALENT_OVERVIEW | Yes | 2 |
| COMMERCE_REVENUE | commerce_revenue | Commerce Revenue | currency | revenue.commerce | 286 | EXCLUSIVE | EXCLUSIVE_TALENT_OVERVIEW | Yes | 3 |
| REVENUE_GOAL_PROGRESS | revenue_goal_progress | Goal Progress | percentage | revenue.goal_progress | 322 | EXCLUSIVE | EXCLUSIVE_TALENT_OVERVIEW | Yes | 4 |

**All registry entries located in:** `apps/api/src/services/snapshotRegistry.ts` (lines 259-310)

**All resolvers located in:** `apps/api/src/services/snapshotResolver.ts` (lines 215-350+)

---

## PART 7 — INTEGRATION AUDIT SUMMARY

### ✅ What IS Wired

| Component | Status | Details |
|-----------|--------|---------|
| ExclusiveOverviewEnhanced page | ✅ Exists | Located in proper route, role-gated |
| ExclusiveOverviewPage export | ✅ Wired | Routes to overview page correctly |
| RevenueCard component | ✅ Rendered | Shows deal-based revenue data |
| /exclusive/revenue/summary endpoint | ✅ Functional | Returns payout-based revenue |
| TalentRevenueDashboard component | ✅ Routed | Available at /admin/view/exclusive/commerce |
| Commerce route | ✅ Wired | Path added to navigation and App.jsx |
| Snapshot registry definitions | ✅ Defined | 4 revenue snapshots configured |
| Snapshot resolvers | ✅ Implemented | All 4 revenue resolvers coded |

### ❌ What is NOT Wired

| Component | Status | Issue |
|-----------|--------|-------|
| Snapshot system in overview | ❌ Not used | No snapshot hook or API calls |
| Snapshot data fetching | ❌ Not used | Using manual API instead of snapshot resolver |
| Commerce revenue in snapshot | ❌ Not displayed | Snapshot data source exists but unused |
| Dynamic snapshot rendering | ❌ Not implemented | Hardcoded RevenueCard instead of dynamic list |
| Snapshot customization UI | ❌ Not built | No way to show/hide/reorder snapshots |
| E-commerce metrics on overview | ❌ Not visible | COMMERCE_REVENUE snapshot not rendered |

### ⏳ Partially Working

| Component | Status | Details |
|-----------|--------|---------|
| Database tables (RevenueSource, RevenueEvent) | ⏳ Created (migration run) | Tables exist in PostgreSQL |
| Snapshot architecture | ⏳ Built, unused | Infrastructure complete, not integrated into pages |
| Commerce feature | ⏳ Built, less discoverable | Available but only visible if admin clicks "Commerce" tab |

---

## PART 8 — FINDINGS & ASSESSMENT

### Key Findings

**Finding #1:** ✅ Overview page correctly identified and routed  
- File: `ExclusiveOverviewEnhanced.jsx`
- Route: `/admin/view/exclusive` (index)
- Component chain: App → ExclusiveTalentDashboardLayout → Outlet → ExclusiveOverviewPage → ExclusiveOverviewEnhanced

**Finding #2:** ❌ Snapshot registry NOT integrated in overview page  
- Snapshots defined in registry, resolvers implemented
- But overview page uses manual API call `/exclusive/revenue/summary` instead
- No snapshot data fetching or rendering in ExclusiveOverviewEnhanced

**Finding #3:** ❌ Commerce revenue snapshots NOT displayed in overview  
- TOTAL_REVENUE snapshot exists (not used)
- COMMERCE_REVENUE snapshot exists (not used)
- REVENUE_GOAL_PROGRESS snapshot exists (not used)
- Only manual RevenueCard displays payout-based revenue

**Finding #4:** ❌ Revenue snapshot keys don't match usage  
- Registry defines: TOTAL_REVENUE, DEAL_REVENUE, COMMERCE_REVENUE, REVENUE_GOAL_PROGRESS
- Overview renders: RevenueCard with hardcoded fields (earningsFormatted, potentialFormatted, trend)
- No snapshot ID matching

**Finding #5:** ✅ Commerce feature IS wired to UI  
- Available at `/admin/view/exclusive/commerce`
- TalentRevenueDashboard component routed correctly
- "Commerce" tab present in navigation

**Finding #6:** ❌ Commerce is hidden from default overview view  
- Requires clicking "Commerce" tab to access
- Overview page doesn't show commerce revenue metrics
- Not integrated into snapshot card system for visibility

---

## PART 9 — ARCHITECTURE COMPARISON

### Current Architecture (Manual API)
```
Page Component
  └─ useExclusiveTalentData hook
      └─ Manual apiFetch("/exclusive/revenue/summary")
          └─ Backend calculates payouts
              └─ Returns formatted object
                  └─ Hardcoded into RevenueCard
```

### Intended Architecture (Snapshot-based)
```
Page Component
  └─ useSnapshots hook
      └─ Fetches from snapshot resolver
          └─ snapshotRegistry.getTalentSnapshots()
              └─ snapshotResolver.resolveSnapshotsData()
                  └─ Returns array of SnapshotData[]
                      └─ Dynamically renders snapshot cards
```

### Why Difference Matters
- **Manual:** Hardcoded, not flexible, can't customize or add new metrics easily
- **Snapshot:** Extensible, user-customizable, centralized metric definitions

---

## PART 10 — RECOMMENDATIONS

### To Fully Integrate Snapshot System:

**Phase 1: Create Snapshot Hook**
```typescript
// apps/web/src/hooks/useSnapshots.ts
export function useSnapshots(role: string, dashboard: string) {
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(`/api/snapshots?role=${role}&dashboard=${dashboard}`)
      .then(res => res.json())
      .then(data => setSnapshots(data.snapshots))
      .finally(() => setLoading(false));
  }, [role, dashboard]);

  return { snapshots, loading };
}
```

**Phase 2: Create Snapshot Endpoint**
```typescript
// apps/api/src/routes/snapshots.ts
router.get("/api/snapshots", async (req, res) => {
  const { role, dashboard } = req.query;
  const snapshotDefs = snapshotRegistry.getSnapshotsFor(role, dashboard);
  const resolvedData = await snapshotResolver.resolveSnapshotsData(snapshotDefs, userId);
  res.json({ snapshots: resolvedData });
});
```

**Phase 3: Update Overview Page**
```typescript
// apps/web/src/pages/ExclusiveOverviewEnhanced.jsx
const { snapshots, loading } = useSnapshots("EXCLUSIVE", "EXCLUSIVE_TALENT_OVERVIEW");

// In render:
{snapshots.map(snapshot => (
  <SnapshotCard key={snapshot.id} snapshot={snapshot} />
))}
```

---

## CONCLUSION

### Current State:
- ✅ **Snapshot infrastructure built** (registry + resolvers)
- ✅ **Commerce feature implemented** (components + routes)
- ✅ **Database migration applied** (tables exist)
- ❌ **Snapshots NOT integrated** into overview page
- ❌ **Commerce revenue NOT visible** in overview
- ❌ **Manual data fetching** instead of snapshot resolvers

### Wiring Status:
The Exclusive Talent overview page is:
- ✅ Correctly routed and role-gated
- ❌ NOT using snapshot registry system
- ❌ NOT displaying commerce revenue metrics
- ❌ NOT integrated with commerce feature on overview

### Impact:
Admins viewing an Exclusive Talent's overview will see:
- ✅ Payout-based revenue (RevenueCard)
- ❌ NOT commerce revenue (Shopify, TikTok, etc.)
- ❌ NOT revenue goals
- ❌ NOT snapshot-based metrics

To see commerce data, they must navigate to the "Commerce" tab separately.

---

**Audit Completed:** January 9, 2026  
**Status:** Ready for implementation or further investigation
