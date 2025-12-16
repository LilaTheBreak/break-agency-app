# Stabilization Phase - Remaining Mock Data

## Overview
This document tracks mock data that was **NOT** addressed during the initial stabilization phase. These items remain in the codebase and should be removed, gated, or clearly labeled in future iterations.

## Completed Removals ✅

### Phase 1: Campaign Mock Data
- **FALLBACK_CAMPAIGNS** - Removed from all dashboards (AdminDashboard, CreatorDashboard, BrandDashboard, ExclusiveTalentDashboard)
- **Status**: Fully removed, replaced with honest empty states

### Phase 2: Revenue & Metrics Mock Data
- **CreatorDashboard** - Removed fake revenue targets (£120,000), audience growth (8.2%), deal counts (6), and growth trend charts
- **BrandDashboard** - Removed fake analytics metrics (reach, engagement rate, revenue, conversion lift), signals, and pod efficiency tables
- **Status**: Fully removed, replaced with "Metrics not yet available" empty states

### Phase 3: Feature Gating
- **ProtectedRoute** - Added onboarding approval gating
- **AwaitingApprovalPage** - Created holding screen for unapproved users
- **Status**: Complete, non-admin users with `onboarding_status !== 'approved'` now see approval screen

### Phase 4: Health Endpoint
- **GET /health** - Created endpoint with database connectivity check
- **Status**: Complete, returns JSON with status, timestamp, database state, uptime

---

## Remaining Mock Data (NOT addressed)

### 1. **Opportunities & Deals**

#### CreatorDashboard
- **CREATOR_OPPORTUNITY_PIPELINE** (lines ~70-180)
  - 6 fake opportunities with brands, payouts, deliverables, status
  - Examples: "Luxury Travel Drop" (£8,000), "AI Banking Launch" (£5,200)
  - **Action needed**: Replace with real opportunity API or remove entirely
  - **Current state**: Empty state added, but CREATOR_OPPORTUNITY_PIPELINE constant still exists (not imported anymore)

#### BrandDashboard
- **OPPORTUNITY_PIPELINE** (lines ~299-340)
  - Fake opportunity stages with creators, payouts, statuses
  - **Action needed**: Remove mock opportunity data
  - **Current state**: Still in codebase, likely still rendering

### 2. **Creator Profiles & Roster**

#### BrandDashboard
- **CREATOR_ROSTER** (lines ~14-19)
  - Hardcoded list of creator names
  - **Action needed**: Replace with real creator data from API
  - **Current state**: Likely still being used in brand overview

#### ExclusiveTalentDashboard
- **TALENT_SAMPLE_SOCIALS** (unknown lines)
  - Fake social media profiles with follower counts
  - **Action needed**: Remove or replace with real data
  - **Current state**: Not confirmed if still in use

### 3. **Submissions & Deliverables**

#### CreatorDashboard
- **SUBMISSION_PAYLOADS** (lines ~141-225)
  - 4 fake content submissions with files, revisions, captions, usage rights
  - Examples: "Luxury Travel Drop" Instagram Reel, "AI Banking Walkthrough" TikTok
  - **Action needed**: Remove mock submission data
  - **Current state**: Empty state added, but SUBMISSION_PAYLOADS constant still exists (not imported anymore)

- **SUBMISSION_TABS** (line ~139)
  - Array: ["Drafts", "Revisions requested", "Awaiting approval", "Scheduled", "Approved", "Usage log"]
  - **Action needed**: Verify if this should be config or removed
  - **Current state**: Likely still being referenced

### 4. **Campaign Reports**

#### BrandDashboard
- **CAMPAIGN_REPORTS** (lines ~20-25)
  - Mock campaign report data
  - **Action needed**: Remove or replace with real analytics
  - **Current state**: Still in codebase, usage unknown

### 5. **AI Automations**

#### BrandDashboard
- **AI_AUTOMATIONS** (lines ~45-77)
  - Extensive fake AI features:
    - "Next steps" suggestions
    - "Risk alerts"
    - "Recommendations"
    - "Contract summaries"
    - "Brief generation"
    - "Suggested pricing"
    - "Content scoring"
  - **Action needed**: These features don't exist - remove entirely or gate with "Coming soon" labels
  - **Current state**: Likely still displaying as if functional

