# Exclusive Talent Backend Audit

## PHASE 1: EXISTING MODELS AUDIT

### ✅ Exists & Usable

| Model | Status | Notes |
|-------|--------|-------|
| **User** | ✅ Complete | Core user model with role field, onboarding_status, admin_notes |
| **Talent** | ✅ Complete | Connected to User via userId, has categories, stage |
| **Deal** | ✅ Complete | Comprehensive deal tracking with stage enum, value, dates |
| **Brand** | ✅ Complete | Brand info with values, target audience |
| **Invoice** | ✅ Complete | Invoice tracking with amount, status, dates |
| **Payout** | ✅ Complete | Creator payouts with status, amounts, dates |
| **Deliverable** | ✅ Complete | Deal deliverables with due dates, approval tracking |
| **Opportunity** | ✅ Complete | Job opportunities with brand, location, payment |
| **Notification** | ✅ Complete | User notifications with type, entity tracking |

### ⚠️ Exists but Incomplete

| Model | Status | Missing |
|-------|--------|---------|
| **OutreachTask** | ⚠️ Incomplete | Not creator-facing, linked to Outreach (agent tool) |
| **Payment** | ⚠️ Incomplete | Has basic fields but needs creator-safe queries |

### ❌ Missing (Required for Creator Overview)

| Model | Status | Required For |
|-------|--------|--------------|
| **CreatorGoal** | ❌ Missing | Goal setting & progress tracking |
| **CreatorEvent** | ❌ Missing | Events creators can accept/decline |
| **SocialAccountConnection** | ❌ Missing | Social platform connections & analytics |
| **CreatorInsight** | ❌ Missing | Performance insights (not raw analytics) |
| **CreatorTask** | ❌ Missing | Creator-specific tasks (not internal admin) |
| **WellnessCheckin** | ❌ Missing | Optional wellness tracking |
| **AIPromptHistory** | ❌ Missing | Creator AI assistant history |

## PHASE 2: REQUIRED NEW MODELS

### 1. CreatorGoal
```prisma
model CreatorGoal {
  id           String   @id @default(uuid())
  creatorId    String
  goalType     String   // revenue | product | events | personal | content
  title        String
  targetValue  Float?
  timeframe    String?  // Q1 2024 | 6 months | etc
  progress     Float    @default(0) // 0-1 decimal
  active       Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  Creator      Talent   @relation(fields: [creatorId], references: [id], onDelete: Cascade)
  
  @@index([creatorId, active])
  @@index([goalType])
}
```

### 2. CreatorEvent
```prisma
model CreatorEvent {
  id          String   @id @default(uuid())
  creatorId   String
  eventName   String
  eventType   String   // meeting | shoot | launch | appearance
  description String?
  location    String?
  startAt     DateTime
  endAt       DateTime?
  status      String   @default("suggested") // suggested | invited | accepted | declined
  source      String   @default("agent") // agent | admin | system
  sourceUserId String?
  declineReason String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  Creator     Talent   @relation(fields: [creatorId], references: [id], onDelete: Cascade)
  SourceUser  User?    @relation("EventCreatedBy", fields: [sourceUserId], references: [id])
  
  @@index([creatorId, status])
  @@index([startAt])
  @@index([status])
}
```

### 3. SocialAccountConnection
```prisma
model SocialAccountConnection {
  id            String    @id @default(uuid())
  creatorId     String
  platform      String    // instagram | tiktok | youtube | x | linkedin
  handle        String
  connected     Boolean   @default(false)
  accessToken   String?
  refreshToken  String?
  expiresAt     DateTime?
  lastSyncedAt  DateTime?
  metadata      Json?     // Platform-specific data
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  Creator       Talent    @relation(fields: [creatorId], references: [id], onDelete: Cascade)
  
  @@unique([creatorId, platform])
  @@index([creatorId, connected])
  @@index([platform])
}
```

### 4. CreatorInsight
```prisma
model CreatorInsight {
  id          String   @id @default(uuid())
  creatorId   String
  insightType String   // performance | trend | audience | opportunity
  title       String
  summary     String
  context     String?  // Additional context/explanation
  metadata    Json?    // Any supporting data
  priority    Int      @default(0)
  isRead      Boolean  @default(false)
  createdAt   DateTime @default(now())
  expiresAt   DateTime? // Optional expiry for time-sensitive insights
  
  Creator     Talent   @relation(fields: [creatorId], references: [id], onDelete: Cascade)
  
  @@index([creatorId, isRead])
  @@index([creatorId, createdAt])
  @@index([insightType])
}
```

