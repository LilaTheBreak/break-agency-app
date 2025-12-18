# Documents / Contracts (CRM) — Frontend-First Notes

This adds **Documents / Contracts** as a **first-class CRM entity** (admin) using **frontend-only state** (localStorage). No file storage, e-signature, parsing, or permissions are implemented.

## Core Principle

- A contract is **not a file** — it’s a commercial object with:
  - Status
  - Dates & renewal context
  - Risk cues
  - Relationships to Brand + Deal (+ optional Campaign/Event)
  - Tasks and follow-through hooks

## Where It Lives

- Admin navigation: `Control Room → Documents / Contracts`
- Route: `GET /admin/documents`
- Embedded surfaces:
  - Deal detail drawer
  - Brand detail drawer
  - Campaign detail drawer (optional relevance)

## Frontend UI Contract (Current)

Contract fields (saved locally):

- Core details
  - `contractName` (required)
  - `contractType` (enum)
  - `status` (enum)
- Parties
  - `brandId` (required)
  - `talentIds` (optional placeholder)
  - `internalOwner`
- Dates & risk
  - `startDate` (optional)
  - `endDate` (optional)
  - `renewalType`
  - `expiryRisk` (derived display-only from end date proximity)
- Relationships
  - `dealId` (required for commercial contracts)
  - `campaignId` (optional)
  - `eventId` (optional)
- Metadata
  - `createdAt`
  - `lastUpdatedAt`
- Placeholders (design-only)
  - `files`, `versions` (display only)
  - task bundles (“Send contract”, “Chase signature”, “Renewal follow-up”, etc.)
  - `activity` feed entries

Storage key:

- `break_admin_crm_contracts_v1`

## Relationship Rules (Enforced)

- Contract must link to:
  - **Brand** (required)
  - **Deal** (required)
- Campaign/Event links are optional and contextual.

## Expiry Risk (Display-Only)

The UI shows a subtle `Low / Medium / High` label derived from `endDate`:

- ≤ 30 days: High
- 31–60 days: Medium
- > 60 days: Low
- Missing/invalid end date: Low

This is intentionally non-alarmist and will later drive *tasks*, not dashboards.

## Task Generation Hooks (Design-Only)

Contract detail includes placeholders for future contract task bundles:

- Send contract
- Chase signature
- Deliverables due
- Renewal follow-up

Future behavior: selecting a bundle would create tasks linked back to `contractId` and (usually) the same `dealId`.

## Intelligence Hooks (Design-Only)

The contract drawer includes dismissible hints that cite their source:

- “Signature overdue (status: Sent)”
- “Renewal approaching (end date: …)”
- “Expiry risk: High (based on end date)”

Future behavior: each hint should be able to create a task rather than generating noisy alerts.

## UX Guardrails

- Structured and calm, not intimidating:
  - Status + dates first
  - Files are secondary
- Avoid legal jargon:
  - Plain contract types, clear status words
- No compliance theatre:
  - No scary warnings, no fake “legal review” UX
  - Risk cues stay subtle and task-oriented

## Explicitly Not Included

- File upload/storage
- E-signature workflow
- Clause parsing or AI contract reading
- Legal approval workflows
- Backend persistence or permissions

