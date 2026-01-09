# Exclusive Overview Architecture Diagram & Wiring Map

**Date:** January 9, 2026  
**Purpose:** Visual representation of current wiring vs intended wiring

---

## DIAGRAM 1: Current Architecture (Manual API)

```
┌─────────────────────────────────────────────────────────────────┐
│                    ADMIN BROWSER                                 │
│                  /admin/view/exclusive                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              ROUTING LAYER (App.jsx)                             │
│  Route: /admin/view/exclusive                                   │
│  ProtectedRoute: [ADMIN, SUPERADMIN]                            │
│  Layout: ExclusiveTalentDashboardLayout                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│          ExclusiveTalentDashboardLayout (outer shell)            │
│  • Navigation tabs (Overview, Profile, Socials, Calendar...)    │
│  • Commerce tab ✅ VISIBLE                                      │
│  • <Outlet context={{session, basePath}} />                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              ExclusiveOverviewPage (exports component)           │
│  Gets: session, basePath from useOutletContext()                │
│  Renders: <ExclusiveOverviewEnhanced />                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│         ExclusiveOverviewEnhanced (main page, 871 lines)         │
│  ┌─────────────────────────────────────────────────────────────┐
│  │ Hook: useExclusiveTalentData(session) [Line 44]             │
│  │                                                              │
│  │ Data = {                                                    │
│  │   projects: [],                                            │
│  │   tasks: [],                                               │
│  │   events: [],                                              │
│  │   revenue: null,  ← MANUALLY FETCHED                       │
│  │   goals: null,                                             │
│  │   ...                                                       │
│  │ }                                                           │
│  └─────────────────────────────────────────────────────────────┘
│              │
│              ▼
│  ┌─────────────────────────────────────────────────────────────┐
│  │ Inside useExclusiveTalentData() Hook                        │
│  │ Line 65: apiFetch("/exclusive/revenue/summary", ...)        │
│  │                                                              │
│  │ response.json() → {                                         │
│  │   totalEarned: "£100k",  ← Formatted from Payout model    │
│  │   potentialRevenue: "£50k",                                 │
│  │   trend: "up",                                              │
│  │   agentMessage: "Managed by your agent..."                  │
│  │ }                                                            │
│  └─────────────────────────────────────────────────────────────┘
│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│               RENDER SWITCH (Line 287-368)                       │
│  sectionPriority.map(section => {                              │
│    switch (section.id) {                                        │
│      case "revenue":                                            │
│        return <RevenueCard revenue={data.revenue} />  ✅ HERE  │
│      ...                                                        │
│    }                                                            │
│  })                                                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              RevenueCard Component (renders)                     │
│  File: ExclusiveOverviewComponents.jsx:294                      │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Revenue overview                                          │  │
│  │ Confidence, not accounting                               │  │
│  ├───────────┬───────────┬────────────────────────────────┤  │
│  │ Earnings  │ Potential │ Trend                          │  │
│  │ to date   │ revenue   │ (up/flat/down)                 │  │
│  │ £100k     │ £50k      │ Up ↑                           │  │
│  └───────────┴───────────┴────────────────────────────────┘  │
│                                                                  │
│  Data from: /exclusive/revenue/summary (Payout model)          │
│  ❌ NOT: Commerce/Shopify/TikTok data                          │
│  ❌ NOT: Revenue snapshots                                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              COMMERCE FEATURE (Hidden)                           │
│  Path: /admin/view/exclusive/commerce                           │
│  Component: TalentRevenueDashboard (531 lines) ✅ WIRED         │
│  Requires: Click "Commerce" tab                                 │
│  Shows: Shopify, TikTok, LTK, Amazon stores ✅ AVAILABLE        │
│  But: NOT on overview page                                      │
└─────────────────────────────────────────────────────────────────┘

CURRENT FLOW SUMMARY:
┌────────────────────────────────────────────────────────────────┐
│ Page → Hook (useExclusiveTalentData) → Manual API call →       │
│ /exclusive/revenue/summary → Payout calculation → RevenueCard  │
│ PROBLEM: Disconnected from snapshot system                      │
└────────────────────────────────────────────────────────────────┘
```

---

## DIAGRAM 2: Snapshot System (Defined but Unused)

