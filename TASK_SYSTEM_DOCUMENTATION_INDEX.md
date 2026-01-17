# Task System Documentation Index

Complete comprehensive documentation of the Break Agency task management system, including all endpoints, models, services, and UI components.

## 📚 Documentation Files

### 1. **TASK_SYSTEM_QUICK_REFERENCE.md**
**Quick lookup guide for developers**
- Find endpoints by task model (TalentTask, CreatorTask, CrmTask, OutreachTask, InternalQueueTask)
- Search by feature (List, Create, Update, Delete)
- Search by page/context (Talent, Outreach, CRM, Creator Portal)
- Service functions reference
- Frontend components (located)
- Common patterns
- Troubleshooting FAQ

**When to use:** You need to quickly find an endpoint or understand a feature

---

### 2. **TASK_ENDPOINTS_COMPLETE_SUMMARY.md**
**Comprehensive endpoint and model documentation**
- All 5 task models explained
- 21 API endpoints documented with:
  - File paths and line numbers
  - Request/response formats
  - Activity logging details
  - Special features
- Frontend components (Meeting, Outreach sections)
- Service functions (notifications, AI, reminders, overload detection)
- Task listing/query logic for each model
- Creation summary matrix

**When to use:** You need detailed API documentation or understanding of how a specific endpoint works

---

### 3. **TASK_LIFECYCLE_BREAKDOWN.md**
**Visual flow diagrams and lifecycle documentation**
- Detailed flow diagrams for each task type
- Task model comparison matrix
- Status transition diagrams
- Conversion flows (e.g., meeting action items → tasks)
- Data flow overview
- Special features per model (calendar sync, notifications, logging)

**When to use:** You need to understand how tasks flow through the system or visualize relationships

---

### 4. **TASK_SYSTEM_TECHNICAL_GUIDE.md**
**Technical implementation details**
- Prisma schema for all 5 models
- API request/response examples with actual payloads
- Validation schemas for each model
- Error handling and responses
- Activity logging format
- Notification system details (CrmTask)
- Calendar sync flow (CrmTask)
- Query optimization tips
- Security considerations
- Performance metrics and recommended indexes

**When to use:** You're implementing a feature, integrating with tasks, or need API payload examples

---

## 🗺️ Map by Use Case

### "I need to create a task endpoint"
1. Check [TASK_ENDPOINTS_COMPLETE_SUMMARY.md](TASK_ENDPOINTS_COMPLETE_SUMMARY.md) → find similar endpoint
2. Reference [TASK_SYSTEM_TECHNICAL_GUIDE.md](TASK_SYSTEM_TECHNICAL_GUIDE.md) → Prisma schema and validation
3. Look at [TASK_LIFECYCLE_BREAKDOWN.md](TASK_LIFECYCLE_BREAKDOWN.md) → understand the flow

### "I need to fix a task bug"
1. Start with [TASK_SYSTEM_QUICK_REFERENCE.md](TASK_SYSTEM_QUICK_REFERENCE.md) → find the endpoint
2. Check [TASK_ENDPOINTS_COMPLETE_SUMMARY.md](TASK_ENDPOINTS_COMPLETE_SUMMARY.md) → detailed implementation
3. Review [TASK_SYSTEM_TECHNICAL_GUIDE.md](TASK_SYSTEM_TECHNICAL_GUIDE.md) → error handling and validation

### "I need to understand the task system architecture"
1. Read [TASK_LIFECYCLE_BREAKDOWN.md](TASK_LIFECYCLE_BREAKDOWN.md) → visual overview
2. Study [TASK_SYSTEM_TECHNICAL_GUIDE.md](TASK_SYSTEM_TECHNICAL_GUIDE.md) → models and schemas
3. Reference [TASK_ENDPOINTS_COMPLETE_SUMMARY.md](TASK_ENDPOINTS_COMPLETE_SUMMARY.md) → all endpoints

