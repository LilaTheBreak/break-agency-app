# Complete Task Creation & Management Endpoints Summary

## Overview
This document provides a comprehensive breakdown of all task creation endpoints, service functions, frontend components, and task models used across the Break Agency platform.

---

## Task Models

The system uses **4 different task models** depending on the context:

### 1. **TalentTask** (Talent Management)
- Used for: Tasks associated with individual talents/creators
- Location: Prisma schema
- Fields: `id`, `talentId`, `title`, `notes`, `dueDate`, `status`, `createdBy`, `completedAt`

### 2. **CreatorTask** (Creator/Deal Tasks)
- Used for: Tasks assigned to creators for deals (creative, attendance, review, approval)
- Location: Prisma schema
- Status values: `pending`, `in_progress`, `completed`, `cancelled`
- Task types: `creative`, `attendance`, `review`, `approval`

### 3. **CrmTask** (Central CRM Tasks)
- Used for: Enterprise-level tasks linked to brands, campaigns, deals, contacts
- Location: Prisma schema
- Related entities: Brands, Campaigns, Events, Contracts, Deals
- Status: `Pending`, `In Progress`, `Completed`, `Cancelled`
- Priority: `Low`, `Medium`, `High`, `Urgent`

### 4. **OutreachTask** (Outreach Record Tasks)
- Used for: Tasks for outreach records
- Location: Prisma schema
- Fields: `id`, `outreachId`, `title`, `dueDate`, `priority`, `owner`, `status`, `createdAt`, `updatedAt`

### 5. **InternalQueueTask** (Internal Operations)
- Used for: Internal team queue management
- Location: Prisma schema
- Fields: `id`, `title`, `description`, `priority`, `dueDate`, `status`, `assignedToUserId`, `createdByUserId`, `metadata`

---

## API Endpoints

### Talent Tasks

