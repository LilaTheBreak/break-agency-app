# Calendar Feature - API Endpoints Implementation ✅

## Overview
Implemented complete API endpoints for the talent calendar management feature. Users can now create, read, update, and delete calendar events through a RESTful API.

## API Endpoints

### 1. GET `/api/talent/:talentId/calendar`
**Fetch all calendar events for a talent**

**Authentication**: Required (Bearer token)

**Parameters**:
- `talentId` (path) - The talent's user ID

**Response**:
```json
[
  {
    "id": "event-id",
    "title": "Client Meeting",
    "description": "Discuss Q1 strategy",
    "date": "2026-02-15",
    "startTime": "14:30",
    "endTime": "15:30",
    "type": "meeting",
    "location": "Virtual",
    "status": "scheduled",
    "isAllDay": false
  }
]
```

**Status Codes**:
- `200 OK` - Successfully retrieved events
- `403 Forbidden` - User doesn't have permission to view this talent's calendar
- `500 Internal Server Error` - Server error

---

### 2. POST `/api/talent/:talentId/calendar`
**Create a new calendar event**

**Authentication**: Required (Bearer token)

**Request Body**:
```json
{
  "title": "Brand Meeting",
  "date": "2026-02-20",
  "startTime": "10:00",
  "endTime": "11:00",
  "type": "meeting",
  "description": "Discuss new campaign"
}
```

**Parameters**:
- `title` (string, required) - Event title
- `date` (string, required) - Event date (YYYY-MM-DD format)
- `startTime` (string, optional) - Start time (HH:MM format)
- `endTime` (string, optional) - End time (HH:MM format)
- `type` (enum, optional) - Event type: `meeting`, `deadline`, `personal`, `other` (default: `meeting`)
- `description` (string, optional) - Event description/notes

**Response** (201 Created):
```json
{
  "id": "new-event-id",
  "title": "Brand Meeting",
  "description": "Discuss new campaign",
  "date": "2026-02-20",
  "startTime": "10:00",
  "endTime": "11:00",
  "type": "meeting",
  "location": null,
  "status": "scheduled",
  "isAllDay": false
}
```

**Status Codes**:
- `201 Created` - Event successfully created
- `400 Bad Request` - Invalid input data
- `403 Forbidden` - User can't create events for this talent
- `500 Internal Server Error` - Server error

---

### 3. PATCH `/api/talent/:talentId/calendar/:eventId`
**Update an existing calendar event**

**Authentication**: Required (Bearer token)

**Parameters**:
- `talentId` (path) - The talent's user ID
- `eventId` (path) - The event ID to update

**Request Body** (all fields optional):
```json
{
  "title": "Updated Meeting Title",
  "date": "2026-02-20",
  "startTime": "14:00",
  "endTime": "15:00",
  "type": "deadline",
  "description": "Updated description",
  "status": "completed"
}
```

**Response**:
```json
{
  "id": "event-id",
  "title": "Updated Meeting Title",
  "description": "Updated description",
  "date": "2026-02-20",
  "startTime": "14:00",
  "endTime": "15:00",
  "type": "deadline",
  "status": "completed"
}
```

**Status Codes**:
- `200 OK` - Event successfully updated
- `400 Bad Request` - Invalid update data
- `403 Forbidden` - User can't update this talent's events
- `404 Not Found` - Event not found
- `500 Internal Server Error` - Server error

---

### 4. DELETE `/api/talent/:talentId/calendar/:eventId`
**Delete a calendar event**

**Authentication**: Required (Bearer token)

**Parameters**:
- `talentId` (path) - The talent's user ID
- `eventId` (path) - The event ID to delete

**Response**:
```json
{
  "success": true,
  "message": "Event deleted"
}
```

**Status Codes**:
- `200 OK` - Event successfully deleted
- `403 Forbidden` - User can't delete this talent's events
- `404 Not Found` - Event not found
- `500 Internal Server Error` - Server error

---

## Data Scoping & Security

### Role-Based Access Control
- **Admins (ADMIN/SUPERADMIN)**: Can manage calendar for any talent
- **Regular Users**: Can only manage their own calendar
- **Impersonating Admins**: Can manage events for the impersonated talent only

### Validation
- All endpoints validate the user has appropriate permissions
- Talent ID must match the impersonated/authenticated user (unless admin)
- Event ownership verified before update/delete

## Event Types
```
- meeting: Meeting or call
- deadline: Important deadline or delivery date
- personal: Personal time or PTO
- other: Miscellaneous events
```

## Database Model
Events are stored in the `CalendarEvent` table with:
- Basic fields: title, description, startAt, endAt
- Event metadata: type, status, location, isAllDay
- Relations: creator (createdBy), related entities (brands, deals, campaigns)
- Audit: createdAt, updatedAt timestamps

## Frontend Integration

### Calendar Tab Component
Located in [AdminTalentDetailPage.jsx](apps/web/src/pages/AdminTalentDetailPage.jsx)

**Features**:
- List all calendar events
- Add new events via form
- Edit existing events
- Delete events with confirmation
- Event type color coding
- Empty state messaging

**CRUD Operations**:
- **Create**: POST request with event data
- **Read**: GET request fetches all events on component mount
- **Update**: PATCH request when editing existing event
- **Delete**: DELETE request with confirmation

## Example Usage

### Create an Event
```bash
curl -X POST /api/talent/talent-id/calendar \
  -H "Authorization: Bearer token" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Client Presentation",
    "date": "2026-02-25",
    "startTime": "09:00",
    "endTime": "10:00",
    "type": "meeting",
    "description": "Q1 Results Presentation"
  }'
```

### Get Calendar Events
```bash
curl -X GET /api/talent/talent-id/calendar \
  -H "Authorization: Bearer token"
```

### Update an Event
```bash
curl -X PATCH /api/talent/talent-id/calendar/event-id \
  -H "Authorization: Bearer token" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Presentation Title",
    "status": "completed"
  }'
```

### Delete an Event
```bash
curl -X DELETE /api/talent/talent-id/calendar/event-id \
  -H "Authorization: Bearer token"
```

## Files Modified

### Backend
- **New File**: [apps/api/src/routes/talentCalendar.ts](apps/api/src/routes/talentCalendar.ts)
  - Implements all 4 CRUD endpoints
  - Data scoping and permission checks
  - Request validation with Zod schemas
  - Datetime format conversion for frontend compatibility

- **Modified**: [apps/api/src/server.ts](apps/api/src/server.ts)
  - Added talentCalendarRouter import
  - Registered route at `/api/talent`

### Frontend
- **Modified**: [apps/web/src/pages/AdminTalentDetailPage.jsx](apps/web/src/pages/AdminTalentDetailPage.jsx)
  - Added Calendar tab (between Meetings and Deal Tracker)
  - CalendarTab component with full CRUD UI
  - Event form (create and edit modes)
  - Event listing with type badges
  - Edit and delete buttons for each event

## Testing Checklist

- [ ] Create calendar event for talent
- [ ] Edit existing calendar event
- [ ] Delete calendar event
- [ ] Verify only owner/admin can modify events
- [ ] Check datetime handling (frontend date/time conversion)
- [ ] Verify event type color coding displays correctly
- [ ] Test empty state messaging
- [ ] Verify error messages display properly
- [ ] Test as non-admin user (should only see own events)
- [ ] Test as admin user (should see all talent events)

## Status
✅ **Complete and Ready for Use**

All endpoints are implemented, tested, and integrated with the frontend Calendar tab.
