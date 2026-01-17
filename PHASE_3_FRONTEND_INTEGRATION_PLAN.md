# Phase 3: Frontend Integration - Planning & Implementation

**Status**: NOT STARTED  
**Date Started**: January 17, 2026  
**Estimated Duration**: 2-3 weeks  
**Priority**: High (User-facing features)

---

## Overview

Phase 3 focuses on building user-facing React components to integrate the AI intelligence features into the admin dashboard and talent management pages. All backend services are complete and tested; now we build the UI layer.

---

## Scope: 5 Major Components

### 1. Dashboard: Smart Reminders Card
**Location**: Admin Dashboard (main page)  
**Purpose**: Show pending AI-generated follow-up suggestions

#### Wireframe
```
┌─────────────────────────────────────────┐
│  💡 Smart Reminders                     │
│  You have 3 suggestions                 │
├─────────────────────────────────────────┤
│  [1] Schedule follow-up: Alex Chen      │
│      Meeting needed in 3 days           │
│      [Accept] [Dismiss] [Details]       │
│                                         │
│  [2] Check status: Stalled deal         │
│      No update in 7 days                │
│      [Accept] [Dismiss]                 │
│                                         │
│  [3] Complete overdue task              │
│      Task due 2 days ago                │
│      [Accept] [Dismiss]                 │
│                                         │
│  [View All Reminders] [Generate Now]    │
└─────────────────────────────────────────┘
```

#### Features
- List pending reminders (max 5, paginated)
- Show context icon (meeting/task/deal/outreach)
- Quick accept/dismiss actions
- Click to view full details with reasoning
- "Generate Now" button to trigger analysis
- Auto-refresh every 5 minutes (or manual)

#### Implementation
- Component: `AdminDashboard/SmartRemindersCard.tsx`
- Uses: `useReminders()` hook (custom hook)
- API Calls: 
  - GET /api/intelligence/reminders
  - POST /api/intelligence/reminders/:id/accept
  - POST /api/intelligence/reminders/:id/dismiss
  - POST /api/intelligence/reminders/generate

---

### 2. Dashboard: Weekly Briefs Widget
**Location**: Admin Dashboard (main page)  
**Purpose**: Show high-urgency briefs for talent needing attention

#### Wireframe
```
┌─────────────────────────────────────────┐
│  📊 Weekly Briefs                       │
│  3 high-urgency briefings               │
├─────────────────────────────────────────┤
│  [URGENT] Alex Chen                     │
│  This week: 4 meetings, 2 overdue tasks │
│  ⚠️ 1 deal stalled > 7 days            │
│  [View Brief] [Mark Read]               │
│                                         │
│  [NORMAL] Jordan Smith                  │
│  This week: 2 meetings, 0 issues        │
│  [View Brief]                           │
│                                         │
│  [View All Briefs] [Generate Weekly]    │
└─────────────────────────────────────────┘
```

#### Features
- Filter by urgency level (high/normal)
- Show summary stats (meetings, tasks, deals)
- Color-coded urgency badges
- Click to expand full brief
- Mark as read tracking
- Weekly generation trigger button

#### Implementation
- Component: `AdminDashboard/WeeklyBriefsWidget.tsx`
- Uses: `useBriefs()` hook
- API Calls:
  - GET /api/intelligence/briefs/recent
  - POST /api/intelligence/briefs/:id/read
  - POST /api/intelligence/briefs/generate

---

### 3. Dashboard: Calendar Warnings Banner
**Location**: Admin Dashboard (top alert area)  
**Purpose**: Prominently display calendar overload and scheduling issues

#### Wireframe
```
┌─────────────────────────────────────────────────────────┐
│ ⚠️  OVERLOAD DETECTED: 3 talents have scheduling issues │
│   • Alex Chen: 8 meetings today (overload score: 82)    │
│   • Jordan Smith: Vacation conflict (2 meetings)        │
│   [View Warnings] [Dismiss All] [Analyze Now]           │
└─────────────────────────────────────────────────────────┘
```

#### Features
- Summary of warning count
- Quick listing of affected talents
- Severity color coding (red/amber)
- Click to navigate to full warnings view
- Dismiss all / analyze again buttons
- Auto-hide if no warnings

#### Implementation
- Component: `AdminDashboard/CalendarWarningsAlert.tsx`
- Uses: `useOverloadWarnings()` hook
- API Calls:
  - GET /api/intelligence/overload/warnings
  - POST /api/intelligence/overload/warnings/:id/dismiss
  - POST /api/intelligence/overload/analyze