```
┌────────────────────────────────────────────────────────────────┐
│             SNAPSHOT REGISTRY (snapshotRegistry.ts)             │
│                      (393 lines total)                          │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ TOTAL_REVENUE                                            │  │
│  │ • ID: "TOTAL_REVENUE"                                    │  │
│  │ • Data source: "revenue.total"                           │  │
│  │ • Role visibility: ["EXCLUSIVE"]                         │  │
│  │ • Dashboard type: ["EXCLUSIVE_TALENT_OVERVIEW"] ✅       │  │
│  │ • Resolver: Line 215 in snapshotResolver.ts              │  │
│  │ • Default enabled: true, Order: 1                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ DEAL_REVENUE                                             │  │
│  │ • ID: "DEAL_REVENUE"                                     │  │
│  │ • Data source: "revenue.deals"                           │  │
│  │ • Resolver: Line 252 in snapshotResolver.ts              │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ COMMERCE_REVENUE ⭐ KEY FOR COMMERCE FEATURE              │  │
│  │ • ID: "COMMERCE_REVENUE"                                 │  │
│  │ • Data source: "revenue.commerce"                        │  │
│  │ • Description: "Revenue from Shopify, TikTok, LTK,       │  │
│  │   Amazon"                                                │  │
│  │ • Resolver: Line 286 in snapshotResolver.ts              │  │
│  │ • ❌ NOT USED by ExclusiveOverviewEnhanced               │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ REVENUE_GOAL_PROGRESS                                    │  │
│  │ • ID: "REVENUE_GOAL_PROGRESS"                            │  │
│  │ • Type: percentage                                       │  │
│  │ • Data source: "revenue.goal_progress"                   │  │
│  │ • Resolver: Line 322 in snapshotResolver.ts              │  │
│  │ • ❌ NOT USED by ExclusiveOverviewEnhanced               │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│           SNAPSHOT RESOLVERS (snapshotResolver.ts)              │
│                      (458 lines total)                          │
│                                                                  │
│  const dataResolvers = {                                        │
│    "revenue.total": async (userId) => {                         │
│      // Query: RevenueEvent.sum(netAmount) for all sources     │
│      // Returns: number (total revenue)                         │
│    },                                                           │
│    "revenue.deals": async (userId) => {                         │
│      // Query: Deal.fee for completed deals                    │
│      // Returns: number (deal revenue)                          │
│    },                                                           │
│    "revenue.commerce": async (userId) => {  ⭐ COMMERCE KEY     │
│      // Query: RevenueEvent where platform in                  │
│      //   [SHOPIFY, TIKTOK_SHOP, LTK, AMAZON, CUSTOM]          │
│      // Returns: number (commerce revenue from e-commerce)     │
│    },                                                           │
│    "revenue.goal_progress": async (userId) => {                │
│      // Query: RevenueGoal and calculate completion %           │
│      // Returns: number (0-100 percentage)                      │
│    }                                                            │
│  }                                                              │
│                                                                  │
│  export async function resolveSnapshotsData(                    │
│    snapshots: SnapshotDefinition[],                             │
│    userId: string                                              │
│  ): Promise<SnapshotData[]> {                                   │
│    // Calls each resolver in parallel                           │
│    // Returns array of resolved snapshot data                   │
│    // ❌ NEVER CALLED by ExclusiveOverviewEnhanced              │
│  }                                                              │
│                                                                  │
└────────────────────────────────────────────────────────────────┘

SNAPSHOT SYSTEM STATUS:
┌────────────────────────────────────────────────────────────────┐
│ ✅ Registry: Defined, complete, 4 revenue snapshots             │
│ ✅ Resolvers: Implemented, all 4 have working logic             │
│ ✅ Database: Tables exist (RevenueSource, RevenueEvent)         │
│ ❌ Integration: NOT called by overview page                     │
│ ❌ Discovery: No way to fetch snapshots from frontend           │
└────────────────────────────────────────────────────────────────┘
```

---

## DIAGRAM 3: Intended Architecture (Snapshot-Based)

