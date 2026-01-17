# Task System Technical Implementation Guide

## Core Database Models

### TalentTask Schema
```prisma
model TalentTask {
  id        String   @id @default(cuid())
  talentId  String   @db.VarChar(255)
  title     String   @db.VarChar(255)
  notes     String?  @db.Text
  dueDate   DateTime?
  status    String   @default("PENDING")  // PENDING, IN_PROGRESS, COMPLETED, CANCELLED
  createdBy String?  @db.VarChar(255)
  completedAt DateTime?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  Talent    Talent @relation(fields: [talentId], references: [id])
}
```

### CreatorTask Schema
```prisma
model CreatorTask {
  id        String   @id @default(cuid())
  creatorId String   @db.VarChar(255)
  dealId    String?  @db.VarChar(255)
  title     String   @db.VarChar(255)
  description String? @db.Text
  taskType  String   @db.VarChar(50)  // creative, attendance, review, approval
  status    String   @default("pending")  // pending, in_progress, completed, cancelled
  priority  String   @default("Medium")
  dueAt     DateTime?
  completedAt DateTime?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  Creator   Creator   @relation(fields: [creatorId], references: [id])
  Deal      Deal?     @relation(fields: [dealId], references: [id])
}
```

### CrmTask Schema
```prisma
model CrmTask {
  id                 String   @id  // CUID
  title              String   @db.VarChar(255)
  description        String?  @db.Text
  status             String   @default("Pending")  // Pending, In Progress, Completed, Cancelled
  priority           String   @default("Medium")   // Low, Medium, High, Urgent
  dueDate            DateTime?
  completedAt        DateTime?
  owner              String?  @db.VarChar(255)
  ownerId            String?  @db.VarChar(255)
  assignedUserIds    String[]  // JSON array
  mentions           String[]  // JSON array of user IDs
  relatedBrands      String[]  // JSON array
  relatedCreators    String[]  // JSON array
  relatedUsers       String[]  // JSON array
  relatedDeals       String[]  // JSON array
  relatedCampaigns   String[]  // JSON array
  relatedEvents      String[]  // JSON array
  relatedContracts   String[]  // JSON array
  brandId            String?  @db.VarChar(255)
  campaignId         String?  @db.VarChar(255)
  dealId             String?  @db.VarChar(255)
  eventId            String?  @db.VarChar(255)
  contractId         String?  @db.VarChar(255)
  createdBy          String?  @db.VarChar(255)
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  // Relations
  CrmBrand          CrmBrand?     @relation(fields: [brandId], references: [id])
  CrmCampaign       CrmCampaign?  @relation(fields: [campaignId], references: [id])
  Owner             User?         @relation("TaskOwner", fields: [ownerId], references: [id])
  CreatedByUser     User?         @relation("TaskCreator", fields: [createdBy], references: [id])
}
```

### OutreachTask Schema
```prisma
model OutreachTask {
  id          String   @id  // task_${timestamp}_${random}
  outreachId  String   @db.VarChar(255)
  title       String   @db.VarChar(255)
  dueDate     DateTime?
  priority    String   @default("Medium")  // Low, Medium, High, Urgent
  owner       String?  @db.VarChar(255)    // email or user reference
  status      String   @default("Open")    // Open, In Progress, Completed, Closed
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  Outreach    Outreach @relation(fields: [outreachId], references: [id])
}
```

### InternalQueueTask Schema
```prisma
model InternalQueueTask {
  id                String   @id @default(uuid())
  title             String   @db.VarChar(255)
  description       String?  @db.Text
  priority          String   @db.VarChar(50)
  dueDate           DateTime?
  status            String   @default("pending")  // pending, completed, cancelled
  assignedToUserId  String?  @db.VarChar(255)
  createdByUserId   String   @db.VarChar(255)
  completedAt       DateTime?
  metadata          Json     @default("{}")
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  // Relations
  AssignedToUser    User?   @relation("AssignedTasks", fields: [assignedToUserId], references: [id])
  CreatedByUser     User    @relation("CreatedTasks", fields: [createdByUserId], references: [id])
}
```

---

## API Request/Response Examples

### 1. Create TalentTask

**Request:**
```bash
POST /api/admin/talent/:id/tasks HTTP/1.1
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Review contract",
  "notes": "Review and approve new brand contract",
  "dueDate": "2026-01-24T17:00:00Z",
  "status": "PENDING"
}
```

**Response (201 Created):**
```json
{
  "id": "task_abc123",
  "talentId": "talent_xyz789",
  "title": "Review contract",
  "notes": "Review and approve new brand contract",
  "dueDate": "2026-01-24T17:00:00Z",
  "status": "PENDING",
  "createdBy": "user_123",
  "completedAt": null,
  "createdAt": "2026-01-17T10:00:00Z",
  "updatedAt": "2026-01-17T10:00:00Z"
}
```