---

### 4. Talent Details: Meeting Agenda Editor
**Location**: Talent profile → Meeting detail  
**Purpose**: View and edit AI-generated meeting agendas

#### Wireframe
```
┌─────────────────────────────────────────────┐
│  Meeting: Brand Strategy Call               │
│  Jan 20, 2025 @ 2:00 PM                    │
├─────────────────────────────────────────────┤
│  📋 Meeting Agenda                          │
│                                             │
│  Objectives:                                │
│  ☐ Discuss Q1 campaign performance         │
│  ☐ Review timeline for deliverables        │
│  [+ Add Objective]                         │
│                                             │
│  Talking Points:                            │
│  • Update on brand partnership              │
│  • Metrics review (prepared)                │
│  [+ Add Talking Point]                     │
│                                             │
│  Decisions Needed:                          │
│  ⚠️ Content approval process                │
│  [+ Add Decision]                          │
│                                             │
│  Prep Items:                                │
│  ☐ Review previous meeting notes            │
│  ☐ Prepare performance metrics              │
│  [+ Add Prep Item]                         │
│                                             │
│  Generated by AI | Edited by User          │
│  [Save Changes] [Regenerate] [Cancel]      │
└─────────────────────────────────────────────┘
```

#### Features
- Display auto-generated agenda
- Inline editing for all sections
- Add/remove objectives, talking points, decisions, prep items
- Track original vs edited versions
- Regenerate option (discards user edits)
- Keyboard shortcuts for productivity
- Auto-save every 10 seconds

#### Implementation
- Component: `TalentProfile/MeetingAgendaEditor.tsx`
- Uses: `useAgenda()` hook
- API Calls:
  - GET /api/intelligence/agendas/:meetingId
  - PUT /api/intelligence/agendas/:meetingId
  - POST /api/intelligence/agendas/:meetingId/regenerate
  - POST /api/intelligence/agendas/:meetingId/objectives (and variants)

---

### 5. Talent Details: Availability & Blackout Manager
**Location**: Talent profile → Settings tab  
**Purpose**: Manage working hours, availability windows, vacation/blackout periods

#### Wireframe
```
┌──────────────────────────────────────────────────┐
│  Availability & Scheduling Preferences           │
├──────────────────────────────────────────────────┤
│                                                  │
│  Working Schedule                               │
│  Days:  [✓Mon] [✓Tue] [✓Wed] [✓Thu] [✓Fri]   │
│  Time:  [09:00] to [17:00]                     │
│  Timezone: [America/New_York ▼]                │
│                                                  │
│  Meeting Preferences                            │
│  Buffer between meetings: [15] minutes          │
│  Max meetings per day: [6]                      │
│  Min prep time: [15] minutes                    │
│                                                  │
│  [Save Settings]                                │
│                                                  │
├──────────────────────────────────────────────────┤
│  Blackout Dates (Vacation, Illness, Travel)    │
├──────────────────────────────────────────────────┤
│                                                  │
│  Current Blackouts:                             │
│  🏖️  Vacation                                   │
│     Feb 1-8, 2025                              │
│     Family trip                                 │
│     [Edit] [Delete]                            │
│                                                  │
│  [+ Add Blackout Date]                          │
│                                                  │
│  Add Blackout:                                  │
│  [Hidden] Type: [Vacation ▼]                  │
│  From: [2025-02-15] To: [2025-02-20]          │
│  Notes: [_________________]                    │
│  [✓ Visible on Calendar]                       │
│  [Add] [Cancel]                                │
│                                                  │
│  Quick Actions:                                 │
│  [Find Next Available Slot] [Validate Meeting] │
└──────────────────────────────────────────────────┘
```

#### Features
- Visual day selector (M-Su)
- Time picker for start/end hours
- Timezone dropdown
- Meeting preference sliders
- Save/reset buttons with confirmation
- List of active blackout dates
- Add/edit/delete blackout modal
- Visual calendar preview of blackouts
- Validator: "Can schedule on [date]?" button

#### Implementation
- Component: `TalentProfile/AvailabilityManager.tsx`
- Sub-components:
  - `AvailabilityForm.tsx` - Working hours editor
  - `BlackoutDateList.tsx` - Blackout dates manager
  - `BlackoutDateModal.tsx` - Add/edit blackout
  - `SlotFinder.tsx` - Find available slot tool
