# Notes / Intelligence (CRM) — Frontend-First Notes

This adds **Notes & Intelligence** as institutional memory inside the CRM. Notes are **not** messages, tasks, or outreach; they are calm internal context.

## Where Notes Live (No Top-Level Nav)

Notes are embedded inside:

- Brand detail → “Notes & intelligence”
- Contact detail → “Notes & intelligence”
- Deal detail → “Notes & intelligence”

Optional access:

- Admin menu includes a **Quick add** placeholder (no functionality beyond a reminder).

## Frontend UI Contract (Current)

Note fields (saved locally):

- `noteText` (required)
- `noteType` (optional)
  - Relationship insight
  - Commercial insight
  - Process / preference
  - Risk / caution
  - General
- Context links (at least one required)
  - `brandId` (optional)
  - `contactId` (optional)
  - `dealId` (optional)
- Visibility
  - `visibility`: “Internal only” (default, non-editable)
- Metadata
  - `createdAt` (required)
  - `createdBy`
  - `pinned` (optional)

Storage key:

- `break_admin_crm_notes_v1`

## UX Behavior

- Notes render as calm cards (not chat bubbles), newest first.
- Pinned notes appear at the top and are visually subtle (high-signal).
- Actions per note:
  - Edit
  - Pin / unpin
  - Delete
- Add note flow is frictionless:
  - Modal composer
  - Required: note text
  - Optional: note type, pin
  - No mandatory tagging, no heavy forms

## Intelligence Hooks (Design-Only)

Notes sections include gentle, dismissible hints such as:

- “Consider pinning a high-signal preference…”
- “This note type appears often here…”
- “Similar note may exist on another deal…”

These are intentionally not alerts and do not create tasks automatically.

## How Notes Feed Future AI (Design)

Future use (not implemented):

- Surface relevant pinned notes during deal/campaign work
- Suggest when to pin a repeated preference
- Detect duplication across brand/deal contexts
- Offer “create a task from this note” as an explicit action (opt-in), not default behavior

## Guardrails

- Notes feel private and human:
  - No scoring, no metrics, no “pressure” UI
  - Minimal structure, optional typing only
- Notes remain memory by default:
  - No automatic task creation
  - No outbound visibility