### "I need to integrate tasks with a new feature"
1. Check [TASK_SYSTEM_QUICK_REFERENCE.md](TASK_SYSTEM_QUICK_REFERENCE.md) → find relevant endpoints
2. Review [TASK_SYSTEM_TECHNICAL_GUIDE.md](TASK_SYSTEM_TECHNICAL_GUIDE.md) → request/response format
3. Look at [TASK_ENDPOINTS_COMPLETE_SUMMARY.md](TASK_ENDPOINTS_COMPLETE_SUMMARY.md) → special features

### "I need to add UI for task creation"
1. Check [TASK_SYSTEM_QUICK_REFERENCE.md](TASK_SYSTEM_QUICK_REFERENCE.md) → find frontend components
2. Review [TASK_ENDPOINTS_COMPLETE_SUMMARY.md](TASK_ENDPOINTS_COMPLETE_SUMMARY.md) → frontend section
3. Study [TASK_SYSTEM_TECHNICAL_GUIDE.md](TASK_SYSTEM_TECHNICAL_GUIDE.md) → request/response examples

---

## 🎯 Task Models at a Glance

| Model | Primary Use | Key Endpoints | Status Values | Special Features |
|-------|-------------|---------------|----------------|-----------------|
| **TalentTask** | Individual talent management | 4 CRUD endpoints | PENDING, IN_PROGRESS, COMPLETED, CANCELLED | Activity logging |
| **CreatorTask** | Deal/campaign work assignments | 2 endpoints (list, complete) | pending, in_progress, completed, cancelled | Task types (creative, attendance, review, approval) |
| **CrmTask** | Enterprise task tracking | 4 CRUD + admin endpoints | Pending, In Progress, Completed, Cancelled | Calendar sync, Notifications, Multiple relations |
| **OutreachTask** | Outreach follow-up tracking | 4 CRUD endpoints | Open, In Progress, Completed, Closed | Two creation endpoints |
| **InternalQueueTask** | Internal team operations | 4 CRUD endpoints | pending, completed, cancelled | Audit logging, Metadata support |

---

## 🔍 Key Files in Codebase

### API Routes
- **Talent Tasks:** [apps/api/src/routes/admin/talent.ts](apps/api/src/routes/admin/talent.ts) (lines 1531-1660)
- **Creator Tasks:** [apps/api/src/routes/exclusive.ts](apps/api/src/routes/exclusive.ts) (lines 161-181)
- **CRM Tasks:** [apps/api/src/routes/crmTasks.ts](apps/api/src/routes/crmTasks.ts) (498 lines)
- **Outreach Tasks:** 
  - Admin: [apps/api/src/routes/admin/outreach.ts](apps/api/src/routes/admin/outreach.ts) (line 541)
  - Public: [apps/api/src/routes/outreach.ts](apps/api/src/routes/outreach.ts) (lines 367-412)
- **Internal Queue:** [apps/api/src/routes/queues.ts](apps/api/src/routes/queues.ts) (lines 443-682)
- **Meeting Action Items:** [apps/api/src/routes/admin/meetings.ts](apps/api/src/routes/admin/meetings.ts) (line 406)

### Services
- **Task Notifications:** [apps/api/src/services/taskNotifications.ts](apps/api/src/services/taskNotifications.ts)
- **AI Intelligence:** [apps/api/src/services/aiIntelligenceService.ts](apps/api/src/services/aiIntelligenceService.ts) (task queries)
- **Reminder Engine:** [apps/api/src/services/reminderEngineService.ts](apps/api/src/services/reminderEngineService.ts) (task queries)
- **Overload Detection:** [apps/api/src/services/overloadDetectionService.ts](apps/api/src/services/overloadDetectionService.ts) (task analysis)
- **Calendar Service:** [apps/api/src/services/calendarService.ts](apps/api/src/services/calendarService.ts) (calendar sync)