#### 1. POST /api/admin/talent/:id/tasks
**File:** [apps/api/src/routes/admin/talent.ts](apps/api/src/routes/admin/talent.ts#L1531)
**Model:** TalentTask
**Description:** Create a new task for a talent
**Request Body:**
```json
{
  "title": "string (required)",
  "notes": "string (optional)",
  "dueDate": "ISO date (optional)",
  "status": "string (optional, defaults to 'PENDING')"
}
```
**Response:** Created TalentTask object
**Activity Logging:** `TALENT_TASK_CREATED`

#### 2. GET /api/admin/talent/:id/tasks
**File:** [apps/api/src/routes/admin/talent.ts](apps/api/src/routes/admin/talent.ts#L1576)
**Model:** TalentTask
**Description:** Get all tasks for a specific talent
**Response:** Array of TalentTask objects (ordered by dueDate)

#### 3. PATCH /api/admin/talent/tasks/:taskId
**File:** [apps/api/src/routes/admin/talent.ts](apps/api/src/routes/admin/talent.ts#L1596)
**Model:** TalentTask
**Description:** Update a talent task
**Request Body:**
```json
{
  "title": "string (optional)",
  "notes": "string (optional)",
  "dueDate": "ISO date (optional)",
  "status": "string (optional)",
  "completedAt": "ISO date (optional)"
}
```
**Activity Logging:** `TALENT_TASK_UPDATED`

#### 4. DELETE /api/admin/talent/tasks/:taskId
**File:** [apps/api/src/routes/admin/talent.ts](apps/api/src/routes/admin/talent.ts#L1635)
**Model:** TalentTask
**Description:** Delete a talent task
**Activity Logging:** `TALENT_TASK_DELETED`

---

### Outreach Tasks

#### 1. POST /api/admin/outreach/:id/create-task
**File:** [apps/api/src/routes/admin/outreach.ts](apps/api/src/routes/admin/outreach.ts#L541)
**Model:** OutreachTask
**Description:** Create a task from an outreach record
**Request Body:**
```json
{
  "title": "string (required)",
  "dueDate": "ISO date (optional)",
  "priority": "string (default: 'Medium')",
  "owner": "string (optional)"
}
```
**Activity Logging:** `CREATE_OUTREACH_TASK`

#### 2. POST /api/outreach/records/:id/tasks
**File:** [apps/api/src/routes/outreach.ts](apps/api/src/routes/outreach.ts#L367)
**Model:** OutreachTask
**Description:** Create a task for an outreach record (alternative endpoint)
**Request Body:**
```json
{
  "title": "string (required)",
  "dueDate": "ISO date (optional)",
  "owner": "string (optional)",
  "priority": "string (default: 'Medium')"
}
```
**Response:** `{ task: OutreachTask }`

#### 3. GET /api/outreach/records/:id/tasks
**File:** [apps/api/src/routes/outreach.ts](apps/api/src/routes/outreach.ts#L397)
**Model:** OutreachTask
**Description:** Get all tasks for an outreach record
**Response:** `{ tasks: OutreachTask[] }`

#### 4. PATCH /api/outreach/tasks/:taskId
**File:** [apps/api/src/routes/outreach.ts](apps/api/src/routes/outreach.ts#L412)
**Model:** OutreachTask
**Description:** Update an outreach task

---

### Meeting Action Items to Tasks

#### 1. POST /api/action-items/:actionItemId/add-to-tasks
**File:** [apps/api/src/routes/admin/meetings.ts](apps/api/src/routes/admin/meetings.ts#L406)
**Model:** TalentTask
**Description:** Convert a meeting action item to a task
**Process:**
1. Validates meeting action item exists
2. Creates a TalentTask with action item data
3. Links action item to task via `linkedTaskId`
**Response:**
```json
{
  "actionItem": "updated MeetingActionItem",
  "task": "created TalentTask"
}
```

---

### CRM Tasks (Enterprise)

#### 1. POST /api/crm-tasks
**File:** [apps/api/src/routes/crmTasks.ts](apps/api/src/routes/crmTasks.ts#L150)
**Model:** CrmTask
**Description:** Create a new CRM task (supports relations to brands, campaigns, deals, events, contracts)
**Request Body:**
```json
{
  "title": "string (required)",
  "description": "string (optional)",
  "status": "string (default: 'Pending')",
  "priority": "string (default: 'Medium')",
  "dueDate": "ISO date (optional)",
  "owner": "string (optional)",
  "ownerId": "string (optional, defaults to current user)",
  "assignedUserIds": "string[] (optional)",
  "mentions": "string[] (optional)",
  "relatedBrands": "string[] (optional)",
  "relatedCreators": "string[] (optional)",
  "relatedUsers": "string[] (optional)",
  "relatedDeals": "string[] (optional)",
  "relatedCampaigns": "string[] (optional)",
  "relatedEvents": "string[] (optional)",
  "relatedContracts": "string[] (optional)",
  "brandId": "string (optional)",
  "dealId": "string (optional)",
  "campaignId": "string (optional)",
  "eventId": "string (optional)",
  "contractId": "string (optional)"
}
```
**Features:**
- Creates task notifications for mentions and assignments
- Syncs task to calendar if due date provided
- Includes related entities in response

#### 2. GET /api/crm-tasks
**File:** [apps/api/src/routes/crmTasks.ts](apps/api/src/routes/crmTasks.ts#L75)
**Model:** CrmTask
**Description:** List all CRM tasks with filtering
**Query Parameters:**
- `status`: Filter by status
- `priority`: Filter by priority
- `owner`: Filter by owner
- `brandId`: Filter by brand
- `campaignId`: Filter by campaign
**Features:**
- Applies visibility filtering based on user role
- Filters mentions (JSON field)

#### 3. GET /api/crm-tasks/:id
**File:** [apps/api/src/routes/crmTasks.ts](apps/api/src/routes/crmTasks.ts#L131)
**Model:** CrmTask
**Description:** Get a single CRM task
**Features:**
- Permission checking based on user role

#### 4. PATCH /api/crm-tasks/:id
**File:** [apps/api/src/routes/crmTasks.ts](apps/api/src/routes/crmTasks.ts#L320)
**Model:** CrmTask
**Description:** Update a CRM task

---

### Creator Tasks (Exclusive/Creator Portal)

#### 1. GET /api/exclusive/tasks
**File:** [apps/api/src/routes/exclusive.ts](apps/api/src/routes/exclusive.ts#L161)
**Model:** CreatorTask
**Description:** Get creator's tasks (filtered by status and type)
**Query Logic:**
- Status: NOT `completed` or `cancelled`
- Task Types: `creative`, `attendance`, `review`, `approval`
- Ordered by: Priority DESC, Due Date ASC
- Includes: Related Deal (brandName)

#### 2. PATCH /api/exclusive/tasks/:id/complete
**File:** [apps/api/src/routes/exclusive.ts](apps/api/src/routes/exclusive.ts#L175)
**Model:** CreatorTask
**Description:** Mark a creator task as completed
**Updates:**
- `status`: "completed"
- `completedAt`: Current date

---

### Internal Queue Tasks

#### 1. GET /api/queues/internal-tasks
**File:** [apps/api/src/routes/queues.ts](apps/api/src/routes/queues.ts#L443)
**Model:** InternalQueueTask
**Description:** Get pending internal tasks
**Response Includes:**
- `CreatedByUser`: User who created the task
- `AssignedToUser`: User assigned to the task

#### 2. POST /api/queues/internal-tasks
**File:** [apps/api/src/routes/queues.ts](apps/api/src/routes/queues.ts#L492)
**Model:** InternalQueueTask
**Description:** Create an internal task
**Request Body:**
```json
{
  "title": "string (required)",
  "description": "string (optional)",
  "priority": "string (optional)",
  "dueDate": "ISO date (optional)",
  "assignedToUserId": "string (optional)",
  "metadata": "object (optional)"
}
```
**Features:**
- Validates input with schema
- Logs to queue audit trail

#### 3. PATCH /api/queues/internal-tasks/:id
**File:** [apps/api/src/routes/queues.ts](apps/api/src/routes/queues.ts#L562)
**Model:** InternalQueueTask
**Description:** Update an internal task
**Status Handling:**
- `completed`: Sets `completedAt` to current date
- `pending`: Clears `completedAt`

#### 4. DELETE /api/queues/internal-tasks/:id
**File:** [apps/api/src/routes/queues.ts](apps/api/src/routes/queues.ts#L647)
**Model:** InternalQueueTask
**Description:** Delete an internal task

---

## Frontend Components

### Meeting Section - Task Creation

**File:** [apps/web/src/components/AdminTalent/MeetingSection.tsx](apps/web/src/components/AdminTalent/MeetingSection.tsx#L188)

**Component:** `ActionItemRow`
**Features:**
- Shows "Add to Tasks" button for action items
- Only available when:
  - Action item has no `linkedTaskId`
  - Action item status is "open"

**Handler:** `handleAddToTasks`
```typescript
const handleAddToTasks = async (actionItemId: string) => {
  const response = await apiFetch(`/api/action-items/${actionItemId}/add-to-tasks`, {
    method: 'POST'
  });
  // Shows success/error toast
}
```

**Location in UI:**
- Line 409: `<ActionItemsTable>`
- Line 429: `<ActionItemsPendingSection>`

---

### Outreach Section

**File:** [apps/web/src/components/AdminTalent/OutreachSection.tsx](apps/web/src/components/AdminTalent/OutreachSection.tsx#L44)

**Data Type:**
```typescript
OutreachTask?: Array<{ 
  id: string; 
  title: string; 
  status: string; 
  dueDate?: string 
}>;
```

---

## Service Functions

### Task Notifications Service

**File:** [apps/api/src/services/taskNotifications.ts](apps/api/src/services/taskNotifications.ts#L6)

**Function:** `createTaskNotifications`
```typescript
export async function createTaskNotifications(
  task: any, 
  action: "created" | "updated" | "assigned" | "mentioned"
)
```
**Purpose:**
- Creates notifications for mentioned users
- Creates notifications for assigned users
- Called after CrmTask creation

### AI Intelligence Service - Task Queries

**File:** [apps/api/src/services/aiIntelligenceService.ts](apps/api/src/services/aiIntelligenceService.ts)

**CrmTask Operations:**
- Line 133: `findUnique` - Get single task
- Line 276: `findMany` - Get multiple tasks
- Line 368: `findMany` - Get upcoming tasks (with date filters)
- Line 401: `findMany` - Get overdue tasks

### Reminder Engine Service

**File:** [apps/api/src/services/reminderEngineService.ts](apps/api/src/services/reminderEngineService.ts#L81)

**CrmTask Operations:**
- Line 81: `findMany` - Get open tasks
- Line 257: `findUnique` - Get task context for reminders

### Overload Detection Service

**File:** [apps/api/src/services/overloadDetectionService.ts](apps/api/src/services/overloadDetectionService.ts#L105)

**CrmTask Operations:**
- Line 105: `findMany` - Get tasks in date range for workload analysis

---

## Task Listing/Query Logic

### Talent Tasks Query
**Location:** [apps/api/src/routes/admin/talent.ts#L1580](apps/api/src/routes/admin/talent.ts#L1580)
```typescript
const tasks = await prisma.talentTask.findMany({
  where: { talentId: id },
  orderBy: { dueDate: "asc" }
});
```

### Creator Tasks Query
**Location:** [apps/api/src/routes/exclusive.ts#L164](apps/api/src/routes/exclusive.ts#L164)
```typescript
const tasks = await prisma.creatorTask.findMany({
  where: { 
    creatorId: creator.id, 
    status: { notIn: ["completed", "cancelled"] }, 
    taskType: { in: ["creative", "attendance", "review", "approval"] } 
  }, 
  include: { Deal: { select: { brandName: true } } }, 
  orderBy: [{ priority: "desc" }, { dueAt: "asc" }] 
});
```

### CRM Tasks Query
**Location:** [apps/api/src/routes/crmTasks.ts#L75](apps/api/src/routes/crmTasks.ts#L75)
- Supports filtering by: `status`, `priority`, `owner`, `brandId`, `campaignId`
- Applies visibility filtering based on user role
- Includes related entities (Brand, Campaign, Owner, CreatedBy)

### Outreach Tasks Query
**Location:** [apps/api/src/routes/outreach.ts#L397](apps/api/src/routes/outreach.ts#L397)
```typescript
const tasks = await prisma.outreachTask.findMany({
  where: { outreachId: id },
  orderBy: { dueDate: "asc" }
});
```

### Internal Queue Tasks Query
**Location:** [apps/api/src/routes/queues.ts#L443](apps/api/src/routes/queues.ts#L443)
- Filters for: `status: "pending"`
- Includes: CreatedByUser, AssignedToUser

---

## Task Creation Summary Matrix

| Endpoint | Model | Source | Front-End | Activity Log |
|----------|-------|--------|-----------|--------------|
| POST /api/admin/talent/:id/tasks | TalentTask | Admin Talent Page | ❓ | TALENT_TASK_CREATED |
| POST /api/admin/outreach/:id/create-task | OutreachTask | Admin Outreach Page | ❓ | CREATE_OUTREACH_TASK |
| POST /api/outreach/records/:id/tasks | OutreachTask | Outreach Page | ❓ | - |
| POST /api/action-items/:actionItemId/add-to-tasks | TalentTask | Meeting Action Items | ✅ [MeetingSection.tsx](apps/web/src/components/AdminTalent/MeetingSection.tsx#L188) | - |
| POST /api/crm-tasks | CrmTask | CRM Interface | ❓ | - |
| POST /api/queues/internal-tasks | InternalQueueTask | Internal Queue | ❓ | - |

---

## Key Findings

### 1. **Multiple Task Systems Coexist**
- Different contexts use different task models
- Some separation of concerns (Talent vs Creator vs CRM tasks)
- Potential for data inconsistency across systems

### 2. **Frontend Components**
- Limited task creation UI found in codebase
- Main UI for task creation is in Meeting section (action items → tasks)
- Need to search for hidden components or generated UI

### 3. **Activity Logging**
- TalentTask operations are logged to admin activity
- OutreachTask operations are logged
- CRM and Creator tasks may not be fully logged

### 4. **Calendar Sync**
- CrmTask creation attempts to sync to calendar
- Other task types don't explicitly sync

### 5. **Notification System**
- CrmTask mentions and assignments trigger notifications
- Other task models may not have notification support

---

## Notes for Developers

1. **Search for remaining frontend components:**
   - Apps web pages for Deal creation interface
   - Apps web pages for Outreach interface
   - Apps web pages for CRM task creation modal

2. **Query optimization:** Some task queries could benefit from caching

3. **Consistency:** Consider standardizing task creation across different models

4. **Testing:** Ensure all task creation endpoints handle edge cases properly
