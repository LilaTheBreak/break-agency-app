# Deals (CRM) — Frontend-First Notes

This adds **Deals** as a **top-level CRM entity** (admin) using **frontend-only state** (localStorage). No contract uploads, invoicing logic, payment tracking, or backend persistence are introduced.

## Core Rule (Enforced in UI)

- A **Deal must always belong to a Brand** (`brandId` required).
- The create flow disables “Create deal” until a brand is selected.
- Deal validation blocks saving edits that would remove `brandId`.

## Where It Lives

- Admin navigation: `Control Room → Deals`
- Route: `GET /admin/deals`
- Embedded surfaces:
  - Brand detail drawer (Admin Brands)
  - Campaign detail drawer (Admin Campaigns)
  - Event detail drawer (Admin Events)

## Frontend UI Contract (Current)

Deal object fields (saved locally):

- Core commercial details
  - `dealName` (required)
  - `brandId` (required, enforced)
  - `dealType` (enum)
  - `status` (enum)
  - `estimatedValueBand` (`£` / `££` / `£££`)
  - `confidence` (`Low` / `Medium` / `High`)
- Timing
  - `expectedCloseDate` (optional)
  - `deliveryDate` (optional)
- Context & scope
  - `internalSummary`
  - `notes` (internal only)
- Relationships (design-first)
  - `campaignId` (optional)
  - `eventIds` (optional placeholder; Events also optionally point to `dealId`)
  - `talentIds` (required later for creator deals; placeholder now)
  - `linkedTaskIds`, `linkedOutreachIds` (placeholders)
- Metadata
  - `owner`
  - `createdAt`, `updatedAt`
  - `lastActivityAt` (placeholder; derived later)
  - `activity` feed entries (e.g. “Deal created”)

Storage key:

- `break_admin_crm_deals_v1`

## How Deals Anchor the CRM (Design)

- **Tasks**: should be linkable to a deal (`dealId`) so work never floats without commercial context.
- **Events**: should link back to a deal (`dealId`) so appearances/trips/launch moments roll up under the commercial spine.
- **Outreach**: should optionally reference `dealId` for continuity (“last contact”, “follow-up due”).
- **Finance**: placeholder panel on the deal (Not invoiced / Invoiced / Paid), with no amounts yet (value band only).

## Intelligence Hooks (Design-Only)

Deal detail shows calm, dismissible hint cards (not dashboards), e.g.:

- “Stalled”
- “High activity, no close”
- “Follow-up overdue”
- “Similar deal closed before”

In the future these should feed tasks (e.g. create a follow-up task), not a pressure-filled pipeline view.

## UX Guardrails

- Deals feel unavoidable but not heavy:
  - Brand selection required before save
  - Clean drawer surface, not a dense form
- No sales pressure UI:
  - No raw revenue numbers
  - Value is abstracted to bands
  - No funnel charts or “quota” language

## Explicitly Not Included

- Contract uploads / approvals
- Invoice generation or payment tracking
- Revenue reporting
- Backend persistence, APIs, or permissions