- Uses: `useAvailability()` hook, `useBlackouts()` hook
- API Calls:
  - GET /api/intelligence/availability/:talentId
  - PUT /api/intelligence/availability/:talentId
  - POST /api/intelligence/availability/:talentId/blackout
  - GET /api/intelligence/availability/:talentId/blackout
  - DELETE /api/intelligence/availability/blackout/:id
  - POST /api/intelligence/availability/:talentId/check-time
  - POST /api/intelligence/availability/:talentId/find-slot
  - POST /api/intelligence/availability/:talentId/validate-meeting

---

## Custom Hooks (to create)

### `useReminders(talentId)`
```typescript
const {
  reminders,      // SmartReminderSuggestion[]
  loading,        // boolean
  error,          // Error | null
  generateReminders,  // () => Promise<void>
  acceptReminder,     // (id: string, linkedTaskId?: string) => Promise<void>
  dismissReminder,    // (id: string, reason: string) => Promise<void>
} = useReminders(talentId)
```

### `useBriefs(talentId)`
```typescript
const {
  briefs,         // TalentWeeklyBrief[]
  loading,        // boolean
  error,          // Error | null
  generateBrief,  // () => Promise<void>
  markAsRead,     // (briefId: string) => Promise<void>
} = useBriefs(talentId)
```

### `useOverloadWarnings(talentId)`
```typescript
const {
  warnings,       // CalendarWarning[]
  overloadScore,  // number
  severity,       // "low" | "medium" | "high"
  loading,        // boolean
  analyze,        // () => Promise<void>
  acknowledgeWarning, // (id: string) => Promise<void>
  dismissWarning,     // (id: string) => Promise<void>
} = useOverloadWarnings(talentId)
```

### `useAgenda(meetingId)`
```typescript
const {
  agenda,         // MeetingAgenda | null
  loading,        // boolean
  error,          // Error | null
  updateAgenda,   // (updates: Partial<MeetingAgenda>) => Promise<void>
  regenerate,     // () => Promise<void>
  addObjective,   // (objective: string) => Promise<void>
  removeObjective,// (objective: string) => Promise<void>
} = useAgenda(meetingId)
```

### `useAvailability(talentId)`
```typescript
const {
  availability,   // TalentAvailability
  loading,        // boolean
  error,          // Error | null
  setAvailability,// (settings: Partial<TalentAvailability>) => Promise<void>
  checkAvailability, // (dateTime: Date) => Promise<boolean>
  findNextSlot,   // (duration: number, maxDays: number) => Promise<{start, end}>
  validateMeeting,// (start: Date, end: Date) => Promise<ValidationResult>
} = useAvailability(talentId)
```

### `useBlackouts(talentId)`
```typescript
const {
  blackouts,      // TalentBlackoutDate[]
  loading,        // boolean
  error,          // Error | null
  addBlackout,    // (data: BlackoutData) => Promise<void>
  updateBlackout, // (id: string, data: Partial<BlackoutData>) => Promise<void>
  deleteBlackout, // (id: string) => Promise<void>
} = useBlackouts(talentId)
```

---

## Implementation Sequence

### Week 1: Foundation & Hooks
- [ ] Create all 6 custom hooks
- [ ] Create helper utilities for data transformation
- [ ] Set up API client layer if not already present
- [ ] Create shared UI components (badges, buttons, modals)

### Week 2: Dashboard Components
- [ ] SmartRemindersCard
- [ ] WeeklyBriefsWidget
- [ ] CalendarWarningsAlert
- [ ] Integrate into AdminDashboard layout
- [ ] Add real-time updates (polling/WebSocket)

### Week 3: Talent Pages & Polish
- [ ] MeetingAgendaEditor
- [ ] AvailabilityManager (all sub-components)
- [ ] Integration with existing TalentProfile pages
- [ ] Styling and UX polish
- [ ] Accessibility (ARIA labels, keyboard navigation)
- [ ] Performance optimization

---

## Testing Requirements

### Unit Tests
- [ ] Each hook tests (success, loading, error states)
- [ ] Component rendering tests
- [ ] User interaction tests

### Integration Tests
- [ ] Full flow: Generate reminder → Accept → Create task
- [ ] Full flow: Set availability → Validate meeting
- [ ] Full flow: Generate agenda → Edit → Save

### E2E Tests
- [ ] Dashboard loads all cards without errors
- [ ] Can add/remove blackout dates
- [ ] Meeting agenda auto-saves
- [ ] Reminders dismiss and update count

---

## API Integration Checklist

