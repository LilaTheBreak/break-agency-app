# Task Lifecycle Breakdown by Context

## 1. TALENT MANAGEMENT TASK LIFECYCLE (TalentTask)

### Flow Diagram
```
┌─────────────────────────────────────────┐
│ Talent Detail Page (Admin Interface)    │
│ /api/admin/talent/:talentId             │
└──────────────────┬──────────────────────┘
                   │
                   ├─→ Create Task
                   │   POST /api/admin/talent/:id/tasks
                   │   ├─ Request: { title, notes, dueDate, status }
                   │   ├─ Creates: TalentTask
                   │   ├─ Log: TALENT_TASK_CREATED
                   │   └─ Response: Created task object
                   │
                   ├─→ View Tasks
                   │   GET /api/admin/talent/:id/tasks
                   │   ├─ Returns: TalentTask[]
                   │   └─ Ordered: By dueDate ASC
                   │
                   ├─→ Update Task
                   │   PATCH /api/admin/talent/tasks/:taskId
                   │   ├─ Fields: title, notes, dueDate, status, completedAt
                   │   ├─ Log: TALENT_TASK_UPDATED
                   │   └─ Response: Updated task object
                   │
                   └─→ Delete Task
                       DELETE /api/admin/talent/tasks/:taskId
                       ├─ Log: TALENT_TASK_DELETED
                       └─ Response: { success: true }
```

### Task Fields
- `id`: String (UUID)
- `talentId`: String (FK to Talent)
- `title`: String (required)
- `notes`: String | null
- `dueDate`: DateTime | null
- `status`: String (PENDING, IN_PROGRESS, COMPLETED, CANCELLED)
- `createdBy`: String (FK to User)
- `completedAt`: DateTime | null
- `createdAt`: DateTime
- `updatedAt`: DateTime

### Status Lifecycle
```
PENDING → IN_PROGRESS → COMPLETED
   ↓
CANCELLED (from any state)
```

---

## 2. CREATOR TASK LIFECYCLE (CreatorTask)

### Flow Diagram
```
┌────────────────────────────────────┐
│ Creator Portal (Exclusive)         │
│ /exclusive/tasks                   │
└──────────────────┬─────────────────┘
                   │
                   ├─→ View My Tasks
                   │   GET /api/exclusive/tasks
                   │   ├─ Filter: status NOT IN [completed, cancelled]
                   │   ├─ Filter: taskType IN [creative, attendance, review, approval]
                   │   ├─ Include: Related Deal (brandName)
                   │   ├─ Order: By priority DESC, dueAt ASC
                   │   └─ Returns: CreatorTask[]
                   │
                   └─→ Complete Task
                       PATCH /api/exclusive/tasks/:id/complete
                       ├─ Sets: status = "completed"
                       ├─ Sets: completedAt = now()
                       └─ Response: Updated task object
```

### Task Fields
- `id`: String (UUID)
- `creatorId`: String (FK to Creator)
- `dealId`: String (FK to Deal)
- `title`: String
- `description`: String | null
- `taskType`: String (creative, attendance, review, approval)
- `status`: String (pending, in_progress, completed, cancelled)
- `priority`: String (Low, Medium, High, Urgent)
- `dueAt`: DateTime | null
- `completedAt`: DateTime | null
- `Deal`: Relation (includes brandName)

### Task Type Meanings
- **creative**: Content creation task
- **attendance**: Event/meeting attendance
- **review**: Content/work review
- **approval**: Approval of deliverable

### Status Lifecycle
```
pending → in_progress → completed
   ↓
cancelled (from any state)
```

---

## 3. OUTREACH RECORD TASK LIFECYCLE (OutreachTask)

