# Campaigns / Activations (CRM) — Frontend-First Notes

This implementation adds **Campaigns / Activations** as a **top-level CRM entity** in the admin Control Room, using **frontend-only state** (localStorage). No backend schemas, APIs, or permissions are introduced.

## Where It Lives

- Admin navigation: `Control Room → Campaigns`
- Route: `GET /admin/campaigns`
- Embedded surfaces:
  - Brand detail drawer (Admin Brands)
  - Deal drawer (Admin Outreach)

## Frontend UI Contract (Current)

Campaign object fields (saved locally):

- Core
  - `campaignName` (required)
  - `brandId` (required)
  - `campaignType` (enum)
  - `status` (enum)
  - `startDate`
  - `endDate` (optional)
  - `internalSummary`
- Context & scope
  - `goals`
  - `keyNotes` (internal-only)
- Metadata
  - `owner`
  - `createdAt`
  - `updatedAt`
  - `lastActivityAt` (placeholder, derived later)
- Relationship placeholders (design-only)
  - `linkedDealIds`, `linkedTalentIds`, `linkedTaskIds`, `linkedOutreachIds`, `linkedEventIds`
  - `activity` feed entries (e.g. “Campaign created”, “Deal added …”)

Storage key:

- `break_admin_crm_campaigns_v1`

## Relationship Behavior (Design)

The UI is designed to support:

- **One Brand → many Campaigns**
  - Campaigns are filtered by `brandId` inside Brand detail.
- **One Campaign → many** Deals / Talent / Tasks / Outreach / Events
  - Campaign detail shows counts + “View / Add” placeholders for each linked entity.
- **Deals can exist with or without a Campaign**
  - Deal drawer includes a campaign selector.
  - Linking a deal updates `deal.campaignId` (local-only) and adds the deal ID to `campaign.linkedDealIds`.

Notes on future linking targets:

- **Tasks**: intended to optionally carry `campaignId` (or be linked through a join model). Campaign detail already has a Tasks section and “Task bundles” placeholder.
- **Outreach records**: intended to optionally carry `campaignId` for continuity from relationship touchpoints into campaign moments.
- **Events**: intended to link via `campaignId` and contribute “key moments” to the Timeline section.
- **Talent**: intended to link via `campaignId` for multi-talent activations (surface later in Talent detail).

## UX Guardrails

- Campaigns feel like **moments**, not projects:
  - Lightweight Timeline (range + placeholder “key moments”)
  - Readable Activity feed (no noisy dashboards)
- Avoid jargon overload:
  - Plain-language campaign types (Influencer, Seeding, Event, PR moment, etc.)
- Outcome-aware without performance pressure:
  - Subtle “calm hints” (dismissible), not analytics or ROI reporting
- Editable and flexible:
  - Core fields are editable in the drawer
  - Linking actions are optional (deals can stay standalone)

## What’s Explicitly Not Included

- Backend persistence, APIs, or permissions
- Performance analytics, reporting, or ROI
- Approval workflows
- Full event system / Gantt logic