### Frontend Components
- **Meeting Tasks UI:** [apps/web/src/components/AdminTalent/MeetingSection.tsx](apps/web/src/components/AdminTalent/MeetingSection.tsx#L188)
  - `handleAddToTasks` function
  - `ActionItemRow` component
- **Outreach Section:** [apps/web/src/components/AdminTalent/OutreachSection.tsx](apps/web/src/components/AdminTalent/OutreachSection.tsx#L44)

---

## 📊 Endpoint Summary

### Total Endpoints: 21

**By Model:**
- TalentTask: 4 endpoints
- CreatorTask: 2 endpoints
- CrmTask: 6 endpoints + admin utilities
- OutreachTask: 4 endpoints
- InternalQueueTask: 4 endpoints
- Cross-model: 1 endpoint (action item to task conversion)

**By Method:**
- GET: 8 endpoints
- POST: 7 endpoints
- PATCH: 5 endpoints
- DELETE: 2 endpoints

---

## 🔐 Security & Permissions

| Model | Auth Required | Role-Based | Visibility Filtering | Notes |
|-------|---------------|-----------|---------------------|-------|
| TalentTask | ✅ | ✅ | ✅ | Admin/talent owner only |
| CreatorTask | ✅ | ✅ | ✅ | Creator can only see their own |
| CrmTask | ✅ | ✅ | ✅ | Filtering based on user role |
| OutreachTask | ✅ | ✅ | ✅ | Appropriate permissions required |
| InternalQueueTask | ✅ | ✅ | ✅ | Authenticated users only |

---

## 📈 Features by Model

| Feature | TalentTask | CreatorTask | CrmTask | OutreachTask | InternalQueueTask |
|---------|-----------|-----------|---------|--------------|------------------|
| Calendar Sync | ❌ | ❌ | ✅ | ❌ | ❌ |
| Notifications | ❌ | ❌ | ✅ | ❌ | ❌ |
| Activity Logging | ✅ | ❌ | ❌ | ✅ | ✅ |
| Multiple Relations | ❌ | ✅ (Deal) | ✅ (Many) | ❌ | ❌ |
| Metadata Support | ❌ | ❌ | ❌ | ❌ | ✅ |
| Task Types | ❌ | ✅ | ❌ | ❌ | ❌ |

---

## ❓ Frequently Asked Questions

### Q: Which task model should I use?
**A:** See the Task Models at a Glance table above. Generally:
- **TalentTask** - For individual creator management
- **CreatorTask** - For deal/campaign work
- **CrmTask** - For enterprise-wide task tracking
- **OutreachTask** - For outreach follow-ups
- **InternalQueueTask** - For internal operations

### Q: How do I create a task?
**A:** See [TASK_SYSTEM_TECHNICAL_GUIDE.md](TASK_SYSTEM_TECHNICAL_GUIDE.md) for request/response examples

### Q: How are tasks logged?
**A:** Activity logging is implemented for TalentTask, OutreachTask, and InternalQueueTask. See the Activity Logging section in [TASK_SYSTEM_TECHNICAL_GUIDE.md](TASK_SYSTEM_TECHNICAL_GUIDE.md)

### Q: How do task notifications work?
**A:** Only CrmTask has notifications implemented. Mentions and assignments trigger notifications automatically. See [TASK_SYSTEM_TECHNICAL_GUIDE.md](TASK_SYSTEM_TECHNICAL_GUIDE.md) → Notification System

### Q: How is calendar sync implemented?
**A:** Only CrmTask has calendar sync. Tasks with a `dueDate` are automatically synced. See [TASK_SYSTEM_TECHNICAL_GUIDE.md](TASK_SYSTEM_TECHNICAL_GUIDE.md) → Calendar Sync

### Q: What are the status values for each model?
**A:** See [TASK_LIFECYCLE_BREAKDOWN.md](TASK_LIFECYCLE_BREAKDOWN.md) for status machines for each model

### Q: Where's the frontend code for task creation?
**A:** Limited components found. Only Meeting section has UI for converting action items to tasks. See [TASK_SYSTEM_QUICK_REFERENCE.md](TASK_SYSTEM_QUICK_REFERENCE.md) → Frontend Components

### Q: How do I list tasks?
**A:** See [TASK_SYSTEM_QUICK_REFERENCE.md](TASK_SYSTEM_QUICK_REFERENCE.md) → Search by Feature → List/Get Tasks

### Q: How do I update a task?
**A:** All models support PATCH endpoints. See [TASK_SYSTEM_QUICK_REFERENCE.md](TASK_SYSTEM_QUICK_REFERENCE.md) → Search by Feature → Update Tasks

### Q: What's the difference between similar endpoints?
**A:** See [TASK_ENDPOINTS_COMPLETE_SUMMARY.md](TASK_ENDPOINTS_COMPLETE_SUMMARY.md) for detailed comparison

---

## 📝 Document Change Log

**Created:** January 17, 2026

**Included Searches:**
- `router\.(post|get|patch|put|delete).*task` in apps/api/src/routes/
- `create.*[Tt]ask|add.*[Tt]ask` in apps/api/src/services/
- `TalentTask|CreatorTask|CrmTask|OutreachTask` in apps/api/src/

**Codebase Version:** Break Agency app (January 2026)

**Coverage:**
- ✅ All API endpoints
- ✅ All task models (5)
- ✅ All service functions
- ✅ Frontend components (Meeting, Outreach)
- ✅ Activity logging
- ✅ Notifications (CrmTask)
- ✅ Calendar sync (CrmTask)

---

## 🚀 Quick Start Examples

### Create a TalentTask
```bash
curl -X POST http://localhost:3000/api/admin/talent/talent_123/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Review portfolio",
    "notes": "Check latest portfolio samples",
    "dueDate": "2026-01-24T17:00:00Z",
    "status": "PENDING"
  }'
```

### Get All CrmTasks (High Priority, In Progress)
```bash
curl "http://localhost:3000/api/crm-tasks?status=In%20Progress&priority=High" \
  -H "Authorization: Bearer $TOKEN"
```

### Convert Meeting Action Item to Task
```bash
curl -X POST http://localhost:3000/api/action-items/action_123/add-to-tasks \
  -H "Authorization: Bearer $TOKEN"
```

### Create InternalQueueTask
```bash
curl -X POST http://localhost:3000/api/queues/internal-tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Review pending approvals",
    "description": "Check 5 pending contract approvals",
    "priority": "High",
    "dueDate": "2026-01-18T17:00:00Z",
    "assignedToUserId": "user_456"
  }'
```

---

## 📞 Support

For detailed information:
1. **Quick lookup:** [TASK_SYSTEM_QUICK_REFERENCE.md](TASK_SYSTEM_QUICK_REFERENCE.md)
2. **Detailed docs:** [TASK_ENDPOINTS_COMPLETE_SUMMARY.md](TASK_ENDPOINTS_COMPLETE_SUMMARY.md)
3. **Visual flows:** [TASK_LIFECYCLE_BREAKDOWN.md](TASK_LIFECYCLE_BREAKDOWN.md)
4. **Technical specs:** [TASK_SYSTEM_TECHNICAL_GUIDE.md](TASK_SYSTEM_TECHNICAL_GUIDE.md)

---

## 📄 All Documentation Files

1. ✅ [TASK_SYSTEM_QUICK_REFERENCE.md](TASK_SYSTEM_QUICK_REFERENCE.md) - Quick lookup guide
2. ✅ [TASK_ENDPOINTS_COMPLETE_SUMMARY.md](TASK_ENDPOINTS_COMPLETE_SUMMARY.md) - Complete API documentation
3. ✅ [TASK_LIFECYCLE_BREAKDOWN.md](TASK_LIFECYCLE_BREAKDOWN.md) - Visual flows and lifecycles
4. ✅ [TASK_SYSTEM_TECHNICAL_GUIDE.md](TASK_SYSTEM_TECHNICAL_GUIDE.md) - Technical implementation guide
5. ✅ **TASK_SYSTEM_DOCUMENTATION_INDEX.md** - This file

---

**Last Updated:** January 17, 2026
**Accuracy:** Based on complete codebase search of task-related files
**Coverage:** 21 endpoints across 5 task models