### Flow Diagram
```
┌──────────────────────────────────────────┐
│ Outreach Record Detail                   │
│ (Admin Interface)                        │
└──────────────┬───────────────────────────┘
               │
               ├─→ Create Task (Method 1)
               │   POST /api/admin/outreach/:id/create-task
               │   ├─ Request: { title, dueDate, priority, owner }
               │   ├─ Creates: OutreachTask
               │   ├─ Log: CREATE_OUTREACH_TASK
               │   └─ Response: { task: OutreachTask }
               │
               ├─→ Create Task (Method 2)
               │   POST /api/outreach/records/:id/tasks
               │   ├─ Request: { title, dueDate, owner, priority }
               │   ├─ Creates: OutreachTask
               │   └─ Response: { task: OutreachTask }
               │
               ├─→ View Tasks
               │   GET /api/outreach/records/:id/tasks
               │   ├─ Filter: Where outreachId = :id
               │   ├─ Order: By dueDate ASC
               │   └─ Response: { tasks: OutreachTask[] }
               │
               └─→ Update Task
                   PATCH /api/outreach/tasks/:taskId
                   ├─ Fields: All task fields
                   └─ Response: { task: OutreachTask }
```

### Task Fields
- `id`: String (custom format: task_${timestamp}_${random})
- `outreachId`: String (FK to Outreach)
- `title`: String
- `dueDate`: DateTime | null
- `priority`: String (Low, Medium, High, Urgent)
- `owner`: String (email or user reference)
- `status`: String (Open, In Progress, Completed, Closed)
- `createdAt`: DateTime
- `updatedAt`: DateTime

### Status Values
```
Open → In Progress → Completed → Closed
                 ↓
            (can be Closed at any point)
```

---

## 4. MEETING ACTION ITEM → TASK CONVERSION (TalentTask)

### Flow Diagram
```
┌─────────────────────────────────────────┐
│ Meeting Section (Admin Talent Page)     │
│ /api/action-items/:actionItemId/...     │
└──────────────────┬──────────────────────┘
                   │
                   └─→ Add Action Item to Tasks
                       POST /api/action-items/:actionItemId/add-to-tasks
                       ├─ Validation:
                       │  ├─ Action item must exist
                       │  ├─ Must not already have linkedTaskId
                       │  └─ Status must be "open"
                       │
                       ├─ Actions:
                       │  ├─ Create TalentTask:
                       │  │  ├─ title: from actionItem.title
                       │  │  ├─ notes: "From meeting action item: {description}"
                       │  │  ├─ dueDate: from actionItem.dueDate
                       │  │  └─ talentId: from actionItem.talentId
                       │  │
                       │  ├─ Link MeetingActionItem:
                       │  │  └─ linkedTaskId: <new task ID>
                       │  │
                       │  └─ Log: (activity not explicitly shown)
                       │
                       └─ Response:
                           {
                             "actionItem": updated MeetingActionItem,
                             "task": created TalentTask
                           }
```

### Conversion Logic
**Source:** MeetingActionItem
```typescript
{
  id: string,
  talentId: string,
  title: string,
  description: string,
  dueDate: DateTime | null,
  linkedTaskId: string | null,
  status: "open" | "completed",
  ...
}
```

**Target:** TalentTask
```typescript
{
  talentId: actionItem.talentId,
  title: actionItem.title,
  notes: `From meeting action item: ${actionItem.description || ""}`,
  dueDate: actionItem.dueDate,
  createdBy: req.user.id,
  status: "PENDING"
}
```

### UI Constraints
- Button appears only when:
  - `linkedTaskId` is null/undefined
  - `status` === "open"
- Button text: "Add to Tasks"
- Location in UI: ActionItemRow component

---

## 5. CRM TASK LIFECYCLE (CrmTask)