### 6. **Social Media Data**

#### BrandDashboard
- **BRAND_SOCIALS** (lines ~293-298)
  - Fake social media accounts with follower counts
  - **Action needed**: Replace with real social data or remove
  - **Current state**: Still in codebase

### 7. **Creator Match Pool**

#### BrandDashboard
- **CREATOR_MATCH_POOL** (lines ~341-386)
  - Extensive fake creator profiles with:
    - Names, avatars, follower counts
    - Verticals, performance ratings
    - Revenue projections (30-day, 90-day)
    - Response rates, booking availability
  - **Action needed**: This is a major fake feature - remove or gate entirely
  - **Current state**: Still in codebase, likely rendering

### 8. **Contract Data**

#### Multiple Dashboards
- Mock contract data exists across CreatorDashboard, BrandDashboard
- **Action needed**: Replace with real contract API or remove
- **Current state**: Unknown - needs investigation

### 9. **Finance Data**

#### BrandDashboard
- Revenue fields in creator profiles: `revenue30`, `revenue90`
- **Action needed**: Remove fake financial projections
- **Current state**: Present in CREATOR_MATCH_POOL data

### 10. **Stage Actions & Workflows**

#### CreatorDashboard
- **OPPORTUNITY_STAGE_FLOW** (lines ~52-58)
- **STAGE_ACTIONS** (lines ~60-67)
  - Fake workflow actions for opportunities
  - **Action needed**: Remove or verify if this is configuration vs. mock data
  - **Current state**: Still in codebase

---

## Recommendations for Next Phase

### Priority 1: High Visibility Fakes
1. **AI_AUTOMATIONS** - Remove immediately, these features don't exist
2. **CREATOR_MATCH_POOL** - Major fake feature with financial data
3. **OPPORTUNITY_PIPELINE** - Shows deals that don't exist

### Priority 2: Creator Fake Data
4. **CREATOR_ROSTER** - Replace with real roster API
5. **BRAND_SOCIALS** - Replace with real social integrations

### Priority 3: Workflow Mock Data
6. Review all `STAGE_ACTIONS` and `OPPORTUNITY_STAGE_FLOW` - determine if config or mock

### Priority 4: Unused Constants
7. **SUBMISSION_PAYLOADS** - Already removed from import, delete constant entirely
8. **CREATOR_OPPORTUNITY_PIPELINE** - Already removed from import, delete constant entirely

---

## Implementation Pattern

For all remaining mock data, follow this pattern:

### If Feature Doesn't Exist:
```jsx
// REMOVE the entire section and replace with:
<div className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-8 text-center">
  <p className="text-sm text-brand-black/60">Feature coming soon</p>
  <p className="mt-2 text-xs text-brand-black/40">[Feature name] is under development</p>
</div>
```

### If Feature Exists But Data is Fake:
```jsx
// REPLACE with real API call, or if API doesn't exist yet:
{data.length === 0 ? (
  <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-8 text-center">
    <p className="text-sm text-brand-black/60">No [items] yet</p>
    <p className="mt-2 text-xs text-brand-black/40">[Items] will appear once available</p>
  </div>
) : (
  data.map(...)
)}
```

### If It's Configuration (Not Mock Data):
- Move to a dedicated config file
- Add TypeScript types
- Add comments explaining purpose

---

## File Locations for Reference

- **CreatorDashboard**: `/apps/web/src/pages/CreatorDashboard.jsx`
- **BrandDashboard**: `/apps/web/src/pages/BrandDashboard.jsx`
- **ExclusiveTalentDashboard**: `/apps/web/src/pages/ExclusiveTalentDashboard.jsx`
- **AdminDashboard**: `/apps/web/src/pages/AdminDashboard.jsx`

---

## Status Summary

**Completed**: 5/6 tasks
- ✅ Remove FALLBACK_CAMPAIGNS
- ✅ Remove fake revenue & metrics
- ✅ Add onboarding approval gating
- ✅ Create awaiting approval screen
- ✅ Create /health endpoint
- 📝 Document remaining mock data (this file)

**Remaining Work**: ~15-20 hours to remove all identified mock data
