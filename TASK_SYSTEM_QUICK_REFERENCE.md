# Task System Quick Reference Guide

## Find What You Need Fast

### Search by Task Model

#### **TalentTask** - Talent Management Tasks
Used for: Managing individual talent/creator tasks
- **Create:** `POST /api/admin/talent/:id/tasks` [admin/talent.ts#L1531](apps/api/src/routes/admin/talent.ts#L1531)
- **Read:** `GET /api/admin/talent/:id/tasks` [admin/talent.ts#L1576](apps/api/src/routes/admin/talent.ts#L1576)
- **Update:** `PATCH /api/admin/talent/tasks/:taskId` [admin/talent.ts#L1596](apps/api/src/routes/admin/talent.ts#L1596)
- **Delete:** `DELETE /api/admin/talent/tasks/:taskId` [admin/talent.ts#L1635](apps/api/src/routes/admin/talent.ts#L1635)
- **Also Created From:** Meeting action items → [admin/meetings.ts#L406](apps/api/src/routes/admin/meetings.ts#L406)
- **Status Values:** PENDING, IN_PROGRESS, COMPLETED, CANCELLED
- **Activity Logs:** TALENT_TASK_CREATED, TALENT_TASK_UPDATED, TALENT_TASK_DELETED

---

#### **CreatorTask** - Deal/Campaign Tasks for Creators
Used for: Tasks assigned to creators for creative work, attendance, reviews
- **Read Pending:** `GET /api/exclusive/tasks` [exclusive.ts#L161](apps/api/src/routes/exclusive.ts#L161)
  - Filters: Status NOT IN [completed, cancelled]
  - Task types: creative, attendance, review, approval
  - Ordered by: Priority DESC, DueDate ASC
- **Complete:** `PATCH /api/exclusive/tasks/:id/complete` [exclusive.ts#L175](apps/api/src/routes/exclusive.ts#L175)
- **Status Values:** pending, in_progress, completed, cancelled
- **Task Types:** creative, attendance, review, approval
- **Note:** Created via deal workflow (not found in search results - likely generated)

---

#### **CrmTask** - Enterprise CRM Tasks
Used for: Central task management linked to brands, campaigns, deals, events, contracts
- **Create:** `POST /api/crm-tasks` [crmTasks.ts#L150](apps/api/src/routes/crmTasks.ts#L150)
  - Supports relations to: brands, campaigns, deals, events, contracts, creators, users
  - Auto-syncs to calendar if dueDate set
  - Creates notifications for mentions and assignments
- **List:** `GET /api/crm-tasks` [crmTasks.ts#L75](apps/api/src/routes/crmTasks.ts#L75)
  - Filter by: status, priority, owner, brandId, campaignId
  - Visibility filtering based on user role
- **Get Single:** `GET /api/crm-tasks/:id` [crmTasks.ts#L131](apps/api/src/routes/crmTasks.ts#L131)
  - Permission checking enforced
- **Update:** `PATCH /api/crm-tasks/:id` [crmTasks.ts#L320](apps/api/src/routes/crmTasks.ts#L320)
- **Get Users:** `GET /api/crm-tasks/users` [crmTasks.ts#L14](apps/api/src/routes/crmTasks.ts#L14)
  - Returns active users for @mentions
- **Get Talents:** `GET /api/crm-tasks/talents` [crmTasks.ts#L43](apps/api/src/routes/crmTasks.ts#L43)
  - Returns talents for task relations
- **Status Values:** Pending, In Progress, Completed, Cancelled
- **Priority Values:** Low, Medium, High, Urgent
- **Special Features:**
  - Calendar sync (if dueDate)
  - Task notifications (mentions, assignments)
  - Multiple entity relations

---

#### **OutreachTask** - Outreach Record Tasks
Used for: Tasks tracking follow-ups on outreach records
- **Create (v1):** `POST /api/admin/outreach/:id/create-task` [admin/outreach.ts#L541](apps/api/src/routes/admin/outreach.ts#L541)
  - Activity Log: CREATE_OUTREACH_TASK
- **Create (v2):** `POST /api/outreach/records/:id/tasks` [outreach.ts#L367](apps/api/src/routes/outreach.ts#L367)
  - Alternative endpoint, same result
- **List:** `GET /api/outreach/records/:id/tasks` [outreach.ts#L397](apps/api/src/routes/outreach.ts#L397)
  - Ordered by dueDate ASC
- **Update:** `PATCH /api/outreach/tasks/:taskId` [outreach.ts#L412](apps/api/src/routes/outreach.ts#L412)
- **Status Values:** Open, In Progress, Completed, Closed
- **Priority Values:** Low, Medium, High, Urgent

---

#### **InternalQueueTask** - Internal Team Tasks
Used for: Internal operations and team management
- **List Pending:** `GET /api/queues/internal-tasks` [queues.ts#L443](apps/api/src/routes/queues.ts#L443)
  - Filter: status = "pending"
  - Includes: CreatedByUser, AssignedToUser
- **Create:** `POST /api/queues/internal-tasks` [queues.ts#L492](apps/api/src/routes/queues.ts#L492)
  - Validates via schema
  - Activity Log: INTERNAL_TASK_CREATED
- **Update:** `PATCH /api/queues/internal-tasks/:id` [queues.ts#L562](apps/api/src/routes/queues.ts#L562)
  - If status="completed": sets completedAt
  - If status="pending": clears completedAt
  - Activity Log: INTERNAL_TASK_UPDATED
- **Delete:** `DELETE /api/queues/internal-tasks/:id` [queues.ts#L647](apps/api/src/routes/queues.ts#L647)
  - Activity Log: INTERNAL_TASK_DELETED
- **Status Values:** pending, completed, cancelled

---

## Search by Feature

### 📋 List/Get Tasks
| Task Type | Endpoint | File | Query Logic |
|-----------|----------|------|------------|
| TalentTask | `GET /api/admin/talent/:id/tasks` | [admin/talent.ts#L1576](apps/api/src/routes/admin/talent.ts#L1576) | By talentId, orderBy dueDate ASC |
| CreatorTask | `GET /api/exclusive/tasks` | [exclusive.ts#L161](apps/api/src/routes/exclusive.ts#L161) | Status NOT completed/cancelled, specific taskTypes, orderBy priority DESC + dueAt ASC |
| CrmTask | `GET /api/crm-tasks` | [crmTasks.ts#L75](apps/api/src/routes/crmTasks.ts#L75) | Supports filters: status, priority, owner, brandId, campaignId + visibility filtering |
| OutreachTask | `GET /api/outreach/records/:id/tasks` | [outreach.ts#L397](apps/api/src/routes/outreach.ts#L397) | By outreachId, orderBy dueDate ASC |
| InternalQueueTask | `GET /api/queues/internal-tasks` | [queues.ts#L443](apps/api/src/routes/queues.ts#L443) | Status = pending |

### ➕ Create Tasks
| Task Type | Endpoint | File | Notes |
|-----------|----------|------|-------|
| TalentTask | `POST /api/admin/talent/:id/tasks` | [admin/talent.ts#L1531](apps/api/src/routes/admin/talent.ts#L1531) | Direct creation from Talent page |
| TalentTask | `POST /api/action-items/:actionItemId/add-to-tasks` | [admin/meetings.ts#L406](apps/api/src/routes/admin/meetings.ts#L406) | From meeting action items |
| CreatorTask | (via Deal workflow) | - | Not exposed as direct API |
| CrmTask | `POST /api/crm-tasks` | [crmTasks.ts#L150](apps/api/src/routes/crmTasks.ts#L150) | Supports multiple relations, calendar sync, notifications |
| OutreachTask | `POST /api/admin/outreach/:id/create-task` | [admin/outreach.ts#L541](apps/api/src/routes/admin/outreach.ts#L541) | Alternative: POST /api/outreach/records/:id/tasks [outreach.ts#L367](apps/api/src/routes/outreach.ts#L367) |
| InternalQueueTask | `POST /api/queues/internal-tasks` | [queues.ts#L492](apps/api/src/routes/queues.ts#L492) | Schema validated |

### ✏️ Update Tasks
| Task Type | Endpoint | File |
|-----------|----------|------|
| TalentTask | `PATCH /api/admin/talent/tasks/:taskId` | [admin/talent.ts#L1596](apps/api/src/routes/admin/talent.ts#L1596) |
| CreatorTask | `PATCH /api/exclusive/tasks/:id/complete` | [exclusive.ts#L175](apps/api/src/routes/exclusive.ts#L175) |
| CrmTask | `PATCH /api/crm-tasks/:id` | [crmTasks.ts#L320](apps/api/src/routes/crmTasks.ts#L320) |
| OutreachTask | `PATCH /api/outreach/tasks/:taskId` | [outreach.ts#L412](apps/api/src/routes/outreach.ts#L412) |
| InternalQueueTask | `PATCH /api/queues/internal-tasks/:id` | [queues.ts#L562](apps/api/src/routes/queues.ts#L562) |

### 🗑️ Delete Tasks
| Task Type | Endpoint | File |
|-----------|----------|------|
| TalentTask | `DELETE /api/admin/talent/tasks/:taskId` | [admin/talent.ts#L1635](apps/api/src/routes/admin/talent.ts#L1635) |
| CrmTask | `DELETE /api/crm-tasks/:id` | [crmTasks.ts](apps/api/src/routes/crmTasks.ts) (search for DELETE) |
| InternalQueueTask | `DELETE /api/queues/internal-tasks/:id` | [queues.ts#L647](apps/api/src/routes/queues.ts#L647) |

### 🔔 Notifications & Logging
| Feature | Model | Implementation | File |
|---------|-------|-----------------|------|
| Task Notifications | CrmTask | createTaskNotifications() | [taskNotifications.ts#L6](apps/api/src/services/taskNotifications.ts#L6) |
| Activity Logging | TalentTask | logAdminActivity() | [admin/talent.ts](apps/api/src/routes/admin/talent.ts) |
| Activity Logging | OutreachTask | logAdminActivity() | [admin/outreach.ts](apps/api/src/routes/admin/outreach.ts) |
| Activity Logging | InternalQueueTask | logQueueAudit() | [queues.ts](apps/api/src/routes/queues.ts) |
| Calendar Sync | CrmTask | syncTaskToCalendar() | [crmTasks.ts#L240](apps/api/src/routes/crmTasks.ts#L240) |

---

## Search by Page/Context

### Talent Page
**File Location:** [apps/web/src/components/AdminTalent/*.tsx](apps/web/src/components/AdminTalent/)

**Task Features:**
- View TalentTasks: `GET /api/admin/talent/:id/tasks`
- Create TalentTask: `POST /api/admin/talent/:id/tasks`
- Meeting action items: [MeetingSection.tsx](apps/web/src/components/AdminTalent/MeetingSection.tsx#L188)
  - Convert to tasks: `POST /api/action-items/:actionItemId/add-to-tasks`
- Outreach information: [OutreachSection.tsx](apps/web/src/components/AdminTalent/OutreachSection.tsx#L44)

**Backend Files:**
- Talent routes: [apps/api/src/routes/admin/talent.ts](apps/api/src/routes/admin/talent.ts)
- Meetings routes: [apps/api/src/routes/admin/meetings.ts](apps/api/src/routes/admin/meetings.ts)
- Outreach routes: [apps/api/src/routes/admin/outreach.ts](apps/api/src/routes/admin/outreach.ts)

### Outreach Page
**API Endpoints:**
- Create task: `POST /api/outreach/records/:id/tasks` [outreach.ts#L367](apps/api/src/routes/outreach.ts#L367)
- List tasks: `GET /api/outreach/records/:id/tasks` [outreach.ts#L397](apps/api/src/routes/outreach.ts#L397)
- Update task: `PATCH /api/outreach/tasks/:taskId` [outreach.ts#L412](apps/api/src/routes/outreach.ts#L412)

**Admin Endpoints:**
- Create task: `POST /api/admin/outreach/:id/create-task` [admin/outreach.ts#L541](apps/api/src/routes/admin/outreach.ts#L541)

### Creator/Exclusive Portal
**File Location:** [apps/api/src/routes/exclusive.ts](apps/api/src/routes/exclusive.ts)

**Task Features:**
- List tasks: `GET /api/exclusive/tasks` [exclusive.ts#L161](apps/api/src/routes/exclusive.ts#L161)
- Complete task: `PATCH /api/exclusive/tasks/:id/complete` [exclusive.ts#L175](apps/api/src/routes/exclusive.ts#L175)

**Task Types Shown:**
- creative
- attendance
- review
- approval

### CRM Interface
**File Location:** [apps/api/src/routes/crmTasks.ts](apps/api/src/routes/crmTasks.ts)

**Task Features:**
- List tasks: `GET /api/crm-tasks` (with filtering)
- Get single: `GET /api/crm-tasks/:id`
- Create: `POST /api/crm-tasks`
- Update: `PATCH /api/crm-tasks/:id`
- Delete: `DELETE /api/crm-tasks/:id`
- Get users: `GET /api/crm-tasks/users`
- Get talents: `GET /api/crm-tasks/talents`

**Related Entities:**
- Brands
- Campaigns
- Deals
- Events
- Contracts
- Creators
- Users

### Internal Queue/Operations
**File Location:** [apps/api/src/routes/queues.ts](apps/api/src/routes/queues.ts)

**Task Features:**
- List pending: `GET /api/queues/internal-tasks` [queues.ts#L443](apps/api/src/routes/queues.ts#L443)
- Create: `POST /api/queues/internal-tasks` [queues.ts#L492](apps/api/src/routes/queues.ts#L492)
- Update: `PATCH /api/queues/internal-tasks/:id` [queues.ts#L562](apps/api/src/routes/queues.ts#L562)
- Delete: `DELETE /api/queues/internal-tasks/:id` [queues.ts#L647](apps/api/src/routes/queues.ts#L647)

---

## Service Functions

### Task-Related Services
| Service | Function | File | Purpose |
|---------|----------|------|---------|
| taskNotifications | createTaskNotifications() | [taskNotifications.ts#L6](apps/api/src/services/taskNotifications.ts#L6) | Create notifications for mentions/assignments |
| aiIntelligenceService | (multiple) | [aiIntelligenceService.ts](apps/api/src/services/aiIntelligenceService.ts) | Query CrmTasks for AI insights |
| reminderEngineService | (multiple) | [reminderEngineService.ts](apps/api/src/services/reminderEngineService.ts) | Find tasks for reminders |
| overloadDetectionService | (multiple) | [overloadDetectionService.ts](apps/api/src/services/overloadDetectionService.ts) | Analyze task workload |
| calendarService | syncTaskToCalendar() | [calendarService.ts](apps/api/src/services/calendarService.ts) | Sync CrmTask to calendar |

### CrmTask Queries in Services
- **aiIntelligenceService.ts:**
  - findUnique: [line 133](apps/api/src/services/aiIntelligenceService.ts#L133)
  - findMany: [line 276](apps/api/src/services/aiIntelligenceService.ts#L276)
  - findMany (upcoming): [line 368](apps/api/src/services/aiIntelligenceService.ts#L368)
  - findMany (overdue): [line 401](apps/api/src/services/aiIntelligenceService.ts#L401)

- **reminderEngineService.ts:**
  - findMany (open): [line 81](apps/api/src/services/reminderEngineService.ts#L81)
  - findUnique (context): [line 257](apps/api/src/services/reminderEngineService.ts#L257)

- **overloadDetectionService.ts:**
  - findMany (date range): [line 105](apps/api/src/services/overloadDetectionService.ts#L105)

---

## Frontend Components (Located)

### Task-Related UI
| Component | File | Purpose |
|-----------|------|---------|
| ActionItemRow | [MeetingSection.tsx#L592](apps/web/src/components/AdminTalent/MeetingSection.tsx#L592) | Shows action item with "Add to Tasks" button |
| handleAddToTasks | [MeetingSection.tsx#L188](apps/web/src/components/AdminTalent/MeetingSection.tsx#L188) | Converts action item to task |
| MeetingSection | [MeetingSection.tsx](apps/web/src/components/AdminTalent/MeetingSection.tsx) | Talent meeting management |
| OutreachSection | [OutreachSection.tsx](apps/web/src/components/AdminTalent/OutreachSection.tsx) | Talent outreach info (includes OutreachTask type) |

---

## Common Patterns

### Creating a Task
**Pattern 1: Direct API Call**
```
POST /api/{model}/tasks
{
  title: string,
  dueDate?: date,
  [model-specific fields]
}
→ Returns created task object
```

**Pattern 2: From Another Entity**
```
POST /api/entity/:id/add-to-tasks (or similar)
→ Links entities
→ Creates new task
→ Returns both entities
```

### Updating Task Status
**Pattern: PUT/PATCH endpoint**
```
PATCH /api/{model}/tasks/:id
{
  status: "new_status",
  completedAt?: (if completing)
}
→ Returns updated task
```

### Listing Tasks
**Pattern: Filtered GET with includes**
```
GET /api/{model}/tasks?status=pending&priority=high
→ Returns filtered array
→ May include related entities
```

---

## Troubleshooting

### Which Task Model Should I Use?
1. **TalentTask** - For individual talent/creator management
2. **CreatorTask** - For deal-related work assigned to creators
3. **CrmTask** - For enterprise-level multi-entity task tracking
4. **OutreachTask** - For outreach follow-up tracking
5. **InternalQueueTask** - For internal team operations

### Where's the Frontend for [Feature]?
**Status:** Limited frontend components found in codebase
- Meeting action items: [MeetingSection.tsx](apps/web/src/components/AdminTalent/MeetingSection.tsx) ✅
- Talent tasks: Search for pages/components not in git or dynamically generated
- CRM tasks: Likely in separate admin section
- Creator tasks: In exclusive portal (not deeply inspected)
- Outreach tasks: In outreach management section

### Which Endpoints Have Activity Logging?
- ✅ TalentTask (all CRUD)
- ✅ OutreachTask (create)
- ✅ InternalQueueTask (all CRUD)
- ❓ CreatorTask (need to verify)
- ❓ CrmTask (need to verify)

### Which Endpoints Support Calendar Sync?
- ✅ CrmTask (auto-syncs if dueDate)
- ❌ All others (not implemented)

### Which Endpoints Create Notifications?
- ✅ CrmTask (mentions, assignments)
- ❌ All others (not implemented)