### Flow Diagram
```
┌────────────────────────────────────┐
│ CRM Interface / Task Management    │
│ /api/crm-tasks/...                 │
└──────────────┬─────────────────────┘
               │
               ├─→ Get Users for Mentions/Assignments
               │   GET /api/crm-tasks/users
               │   ├─ Filter: Active users only
               │   └─ Returns: User[] with email, name, avatar
               │
               ├─→ Get Talents for Relations
               │   GET /api/crm-tasks/talents
               │   └─ Returns: Talent[] with user info
               │
               ├─→ List All Tasks
               │   GET /api/crm-tasks
               │   ├─ Filters:
               │   │  ├─ status (optional)
               │   │  ├─ priority (optional)
               │   │  ├─ owner (optional)
               │   │  ├─ brandId (optional)
               │   │  └─ campaignId (optional)
               │   │
               │   ├─ Visibility: Based on user role
               │   ├─ Include: Related Brand, Campaign, Owner, CreatedBy
               │   └─ Returns: CrmTask[]
               │
               ├─→ Get Single Task
               │   GET /api/crm-tasks/:id
               │   ├─ Permission check: Based on user role
               │   └─ Returns: CrmTask
               │
               ├─→ Create Task
               │   POST /api/crm-tasks
               │   ├─ Request: {
               │   │   title (required),
               │   │   description,
               │   │   status (default: Pending),
               │   │   priority (default: Medium),
               │   │   dueDate,
               │   │   owner,
               │   │   ownerId,
               │   │   assignedUserIds[],
               │   │   mentions[],
               │   │   relatedBrands[],
               │   │   relatedCreators[],
               │   │   relatedUsers[],
               │   │   relatedDeals[],
               │   │   relatedCampaigns[],
               │   │   relatedEvents[],
               │   │   relatedContracts[],
               │   │   brandId,
               │   │   dealId,
               │   │   campaignId,
               │   │   eventId,
               │   │   contractId
               │   │ }
               │   │
               │   ├─ Actions:
               │   │  ├─ Create CrmTask
               │   │  ├─ Create notifications for mentions/assignments
               │   │  ├─ Attempt calendar sync if dueDate exists
               │   │  └─ Log calendar sync result (if applicable)
               │   │
               │   ├─ Error Handling:
               │   │  ├─ P2003: Invalid reference (entity doesn't exist)
               │   │  └─ Other DB errors
               │   │
               │   └─ Returns: CrmTask with relations
               │
               └─→ Update Task
                   PATCH /api/crm-tasks/:id
                   ├─ Fields: Same as creation (all optional)
                   └─ Returns: Updated CrmTask
```

### Task Fields
- `id`: String (CUID)
- `title`: String (required)
- `description`: String | null
- `status`: String (Pending, In Progress, Completed, Cancelled)
- `priority`: String (Low, Medium, High, Urgent)
- `dueDate`: DateTime | null
- `completedAt`: DateTime | null
- `owner`: String | null
- `ownerId`: String | null (FK to User)
- `assignedUserIds`: String[]
- `mentions`: String[] (JSON array of user IDs)
- `relatedBrands`: String[]
- `relatedCreators`: String[]
- `relatedUsers`: String[]
- `relatedDeals`: String[]
- `relatedCampaigns`: String[]
- `relatedEvents`: String[]
- `relatedContracts`: String[]
- `brandId`: String | null (FK)
- `campaignId`: String | null (FK)
- `dealId`: String | null (FK)
- `eventId`: String | null (FK)
- `contractId`: String | null (FK)
- `createdBy`: String | null (FK to User)
- `createdAt`: DateTime
- `updatedAt`: DateTime

### Related Entities
- **Brand:** CrmBrand (brandName, id)
- **Campaign:** CrmCampaign (campaignName, id)
- **Owner:** User (email, name, id)
- **CreatedBy:** User (email, name, id)

### Status Lifecycle
```
Pending → In Progress → Completed
   ↓
Cancelled (from any state)
```

### Special Features
1. **Calendar Sync:** If `dueDate` is set, task is synced to user's calendar
2. **Notifications:** Created for:
   - Users in `mentions` array
   - Users in `assignedUserIds` array
3. **Visibility Control:** Tasks filtered based on user role

---

## 6. INTERNAL QUEUE TASK LIFECYCLE (InternalQueueTask)

