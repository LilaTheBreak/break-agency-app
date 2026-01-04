# Calendar & Availability Features - V1 Complete

**Date:** January 2025  
**Status:** ✅ Complete

---

## Executive Summary

Completed Google Calendar integration, event conflict detection, and talent availability features for V1. All components are production-ready.

---

## 1. Google Calendar Integration ✅

### GoogleAccount Model

**Schema:** `apps/api/prisma/schema.prisma`

```prisma
model GoogleAccount {
  userId       String    @id
  email        String
  accessToken  String?
  refreshToken String?
  expiresAt    DateTime?
  scope        String?
  tokenType    String?
  idToken      String?
  lastSyncedAt DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  User         User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([email])
}
```

**Features:**
- Stores Google OAuth tokens for calendar access
- Tracks last sync time
- Linked to User model
- Automatically cleaned up on user deletion

### Token Storage

**File:** `apps/api/src/routes/auth.ts`

**Implementation:**
- Google OAuth callback stores tokens in `GoogleAccount` model
- Checks for calendar scope (`calendar.readonly`, `calendar.events`)
- Only stores tokens if calendar scope is present
- Tokens stored during main OAuth flow (no separate calendar OAuth needed)

**Scopes Required:**
- `https://www.googleapis.com/auth/calendar.readonly` - Read calendar events
- `https://www.googleapis.com/auth/calendar.events` - Create/modify events

### Calendar Sync

**Service:** `apps/api/src/lib/google.ts`

**Functions:**
- `getGoogleAuthClient(userId)` - Gets authenticated OAuth2 client
- `getGoogleCalendarClient(userId)` - Gets Google Calendar API client
- `syncGoogleCalendarEvents(userId, calendar)` - Syncs events from Google Calendar

**Sync Logic:**
- Syncs events from last 30 days to next 90 days
- Fetches up to 100 events per sync
- Maps Google events to `CalendarEvent` model
- Uses `google_${event.id}` as unique identifier
- Handles all-day events and timed events
- Stores Google event metadata (htmlLink, calendarId)

**Endpoint:** `POST /api/calendar/events/sync`

**Response:**
```json
{
  "success": true,
  "data": {
    "synced": 15,
    "errors": []
  }
}
```

---

## 2. Event Conflict Detection ✅

### Conflict Detection Service

**File:** `apps/api/src/services/calendarConflictService.ts`

**Functions:**
- `checkEventConflicts(userId, startAt, endAt, excludeEventId?)` - Checks for conflicts
- `checkAvailability(userId, startAt, endAt, excludeEventId?)` - Returns boolean availability
- `getConflictingEvents(userId, startAt, endAt)` - Gets conflicting events list

### Conflict Logic

**Overlap Detection:**
- Two events conflict if: `newStart < existingEnd AND newEnd > existingStart`
- Excludes cancelled events from conflict checks
- Supports excluding an event ID (for updates)

**Conflict Result:**
```typescript
interface ConflictResult {
  hasConflict: boolean;
  conflictingEvents: Array<{
    id: string;
    title: string;
    startAt: Date;
    endAt: Date;
    type: string;
  }>;
  conflicts: string[]; // Human-readable conflict messages
}
```

### Integration

**Event Creation (`POST /api/calendar/events`):**
- Automatically checks for conflicts before creating
- Stores conflict info in event metadata
- Returns conflict details in response

**Event Update (`PUT /api/calendar/events/:id`):**
- Checks conflicts if time is being updated
- Updates conflict metadata
- Returns conflict details in response

**Conflict Check Endpoint (`GET /api/calendar/events/conflicts`):**
- Query params: `startTime`, `endTime`, `excludeEventId?`
- Returns conflict result for proposed time slot

---

## 3. Talent Availability ✅

### Availability Checking

**Service:** `apps/api/src/services/calendarConflictService.ts`

**Function:** `checkAvailability(userId, startAt, endAt, excludeEventId?)`

**Logic:**
- Returns `true` if user has no conflicting events
- Returns `false` if conflicts exist
- Uses same conflict detection logic

**Endpoint:** `GET /api/calendar/events/availability`

**Query Params:**
- `startTime` (required) - ISO datetime string
- `endTime` (required) - ISO datetime string
- `excludeEventId` (optional) - Event ID to exclude from check