---

### 2. Create CrmTask (with Relations)

**Request:**
```bash
POST /api/crm-tasks HTTP/1.1
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Finalize deal terms with Acme Corp",
  "description": "Review and finalize all contract terms for the Q1 campaign",
  "status": "In Progress",
  "priority": "High",
  "dueDate": "2026-01-30T17:00:00Z",
  "ownerId": "user_456",
  "assignedUserIds": ["user_789", "user_101"],
  "mentions": ["user_202"],
  "brandId": "brand_123",
  "dealId": "deal_456",
  "campaignId": "campaign_789",
  "relatedBrands": ["brand_123"],
  "relatedCreators": ["creator_101"],
  "relatedDeals": ["deal_456"]
}
```

**Response (201 Created):**
```json
{
  "id": "clx1a2b3c4d5e6f7g8h9i0j1",
  "title": "Finalize deal terms with Acme Corp",
  "description": "Review and finalize all contract terms for the Q1 campaign",
  "status": "In Progress",
  "priority": "High",
  "dueDate": "2026-01-30T17:00:00Z",
  "completedAt": null,
  "owner": null,
  "ownerId": "user_456",
  "assignedUserIds": ["user_789", "user_101"],
  "mentions": ["user_202"],
  "relatedBrands": ["brand_123"],
  "relatedCreators": ["creator_101"],
  "relatedUsers": [],
  "relatedDeals": ["deal_456"],
  "relatedCampaigns": [],
  "relatedEvents": [],
  "relatedContracts": [],
  "brandId": "brand_123",
  "dealId": "deal_456",
  "campaignId": "campaign_789",
  "eventId": null,
  "contractId": null,
  "createdBy": "user_456",
  "createdAt": "2026-01-17T10:00:00Z",
  "updatedAt": "2026-01-17T10:00:00Z",
  "CrmBrand": {
    "id": "brand_123",
    "brandName": "Acme Corporation"
  },
  "CrmCampaign": {
    "id": "campaign_789",
    "campaignName": "Q1 Campaign"
  },
  "Owner": {
    "id": "user_456",
    "email": "owner@example.com",
    "name": "John Manager"
  },
  "CreatedByUser": {
    "id": "user_456",
    "email": "owner@example.com",
    "name": "John Manager"
  }
}
```

**Additional Actions Performed:**
- Task notifications created for @mentions and assignees
- Calendar sync attempted if calendar service available
- Calendar event created and eventId stored in CrmTask

---

### 3. Convert Meeting Action Item to Task

**Request:**
```bash
POST /api/action-items/{actionItemId}/add-to-tasks HTTP/1.1
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "actionItem": {
    "id": "action_123",
    "talentId": "talent_xyz",
    "title": "Prepare portfolio samples",
    "description": "Prepare 5 high-quality portfolio samples for review",
    "dueDate": "2026-01-25T17:00:00Z",
    "linkedTaskId": "task_456",
    "status": "open",
    "updatedAt": "2026-01-17T10:00:00Z"
  },
  "task": {
    "id": "task_456",
    "talentId": "talent_xyz",
    "title": "Prepare portfolio samples",
    "notes": "From meeting action item: Prepare 5 high-quality portfolio samples for review",
    "dueDate": "2026-01-25T17:00:00Z",
    "status": "PENDING",
    "createdBy": "user_123",
    "completedAt": null,
    "createdAt": "2026-01-17T10:00:00Z",
    "updatedAt": "2026-01-17T10:00:00Z"
  }
}
```

---

### 4. List Tasks with Filters

**Request (CrmTask):**
```bash
GET /api/crm-tasks?status=In%20Progress&priority=High&owner=user_456 HTTP/1.1
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
[
  {
    "id": "clx1a2b3c4d5e6f7g8h9i0j1",
    "title": "Finalize deal terms",
    "status": "In Progress",
    "priority": "High",
    "dueDate": "2026-01-30T17:00:00Z",
    "ownerId": "user_456",
    "CrmBrand": { "id": "brand_123", "brandName": "Acme Corp" },
    "CrmCampaign": { "id": "campaign_789", "campaignName": "Q1 Campaign" },
    // ... additional fields
  },
  // ... more tasks
]
```

---

### 5. Update Task Status

**Request:**
```bash
PATCH /api/crm-tasks/clx1a2b3c4d5e6f7g8h9i0j1 HTTP/1.1
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "Completed",
  "completedAt": "2026-01-29T15:00:00Z"
}
```

**Response (200 OK):**
```json
{
  "id": "clx1a2b3c4d5e6f7g8h9i0j1",
  "title": "Finalize deal terms",
  "status": "Completed",
  "completedAt": "2026-01-29T15:00:00Z",
  "updatedAt": "2026-01-29T15:00:00Z",
  // ... other fields
}
```