### Flow Diagram
```
┌────────────────────────────────────┐
│ Internal Queue Management          │
│ /api/queues/internal-tasks/...     │
└──────────────┬─────────────────────┘
               │
               ├─→ Get Pending Tasks
               │   GET /api/queues/internal-tasks
               │   ├─ Filter: status = "pending"
               │   ├─ Include: CreatedByUser, AssignedToUser
               │   └─ Returns: InternalQueueTask[]
               │
               ├─→ Create Task
               │   POST /api/queues/internal-tasks
               │   ├─ Validation: Via schema (title, description, etc.)
               │   ├─ Creates: InternalQueueTask
               │   ├─ Log: INTERNAL_TASK_CREATED
               │   └─ Response: { success: true, task: InternalQueueTask }
               │
               ├─→ Update Task
               │   PATCH /api/queues/internal-tasks/:id
               │   ├─ Fields: title, description, priority, dueDate, assignedToUserId, status, metadata
               │   ├─ Special:
               │   │  ├─ If status = "completed": sets completedAt = now()
               │   │  └─ If status = "pending": clears completedAt
               │   │
               │   ├─ Log: INTERNAL_TASK_UPDATED
               │   └─ Response: { success: true, task: InternalQueueTask }
               │
               └─→ Delete Task
                   DELETE /api/queues/internal-tasks/:id
                   ├─ Log: INTERNAL_TASK_DELETED
                   └─ Response: { success: true }
```

### Task Fields
- `id`: String (UUID)
- `title`: String (required)
- `description`: String | null
- `priority`: String
- `dueDate`: DateTime | null
- `assignedToUserId`: String | null (FK to User)
- `createdByUserId`: String (FK to User)
- `status`: String (pending, completed, cancelled)
- `completedAt`: DateTime | null
- `metadata`: JSON object
- `createdAt`: DateTime
- `updatedAt`: DateTime

### Audit Logging
- **Action:** INTERNAL_TASK_CREATED
  - Logs: title, priority, assignedTo
- **Action:** INTERNAL_TASK_UPDATED
  - Logs: changes made
- **Action:** INTERNAL_TASK_DELETED
  - Logs: deletion

---

## Summary: Task Model Comparison

| Aspect | TalentTask | CreatorTask | CrmTask | OutreachTask | InternalQueueTask |
|--------|-----------|-----------|---------|--------------|------------------|
| **Primary Context** | Talent management | Deal/creator portal | Enterprise CRM | Outreach records | Internal ops |
| **Parent Entity** | Talent | Creator | Multiple relations | Outreach | - |
| **Status Options** | PENDING, IN_PROGRESS, COMPLETED, CANCELLED | pending, in_progress, completed, cancelled | Pending, In Progress, Completed, Cancelled | Open, In Progress, Completed, Closed | pending, completed, cancelled |
| **Priority Levels** | Not tracked | Low, Medium, High, Urgent | Low, Medium, High, Urgent | Low, Medium, High, Urgent | Not standardized |
| **Calendar Sync** | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Notifications** | ❌ | ❌ | ✅ (mentions, assignments) | ❌ | ❌ |
| **Activity Logging** | ✅ (create, update, delete) | ❌ | ❌ | ✅ (create) | ✅ (create, update, delete) |
| **API Endpoints** | 4 (CRUD) | 2 (list, complete) | 4 (CRUD) | 4 (CRUD) | 4 (CRUD) |

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────┐
│           TASK CREATION ENTRY POINTS                │
└──────────────────┬──────────────────────────────────┘
                   │
        ┌──────────┼──────────┬──────────┬────────────┐
        │          │          │          │            │
        ▼          ▼          ▼          ▼            ▼
    Talent     Creator     Outreach  Meeting      CRM/Queue
    Detail     Portal      Record    Action       Interface
    Page       Page        Page      Items
    │          │          │         │             │
    ▼          ▼          ▼         ▼             ▼
    POST       (created   POST      POST          POST
    /api/      by deal    /api/     /api/         /api/
    admin/     workflow)  outreach  action-       crm-
    talent/    CreatorTask           items/       tasks
    :id/                  OutreachTask add-to-tasks  (or)
    tasks                            CrmTask    /api/
    │          │          │         │          queues/
    ▼          ▼          ▼         ▼          internal-
    TalentTask CreatorTask OutreachTask  TalentTask tasks
                                         │           │
                                         ▼           ▼
                                    (linked)    InternalQueueTask
                                    to action
                                    item
```

