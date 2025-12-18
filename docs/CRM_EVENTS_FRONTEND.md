# Events (CRM) — Frontend-First Notes

This adds **Events** as a **top-level CRM entity** using **frontend-only state** (localStorage). No calendar sync, backend APIs, or permission layers are introduced.

## Where It Lives

- Admin navigation: `Control Room → Events`
- Route: `GET /admin/events`
- Embedded surfaces:
  - Campaign detail drawer (Admin Campaigns)
  - Brand detail drawer (Admin Brands)

## Frontend UI Contract (Current)

Event object fields (saved locally):

- Core
  - `eventName` (required)
  - `eventType` (enum)
  - `status` (enum)
  - `startDateTime`
  - `endDateTime` (optional)
  - `location`
  - `internalSummary`
- Context & links
  - `brandId` (optional)
  - `campaignId` (optional)
  - `dealId` (optional, design-only)
  - `linkedDealIds` (design-only hook for future “multiple deals”)
- Metadata
  - `owner`
  - `createdAt`
  - `updatedAt`
- Follow-through placeholders (design-only)
  - `attendeeTalentIds`, `attendeeTeamIds`
  - `linkedTaskIds`, `linkedOutreachIds`
  - `notes`
  - `activity` feed entries (e.g. “Event created”)

Storage key:

- `break_admin_crm_events_v1`

## Relationship Behavior (Design)

The UI is designed to support:

- One Event can link to a **Brand** and/or **Campaign** (optional).
- One Event can link to **multiple Deals** (future); currently a single `dealId` input exists plus `linkedDealIds` for expansion.
- Tasks and Outreach should be able to link back to an Event via `eventId` (future).
- Events can exist inside campaigns or standalone.

## Task Bundles (UI Hooks)

Event detail includes placeholders for:

- “Event prep”
- “Post-event follow-up”

In a future backend implementation, selecting a bundle would create tasks and auto-link them to the event.

## Event Intelligence (Design-Only)

Events show small, calm hints (not dashboards), e.g.:

- “Prep incomplete”
- “High-profile attendees”
- “Follow-up pending”
- “Repeat event with this brand”

## Calendar Relationship (Design-Only)

The UI model is calendar-friendly without implementing calendar sync:

- Events are primary calendar items.
- Tasks appear as secondary markers attached to events.
- Dragging an event would shift linked task due dates (future).

## UX Guardrails

- Events feel intentional, not cluttered:
  - “Upcoming” default view, time-aware sorting
  - Calm detail drawer centered on context + follow-through
- No heavy scheduling UI:
  - No Gantt, no ticketing, no check-ins
- Human language:
  - Plain event types + status pills; minimal jargon

## Explicitly Not Included

- Google/Outlook sync
- RSVP/ticketing/check-in logic
- Backend persistence, APIs, or permissions