```
┌────────────────────────────────────────────────────────────────┐
│              ExclusiveOverviewEnhanced (IMPROVED)               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Hook: useSnapshots({                                     │  │
│  │   role: "EXCLUSIVE",                                     │  │
│  │   dashboard: "EXCLUSIVE_TALENT_OVERVIEW"                 │  │
│  │ })  ← NEW HOOK (doesn't exist yet)                       │  │
│  │                                                          │  │
│  │ Returns: {                                              │  │
│  │   snapshots: SnapshotData[],                            │  │
│  │   loading: boolean                                      │  │
│  │ }                                                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│              │                                                   │
│              ▼                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ API Call: GET /api/snapshots?role=EXCLUSIVE&            │  │
│  │           dashboard=EXCLUSIVE_TALENT_OVERVIEW            │  │
│  │           ← NEW ENDPOINT (doesn't exist yet)             │  │
│  │                                                          │  │
│  │ Returns: {                                              │  │
│  │   snapshots: [                                          │  │
│  │     {                                                   │  │
│  │       id: "TOTAL_REVENUE",                              │  │
│  │       title: "Total Revenue",                           │  │
│  │       value: 145000,  (£145k)                           │  │
│  │       metricType: "currency",                           │  │
│  │       icon: "TrendingUp"                                │  │
│  │     },                                                  │  │
│  │     {                                                   │  │
│  │       id: "COMMERCE_REVENUE",  ⭐ E-COMMERCE SHOWN      │  │
│  │       title: "Commerce Revenue",                        │  │
│  │       value: 25000,  (£25k from Shopify/TikTok)        │  │
│  │       metricType: "currency",                           │  │
│  │       icon: "ShoppingCart"                              │  │
│  │     },                                                  │  │
│  │     {                                                   │  │
│  │       id: "DEAL_REVENUE",                               │  │
│  │       title: "Deal Revenue",                            │  │
│  │       value: 80000,  (£80k from sponsored deals)        │  │
│  │       metricType: "currency"                            │  │
│  │     },                                                  │  │
│  │     {                                                   │  │
│  │       id: "REVENUE_GOAL_PROGRESS",                      │  │
│  │       title: "Goal Progress",                           │  │
│  │       value: 72,  (72% of goal)                         │  │
│  │       metricType: "percentage"                          │  │
│  │     }                                                   │  │
│  │   ]                                                     │  │
│  │ }                                                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│              │                                                   │
│              ▼                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Render Dynamic Snapshot Cards:                           │  │
│  │ {snapshots.map(snapshot => (                             │  │
│  │   <SnapshotCard key={snapshot.id} snapshot={snapshot} />│  │
│  │ ))}                                                      │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                    DISPLAYED SNAPSHOT CARDS                     │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ Total        │  │ Commerce     │  │ Deal         │           │
│  │ Revenue      │  │ Revenue ⭐   │  │ Revenue      │           │
│  │ £145,000     │  │ £25,000      │  │ £80,000      │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│                                                                  │
│  ┌──────────────┐                                               │
│  │ Revenue Goal │                                               │
│  │ Progress     │                                               │
│  │ 72%          │                                               │
│  └──────────────┘                                               │
│                                                                  │
│  ✅ NOW SHOWS E-COMMERCE DATA                                  │
│  ✅ NOW SHOWS REVENUE GOALS                                    │
│  ✅ NOW INTEGRATED WITH SNAPSHOT SYSTEM                        │
│  ✅ EASILY CUSTOMIZABLE (add/remove snapshots)                 │
└────────────────────────────────────────────────────────────────┘

INTENDED FLOW SUMMARY:
┌────────────────────────────────────────────────────────────────┐
│ Page → useSnapshots hook → GET /api/snapshots →                │
│ snapshotRegistry.getSnapshotsFor(role, dashboard) →            │
│ snapshotResolver.resolveSnapshotsData(snapshots, userId) →     │
│ returns SnapshotData[] → Dynamic snapshot card rendering       │
│ BENEFIT: Extensible, customizable, unified                     │
└────────────────────────────────────────────────────────────────┘
```

---

## DIAGRAM 4: Commerce Feature Wiring Map

```
┌──────────────────────────────────────────────────────────────────┐
│                    COMMERCE FEATURE STATE                         │
└──────────────────────────────────────────────────────────────────┘

                     EXCLUSIVE DASHBOARD NAV
                    (ExclusiveTalentDashboard.jsx)
                              │
                   ┌──────────┼──────────┐
                   │          │          │
                   ▼          ▼          ▼
              Overview    Profile    Commerce ✅
              (current)            (separate tab)
                   │                    │
                   │                    ▼
                   │          ┌─────────────────────┐
                   │          │ TalentRevenueDashboard
                   │          │ • Add stores
                   │          │ • View transactions
                   │          │ • Set goals
                   │          │ (531 lines)
                   │          │ ✅ FULLY WIRED
                   │          │ ✅ FUNCTIONAL
                   │          │ ❌ HIDDEN (tab-only)
                   │          └─────────────────────┘
                   │
                   ▼
        ┌────────────────────────────┐
        │ ExclusiveOverviewEnhanced   │
        │ (Main overview page)        │
        │                             │
        │ ┌──────────────────────┐   │
        │ │ RevenueCard          │   │
        │ │ • Earnings to date   │   │
        │ │ • Potential revenue  │   │
        │ │ • Trend              │   │
        │ │                      │   │
        │ │ ❌ NO Commerce data  │   │
        │ │ ❌ NO Snapshots      │   │
        │ └──────────────────────┘   │
        │                             │
        └────────────────────────────┘

COMMERCE FEATURE VISIBILITY:
┌────────────────────────────────────────────────────────────────┐
│ ✅ Feature is BUILT:                                            │
│    • Database tables (RevenueSource, RevenueEvent, RevenueGoal) │
│    • React component (TalentRevenueDashboard)                   │
│    • API endpoints (POST/GET/DELETE for sources & events)       │
│    • Snapshot definitions (COMMERCE_REVENUE, TOTAL_REVENUE)     │
│    • Snapshot resolvers (revenue.commerce)                      │
│                                                                  │
│ ✅ Feature is WIRED to UI:                                      │
│    • Route: /admin/view/exclusive/commerce                      │
│    • Navigation: "Commerce" tab in dashboard                    │
│    • Component: TalentRevenueDashboard exported correctly        │
│                                                                  │
│ ❌ Feature is HIDDEN from overview:                             │
│    • Not shown on default overview page                         │
│    • Requires clicking "Commerce" tab to access                 │
│    • Revenue card doesn't show commerce data                    │
│    • Snapshot system not integrated into overview               │
│                                                                  │
│ BOTTOM LINE:                                                    │
│ Commerce feature exists but is a "separate app" within the     │
│ dashboard. To see it, admin must navigate to the Commerce tab. │
│ It's not integrated into the overview snapshot system.          │
└────────────────────────────────────────────────────────────────┘
```