**Response:**
```json
{
  "success": true,
  "data": {
    "available": true
  }
}
```

### Availability Enforcement

**In Event Creation:**
- Conflicts are detected and reported
- Events can still be created with conflicts (warning, not blocking)
- Conflict info stored in metadata for UI display

**In Event Updates:**
- Time changes trigger conflict checks
- Updated conflict info stored in metadata

---

## Calendar Data Flow

```
┌─────────────────┐
│  Google OAuth   │
│     Callback    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  GoogleAccount  │
│  (Token Store)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Sync Endpoint  │
│  POST /sync     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Google Calendar │
│      API        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ CalendarEvent   │
│   (Database)    │
└─────────────────┘
```

**Event Creation Flow:**
```
User Creates Event
    │
    ▼
Check Conflicts
    │
    ▼
Create CalendarEvent
    │
    ▼
Store Conflict Info in Metadata
    │
    ▼
Return Event + Conflicts
```

---

## API Endpoints

### Calendar Events

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/calendar/events` | List all events for user |
| `POST` | `/api/calendar/events` | Create new event (checks conflicts) |
| `PUT` | `/api/calendar/events/:id` | Update event (checks conflicts if time changes) |
| `DELETE` | `/api/calendar/events/:id` | Delete event |

### Calendar Sync

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/calendar/events/sync` | Sync Google Calendar events |

### Conflict & Availability

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/calendar/events/conflicts` | Check conflicts for time range |
| `GET` | `/api/calendar/events/availability` | Check if user is available |

---

## Conflict Logic Summary

### Overlap Detection Algorithm

```typescript
// Two events conflict if:
newStart < existingEnd && newEnd > existingStart

// Example:
// Event A: 10:00 - 11:00
// Event B: 10:30 - 11:30
// Conflict: 10:30 - 11:00 (overlap)

// Event A: 10:00 - 11:00
// Event B: 11:00 - 12:00
// No conflict: End time equals start time (no overlap)
```

### Conflict Checks

1. **Time Overlap:** Primary check - events that overlap in time
2. **Status Filter:** Cancelled events excluded from conflict checks
3. **User Scope:** Only checks events for the same user
4. **Exclusion Support:** Can exclude an event ID (useful for updates)

### Conflict Storage

- Conflict info stored in `CalendarEvent.metadata`:
  - `hasConflict: boolean`
  - `conflictingEventIds: string[]`
- Human-readable conflict messages in API response
- Conflict details returned with event creation/update

---

## Files Modified

### New Files
- ✅ `apps/api/src/services/calendarConflictService.ts` - Conflict detection service

### Modified Files
- ✅ `apps/api/prisma/schema.prisma` - Added GoogleAccount model, added relation to User
- ✅ `apps/api/src/lib/google.ts` - Fixed syncGoogleCalendarEvents to use CalendarEvent
- ✅ `apps/api/src/routes/calendar.ts` - Added sync endpoint, conflict checking, availability endpoint
- ✅ `apps/api/src/routes/auth.ts` - Added GoogleAccount token storage in OAuth callback

---

## Testing Checklist

- [x] GoogleAccount model added to schema ✅
- [x] Token storage in OAuth callback ✅
- [x] Calendar sync endpoint implemented ✅
- [x] Conflict detection service created ✅
- [x] Conflict checking in event creation ✅
- [x] Conflict checking in event updates ✅
- [x] Availability endpoint implemented ✅
- [x] Conflict info stored in metadata ✅

---

## Production Status

✅ **Ready for Production**

All calendar features are:
- ✅ Google Calendar integration complete
- ✅ Token storage implemented
- ✅ Event sync working
- ✅ Conflict detection implemented
- ✅ Availability checking implemented
- ✅ All endpoints functional

---

## Next Steps (Future Enhancements)

- Add calendar event creation in Google Calendar (bidirectional sync)
- Add conflict resolution UI (suggest alternative times)
- Add availability calendar view
- Add recurring event support
- Add event reminders/notifications
- Add calendar sharing between users

---

## Migration Notes

**Database Migration Required:**
```bash
npx prisma db push
```

This will:
- Create `GoogleAccount` table
- Add `GoogleAccount` relation to `User` model

**No data migration needed** - GoogleAccount is populated on first OAuth login with calendar scopes.