---

## Validation Schemas

### TalentTask Validation
```typescript
{
  title: string (required, non-empty)
  notes: string (optional)
  dueDate: ISO8601 datetime (optional)
  status: string (optional, defaults to "PENDING")
}
```

### CrmTask Validation
```typescript
{
  title: string (required, non-empty, trimmed)
  description: string (optional)
  status: string (optional, defaults to "Pending")
  priority: string (optional, defaults to "Medium")
  dueDate: ISO8601 datetime (optional)
  owner: string (optional)
  ownerId: string (optional, defaults to current user ID)
  assignedUserIds: string[] (optional)
  mentions: string[] (optional)
  relatedBrands: string[] (optional)
  relatedCreators: string[] (optional)
  relatedUsers: string[] (optional)
  relatedDeals: string[] (optional)
  relatedCampaigns: string[] (optional)
  relatedEvents: string[] (optional)
  relatedContracts: string[] (optional)
  brandId: string (optional - must exist if provided)
  dealId: string (optional - must exist if provided)
  campaignId: string (optional - must exist if provided)
  eventId: string (optional - must exist if provided)
  contractId: string (optional - must exist if provided)
}
```

### OutreachTask Validation
```typescript
{
  title: string (required, non-empty trimmed)
  dueDate: ISO8601 datetime (optional)
  priority: string (optional, defaults to "Medium")
  owner: string (optional)
}
```

### InternalQueueTask Validation
```typescript
{
  title: string (required)
  description: string (optional)
  priority: string (optional)
  dueDate: ISO8601 datetime (optional)
  assignedToUserId: string (optional)
  metadata: object (optional)
}
```

---

## Error Handling

### Common Error Responses

**400 Bad Request - Missing Required Field**
```json
{
  "error": "Task title is required"
}
```

**400 Bad Request - Invalid Entity Reference (CrmTask)**
```json
{
  "error": "Invalid reference: One or more related entities (brand, campaign, etc.) do not exist"
}
```

**401 Unauthorized**
```json
{
  "error": "Unauthorized",
  "errorType": "AUTH_REQUIRED"
}
```

**404 Not Found**
```json
{
  "error": "Task not found"
}
```

**403 Forbidden (CrmTask)**
```json
{
  "error": "Access denied"
}
```

**500 Internal Server Error**
```json
{
  "error": "Failed to create task",
  "details": "..."  // only in development
}
```

---

## Activity Logging

### TalentTask Activity Log Entries

**Created:**
```typescript
{
  action: "TALENT_TASK_CREATED",
  entityType: "TalentTask",
  entityId: task.id,
  metadata: {
    talentId: id,
    title: title,
    dueDate: dueDate,
    status: status
  }
}
```

**Updated:**
```typescript
{
  action: "TALENT_TASK_UPDATED",
  entityType: "TalentTask",
  entityId: taskId,
  metadata: {
    talentId: task.talentId,
    status: status
  }
}
```

**Deleted:**
```typescript
{
  action: "TALENT_TASK_DELETED",
  entityType: "TalentTask",
  entityId: taskId,
  metadata: {
    talentId: task.talentId
  }
}
```

---

### OutreachTask Activity Log Entry

**Created:**
```typescript
{
  action: "CREATE_OUTREACH_TASK",
  metadata: {
    outreachId: id,
    taskId: task.id
  }
}
```

---

### InternalQueueTask Activity Log Entry

**Created:**
```typescript
{
  action: "INTERNAL_TASK_CREATED",
  task: taskId,
  userId: userId,
  metadata: {
    title: task.title,
    priority: task.priority,
    assignedTo: task.assignedToUserId
  }
}
```

---

## Notification System (CrmTask Only)

### Task Notification Flow

**Trigger:** After CrmTask creation or update

**Function:** `createTaskNotifications(task, action)`

**Action Types:**
- `"created"` - Task was newly created
- `"updated"` - Task was updated
- `"assigned"` - Task was assigned to someone
- `"mentioned"` - User was mentioned in task

**Notification Recipients:**
1. Users in `mentions` array
2. Users in `assignedUserIds` array
3. Task owner (if applicable)

**Notification Content:**
- Task title
- Task description
- Assignee information
- Mention information
- Due date

---

## Calendar Sync (CrmTask Only)

### Calendar Sync Flow

**Trigger:** After CrmTask creation (if `dueDate` provided)

**Service:** `syncTaskToCalendar(task, userId)`

**Process:**
1. Check if task has a `dueDate`
2. Call calendar service to create event
3. Update CrmTask with calendar event ID
4. Log result (success/failure)
5. Don't fail task creation if sync fails

**Error Handling:**
- Calendar sync failures are logged but don't prevent task creation
- If sync fails, task is still created but not synced to calendar
- Can be retried later