### 5. CreatorTask
```prisma
model CreatorTask {
  id          String    @id @default(uuid())
  creatorId   String
  title       String
  description String?
  taskType    String    // creative | attendance | review | approval
  dueAt       DateTime?
  completedAt DateTime?
  priority    String    @default("medium") // low | medium | high | urgent
  status      String    @default("pending") // pending | in_progress | completed | cancelled
  linkedDealId String?
  linkedDeliverableId String?
  createdBy   String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  Creator     Talent    @relation(fields: [creatorId], references: [id], onDelete: Cascade)
  Deal        Deal?     @relation(fields: [linkedDealId], references: [id])
  Deliverable Deliverable? @relation(fields: [linkedDeliverableId], references: [id])
  CreatedByUser User?   @relation("TaskCreatedBy", fields: [createdBy], references: [id])
  
  @@index([creatorId, status])
  @@index([creatorId, dueAt])
  @@index([linkedDealId])
  @@index([priority])
}
```

### 6. WellnessCheckin
```prisma
model WellnessCheckin {
  id          String   @id @default(uuid())
  creatorId   String
  energyLevel Int      // 1-5 scale
  workload    String   // light | comfortable | busy | overwhelming
  notes       String?
  createdAt   DateTime @default(now())
  
  Creator     Talent   @relation(fields: [creatorId], references: [id], onDelete: Cascade)
  
  @@index([creatorId, createdAt])
}
```

### 7. AIPromptHistory
```prisma
model AIPromptHistory {
  id        String   @id @default(uuid())
  creatorId String
  prompt    String
  response  String
  category  String?  // content_ideas | career_advice | scheduling | general
  helpful   Boolean? // Optional feedback
  createdAt DateTime @default(now())
  
  Creator   Talent   @relation(fields: [creatorId], references: [id], onDelete: Cascade)
  
  @@index([creatorId, createdAt])
  @@index([category])
}
```

## PHASE 3: DATA SAFETY RULES

### Revenue Data (READ-ONLY)
- ✅ Aggregate only (no invoice line items)
- ✅ Rounded values (£48K not £48,234.56)
- ✅ Range-based when appropriate
- ❌ NO payment dates
- ❌ NO invoice numbers
- ❌ NO payout schedules

### Deal Data (LIMITED)
- ✅ Deal name, brand, status
- ✅ High-level value (rounded)
- ✅ Next action required
- ❌ NO negotiation details
- ❌ NO agent notes
- ❌ NO contract terms

### Task Data (FILTERED)
- ✅ Creative tasks only
- ✅ Attendance/approval tasks
- ❌ NO internal admin tasks
- ❌ NO financial tasks

### Event Data (SAFE)
- ✅ Creator can accept/decline
- ✅ See event details
- ✅ Add optional notes
- ❌ Cannot see source details
- ❌ Cannot edit after acceptance

## PHASE 4: API ENDPOINTS REQUIRED

### Overview Snapshot
```
GET /api/creator/overview
- Aggregates all sections
- Fast (<2s response)
- Cached 2 minutes
- Returns safe defaults on error
```

### Goals
```
GET /api/creator/goals
POST /api/creator/goals
PATCH /api/creator/goals/:id
DELETE /api/creator/goals/:id
```

### Events
```
GET /api/creator/events
POST /api/creator/events/:id/accept
POST /api/creator/events/:id/decline
```

### Tasks
```
GET /api/creator/tasks
PATCH /api/creator/tasks/:id/complete
```

### Revenue
```
GET /api/creator/revenue-summary
- Rounded totals
- Trend indicators
- No sensitive details
```

### Social Accounts
```
POST /api/creator/socials/connect
GET /api/creator/socials
POST /api/creator/socials/disconnect
```

### Insights
```
GET /api/creator/insights
PATCH /api/creator/insights/:id/mark-read
```

### AI Assistant
```
POST /api/creator/ai/ask
GET /api/creator/ai/history
```

### Wellness
```
POST /api/creator/wellness-checkin
GET /api/creator/wellness-history
```

## NEXT STEPS

1. ✅ Add missing models to schema.prisma
2. Run `npx prisma db push`
3. Create creator permissions middleware
4. Implement real API endpoints
5. Replace mock data in exclusive.ts
6. Test data safety rules
7. Validate performance (<2s loads)