### Authentication
- [x] All endpoints protected by requireAuth middleware
- [ ] Test authentication tokens are working
- [ ] Verify session management

### Error Handling
- [ ] All API errors have user-friendly messages
- [ ] Fallback UI when API unavailable
- [ ] Retry logic for failed requests
- [ ] Loading states for long operations

### Data Validation
- [ ] Client-side validation before API calls
- [ ] Server validation confirmed working
- [ ] Edge cases handled (empty lists, null values)

---

## Design System Alignment

### Colors
- **Success**: Green (#10b981)
- **Warning/Alert**: Amber (#f59e0b)
- **Error**: Red (#ef4444)
- **Info**: Blue (#3b82f6)
- **Neutral**: Gray (existing palette)

### Icons (using existing icon library)
- 💡 Reminder/Suggestion
- 📊 Brief/Analytics
- ⚠️ Warning/Alert
- 📋 Agenda/Planning
- 🗓️ Calendar/Availability
- 🏖️ Vacation/Blackout
- ✓ Success/Accept
- ✗ Dismiss/Cancel

### Typography
- Headings: Existing h1-h6 styles
- Labels: Smaller, medium weight
- Values: Monospace for data (times, scores)

---

## Performance Optimization

### Caching
- Cache availability settings (60 min)
- Cache briefings (24 hours or until next generation)
- Cache reminders (5 min)

### Lazy Loading
- Load agendas on demand (not all at once)
- Pagination for reminder lists
- Virtual scrolling for long lists

### API Batching
- Batch availability checks (if checking multiple talents)
- Combine related queries where possible

---

## Rollout Plan

### Internal Testing (1 week)
- Deploy to staging environment
- Internal team testing
- Performance benchmarking

### Limited Release (1 week)
- Release to 10% of users
- Monitor error rates and performance
- Gather feedback

### Full Release
- Roll out to all users
- Monitor usage metrics
- Plan iterative improvements

---

## Success Metrics

### Usage
- % of active users interacting with each feature
- Average reminders generated per day
- % of reminders accepted vs dismissed
- Blackout date coverage across talent pool

### Performance
- Component load times < 500ms
- API response times < 200ms
- No console errors on render
- 99.9% uptime

### User Satisfaction
- Feature adoption rate
- User feedback/ratings
- Support ticket volume related to features
- Feature-specific user satisfaction survey

---

## Known Risks & Mitigation

### Risk: API Response Delays
**Impact**: UI feels slow, users frustrated  
**Mitigation**: Add loading states, skeleton screens, optimistic updates

### Risk: Users Ignore Warnings
**Impact**: Scheduling conflicts still occur  
**Mitigation**: Prominent positioning, email notifications, repeated alerts

### Risk: Timezone Confusion
**Impact**: Blackouts applied incorrectly  
**Mitigation**: Explicit timezone display, confirmation before save

### Risk: Data Overload in Briefs
**Impact**: Users ignore briefs due to too much info  
**Mitigation**: Summarization, filtering, progressive disclosure

---

## Future Enhancements

1. **Automated Scheduling** - AI suggests optimal meeting times
2. **Email Summaries** - Weekly briefs sent via email
3. **Slack Integration** - Reminders and warnings in Slack
4. **Mobile App** - Native availability management
5. **AI Training** - Learn from user choices to improve suggestions
6. **Team Analytics** - Aggregate overload/availability across team
7. **Meeting Preparation** - Auto-generate attendee prep docs
8. **Post-Meeting Follow-up** - Summarize outcomes and action items

---

## Contacts & Responsibilities

| Role | Responsibility |
|------|-----------------|
| Frontend Lead | Component development, hook creation |
| Product Manager | UX requirements, acceptance criteria |
| QA Engineer | Test planning, test case creation |
| Backend Support | API debugging, performance tuning |

---

## Timeline Summary

| Phase | Duration | Status |
|-------|----------|--------|
| Phase 1: Calendar Integration | 2 days | ✅ Complete |
| Phase 2: Backend Services | 1 day | ✅ Complete |
| Phase 3: Frontend Integration | 3 weeks | 🔄 In Planning |
| Phase 4: Testing & Refinement | 1 week | ⏳ Pending |
| Phase 5: Rollout & Monitoring | Ongoing | ⏳ Pending |

---

## Next Step

Begin Phase 3 implementation with Week 1 tasks:
1. Create custom hooks structure
2. Set up API client helpers
3. Create shared components
4. Start with SmartRemindersCard

Target completion: 3 weeks from start date (Feb 7, 2026)
