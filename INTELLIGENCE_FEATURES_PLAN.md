# Advanced Intelligence Features - Implementation Plan

**Status**: In Progress  
**Date**: January 17, 2026  
**Target**: 5 New Intelligence Systems on Top of Calendar + Meetings + Tasks

## Architecture Overview

```
┌─────────────────────────────────────────────┐
│     Frontend (Dashboard, Talent Page)       │
└────────────────┬────────────────────────────┘
                 │
┌─────────────────────────────────────────────┐
│        API Routes (New /api/intelligence)   │
├─────────────────────────────────────────────┤
│  • /api/intelligence/reminders              │
│  • /api/intelligence/agendas                │
│  • /api/intelligence/briefs                 │
│  • /api/intelligence/overload               │
│  • /api/intelligence/availability           │
└────────────────┬────────────────────────────┘
                 │
┌─────────────────────────────────────────────┐
│      Service Layer (All Business Logic)     │
├─────────────────────────────────────────────┤
│  • aiIntelligenceService (Central AI)       │
│  • calendarIntelligenceService (Calendar)   │
│  • reminderEngineService (Suggestions)      │
│  • briefGenerationService (Weekly snapshots)│
│  • overloadDetectionService (Burnout alerts)│
│  • talentAvailabilityService (Scheduling)   │
└────────────────┬────────────────────────────┘
                 │
┌─────────────────────────────────────────────┐
│      Data Layer (Prisma Models)             │
├─────────────────────────────────────────────┤
│  NEW MODELS (Additive Only):                │
│  • SmartReminderSuggestion                  │
│  • MeetingAgenda                            │
│  • TalentWeeklyBrief                        │
│  • CalendarWarning                          │
│  • TalentAvailability                       │
│  • TalentBlackoutDate                       │
│                                             │
│  EXISTING (Extended via Relations):         │
│  • Meeting → agendaDraft, suggestions       │
│  • Talent → availability, blackoutDates     │
│  • CalendarEvent → warnings                 │
└─────────────────────────────────────────────┘
```

## Phase 1: Database Models (Additive)

### New Prisma Models Needed

1. **SmartReminderSuggestion**
   - Context tracking (meeting/task/deal/outreach)
   - AI-generated suggestion
   - User approval workflow
   - Never auto-created (except admin rules)

2. **MeetingAgenda**
   - Draft agenda text
   - Is editable flag
   - Version tracking
   - Stored with meeting

3. **TalentWeeklyBrief**
   - Summary content (meetings, tasks, deals, alerts)
   - Generation timestamp
   - Delivery channel (in-app, email, slack)
   - Personalization metadata

4. **CalendarWarning**
   - Warning type (overload, no buffer, deadline cluster, availability conflict)
   - Linked calendar event
   - Dismissible
   - AI-generated

5. **TalentAvailability**
   - Working days (Mon-Fri or custom)
   - Preferred hours (9-5 or custom)
   - Timezone
   - Updated by talent

6. **TalentBlackoutDate**
   - Date ranges (vacation, illness, travel)
   - Reason
   - Visible on calendar

## Phase 2: Service Layer

### Core Services

1. **aiIntelligenceService.ts**
   - Central AI orchestration
   - LLM calls for context analysis
   - Suggestion generation
   - No direct DB writes (only read)

2. **reminderEngineService.ts**
   - Analyzes meetings, tasks, deals, outreach
   - Detects follow-up opportunities
   - Creates SmartReminderSuggestion
   - Ignores dismissed suggestions

3. **briefGenerationService.ts**
   - Generates weekly snapshots per talent
   - Pulls meetings, tasks, deals, alerts
   - AI summarizes and prioritizes
   - Creates TalentWeeklyBrief record

4. **overloadDetectionService.ts**
   - Analyzes calendar for overload signals
   - Creates CalendarWarning records
   - Suggests time management actions

5. **talentAvailabilityService.ts**
   - CRUD for availability windows
   - CRUD for blackout dates
   - Used by meeting creation (warnings)
   - Used by AI suggestions (filters times)

## Phase 3: API Routes

**New File**: `apps/api/src/routes/intelligence.ts`

```
POST   /api/intelligence/reminders            → Analyze & generate suggestions
GET    /api/intelligence/reminders/:talentId  → Get suggestions for talent
PATCH  /api/intelligence/reminders/:id        → Approve/dismiss suggestion

POST   /api/intelligence/agendas/:meetingId   → Generate or regenerate agenda
GET    /api/intelligence/agendas/:meetingId   → Get agenda draft
PATCH  /api/intelligence/agendas/:meetingId   → Save user-edited agenda

GET    /api/intelligence/briefs/:talentId     → Get latest weekly brief
POST   /api/intelligence/briefs               → Generate new briefs (cron job)

GET    /api/intelligence/overload/:talentId   → Get overload warnings
POST   /api/intelligence/overload             → Analyze all calendars (cron job)

GET    /api/intelligence/availability/:talentId → Get availability config
POST   /api/intelligence/availability/:talentId → Set availability
POST   /api/intelligence/blackouts/:talentId    → Add blackout date
DELETE /api/intelligence/blackouts/:id          → Remove blackout date
```

## Phase 4: Frontend Integration

### Where Features Appear

1. **Smart Reminders**
   - Dashboard: "AI Suggested Follow-Ups" card
   - Talent page: Contextual suggestions sidebar
   - One-click "Create Task" button

2. **Meeting Agendas**
   - Meeting creation modal: Auto-generated draft below title
   - Meeting detail page: Editable agenda section
   - "Regenerate" button

3. **Weekly Brief**
   - Talent overview: Summary section
   - Admin dashboard: Briefing portal
   - Email/Slack delivery (later)

4. **Calendar Intelligence**
   - Calendar view: Amber/red warning badges
   - Event hover: "No prep time before" warning
   - Sidebar: "Suggestions" (move meeting, add buffer, defer task)

5. **Availability**
   - Calendar: Blackout dates shown as blocked
   - Meeting creation: "Outside availability" warning
   - Talent settings: Configure working hours

## Implementation Sequence

**Step 1** (Today): Create Prisma models  
**Step 2** (Today): Create service layer (all 6 services)  
**Step 3** (Today): Create API routes  
**Step 4** (Tomorrow): Wire frontend  
**Step 5** (Tomorrow): Test end-to-end  

## Safety Guarantees

✅ NO Prisma reset  
✅ NO data wipe  
✅ NO duplicate sources of truth (all AI logic in services)  
✅ All additive (new models, new fields via relations)  
✅ All opt-in (user approves reminders, can dismiss warnings)  
✅ All traceable (logged, user-approved, dismissible)  

## Success Criteria

✅ Smart reminders suggest follow-ups contextually  
✅ Meetings have AI-generated agenda drafts  
✅ Each talent has a usable weekly brief  
✅ Calendar warns about overload  
✅ Talent availability affects scheduling  
✅ All features visible and working  
✅ Zero data loss or breakage  