---

## DIAGRAM 5: Data Source Comparison

```
┌─────────────────────────────────────────────────────────────┐
│            CURRENT: What Overview Shows                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  RevenueCard (data from /exclusive/revenue/summary)         │
│  ├─ Data source: Payout model                              │
│  ├─ Calculation: Sum completed payouts                     │
│  ├─ Time period: YTD (filtered by date)                    │
│  ├─ Fields:                                                │
│  │  • totalEarned (from Payout.amount, status=completed)   │
│  │  • potentialRevenue (from Payout, status=pending)       │
│  │  • trend (manual calculation: up/flat/down)             │
│  └─ Shows: ✅ Deal payouts, ❌ Commerce revenue            │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│        SNAPSHOT: What Could Be Shown (but isn't)             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  TOTAL_REVENUE Snapshot (data from revenue.total resolver)  │
│  ├─ Data source: RevenueEvent model                        │
│  ├─ Calculation: Sum netAmount across all sources           │
│  ├─ Platforms: SHOPIFY, TIKTOK_SHOP, LTK, AMAZON, CUSTOM  │
│  ├─ Fields:                                                │
│  │  • value (sum of RevenueEvent.netAmount)                │
│  │  • metricType: "currency"                               │
│  │  • icon: "TrendingUp"                                   │
│  └─ Shows: ✅ All revenue (deals + commerce)               │
│                                                              │
│  COMMERCE_REVENUE Snapshot                                 │
│  ├─ Data source: RevenueEvent filtered by platform         │
│  ├─ Platforms: [SHOPIFY, TIKTOK_SHOP, LTK, AMAZON, CUSTOM]│
│  ├─ Calculation: Sum netAmount for e-commerce only         │
│  ├─ Fields:                                                │
│  │  • value (commerce-only revenue)                        │
│  │  • metricType: "currency"                               │
│  │  • icon: "ShoppingCart"                                 │
│  └─ Shows: ✅ E-commerce revenue breakdown                 │
│                                                              │
│  DEAL_REVENUE Snapshot                                     │
│  ├─ Data source: Deal model (completed deals)              │
│  ├─ Calculation: Sum Deal.fee                              │
│  ├─ Fields: value (deal-only revenue)                      │
│  └─ Shows: ✅ Sponsored deal revenue                       │
│                                                              │
│  REVENUE_GOAL_PROGRESS Snapshot                            │
│  ├─ Data source: RevenueGoal + RevenueEvent               │
│  ├─ Calculation: (current revenue / target) * 100          │
│  ├─ Fields: value (percentage 0-100)                       │
│  └─ Shows: ✅ Goal completion percentage                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘

KEY DIFFERENCE:
┌─────────────────────────────────────────────────────────────┐
│ Current (Payout-based):                                      │
│ • Shows only deal/agent revenue (from Payout model)         │
│ • Doesn't show e-commerce platform revenue                  │
│ • Manual hardcoding                                         │
│                                                              │
│ Snapshot-based (All revenue):                               │
│ • Shows deal revenue (from Deal model)                      │
│ • Shows commerce revenue (from RevenueEvent model)          │
│ • Shows goal progress                                       │
│ • Extensible and customizable                               │
└─────────────────────────────────────────────────────────────┘
```

---

## CONCLUSION

**Current State:** Disconnected systems
- Overview page uses manual API (Payout-based)
- Snapshot system is built but unused
- Commerce feature is hidden in separate tab

**Gap:** No bridge between overview page and snapshot system

**Fix:** Create useSnapshots hook + integrate into overview

**Benefit:** Commerce revenue becomes visible + system becomes extensible