**Fields Synced:**
- Task title → Event title
- Task dueDate → Event date/time
- Task description → Event description
- Creator/owner information → Event organizer

---

## Query Optimization Tips

### N+1 Query Prevention
**Include Related Entities:**
```typescript
// GOOD - Single query with relations
const tasks = await prisma.crmTask.findMany({
  where: { status: "Pending" },
  include: {
    CrmBrand: { select: { brandName: true } },
    Owner: { select: { email: true, name: true } }
  }
});

// BAD - Multiple queries
const tasks = await prisma.crmTask.findMany();
for (const task of tasks) {
  const brand = await prisma.crmBrand.findUnique({ where: { id: task.brandId } });
}
```

### Filtering in Database vs Application
```typescript
// GOOD - Filter in database
const tasks = await prisma.crmTask.findMany({
  where: {
    status: "Completed",
    priority: "High"
  }
});

// BAD - Filter after fetching
const allTasks = await prisma.crmTask.findMany();
const filtered = allTasks.filter(t => t.status === "Completed" && t.priority === "High");
```

### Pagination
```typescript
const tasks = await prisma.crmTask.findMany({
  skip: (page - 1) * pageSize,
  take: pageSize,
  orderBy: { dueDate: "asc" }
});
```

---

## Status Transitions

### TalentTask Status Machine
```
PENDING ──→ IN_PROGRESS ──→ COMPLETED
   ↓            ↓              ↓
   └────→ CANCELLED ←────────┘
```
- Any status can transition to CANCELLED
- Forward progression: PENDING → IN_PROGRESS → COMPLETED
- No automatic status changes (manual only)

### CreatorTask Status Machine
```
pending ──→ in_progress ──→ completed
   ↓            ↓              ↓
   └────→ cancelled ←────────┘
```
- Creator can only mark as "completed"
- Other status changes via admin
- Task types affect visibility: creative, attendance, review, approval

### CrmTask Status Machine
```
Pending ──→ In Progress ──→ Completed
   ↓            ↓              ↓
   └────→ Cancelled ←────────┘
```
- `completedAt` timestamp set when status = "Completed"
- Completed/Cancelled tasks hidden from most queries
- Used in overload detection and reminder services

---

## Security Considerations

### Authentication
- All task endpoints require authentication via `requireAuth` middleware
- Verified via `req.user?.id`

### Authorization
- **TalentTask:** Requires admin or talent owner
- **CreatorTask:** Creator can only see/modify their own tasks
- **CrmTask:** Visibility filtering based on user role (admin > manager > team)
- **OutreachTask:** Requires appropriate permissions
- **InternalQueueTask:** Requires user authentication

### Input Validation
- Title required and non-empty for all models
- Entity references validated (brandId, dealId, etc.)
- Date format validation (ISO8601)
- Array length/content validation
- Metadata object validation for InternalQueueTask

### Data Isolation
- Users can only see tasks they're permitted to access
- Filtering applied at database query level (not application)
- JSON fields for relationships (mentions, assigns) not searchable without post-processing

---

## Performance Metrics

### Query Complexity
- Simple CRUD: O(1)
- List with filters: O(n) where n = total tasks matching filter
- List with relations: O(n × m) worst case, but typically indexed
- Visibility filtering: O(n) post-query processing for CrmTask mentions

### Recommended Indexes
```sql
-- TalentTask
CREATE INDEX idx_talentTask_talentId ON TalentTask(talentId);
CREATE INDEX idx_talentTask_dueDate ON TalentTask(dueDate);

-- CreatorTask
CREATE INDEX idx_creatorTask_creatorId ON CreatorTask(creatorId);
CREATE INDEX idx_creatorTask_status ON CreatorTask(status);
CREATE INDEX idx_creatorTask_dueAt ON CreatorTask(dueAt);

-- CrmTask
CREATE INDEX idx_crmTask_status ON CrmTask(status);
CREATE INDEX idx_crmTask_priority ON CrmTask(priority);
CREATE INDEX idx_crmTask_dueDate ON CrmTask(dueDate);
CREATE INDEX idx_crmTask_brandId ON CrmTask(brandId);
CREATE INDEX idx_crmTask_campaignId ON CrmTask(campaignId);
CREATE INDEX idx_crmTask_ownerId ON CrmTask(ownerId);

-- OutreachTask
CREATE INDEX idx_outreachTask_outreachId ON OutreachTask(outreachId);
CREATE INDEX idx_outreachTask_dueDate ON OutreachTask(dueDate);

-- InternalQueueTask
CREATE INDEX idx_internalQueueTask_status ON InternalQueueTask(status);
CREATE INDEX idx_internalQueueTask_assignedToUserId ON InternalQueueTask(assignedToUserId);
CREATE INDEX idx_internalQueueTask_createdByUserId ON InternalQueueTask(createdByUserId);
```

