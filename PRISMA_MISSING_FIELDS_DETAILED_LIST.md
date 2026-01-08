# Prisma Missing Fields - Structured List

## Format: Model Name | Missing Field | Expected Type | Files That Need It

---

## CRITICAL - Missing Models (Must add to schema first)

### 1. AgentPolicy Model (MISSING)
**Files Importing/Using:**
- [src/agent/agentPolicy.ts](src/agent/agentPolicy.ts#L4) - `prisma.agentPolicy.findUnique()`
- [src/agent/agentPolicy.ts](src/agent/agentPolicy.ts#L7) - `prisma.agentPolicy.create()`
- prisma-broken/negotiationRealtimeEngine.ts - `prisma.agentPolicy.findFirst()`
- prisma-broken/chainEngine.ts - `prisma.agentPolicy.findFirst()`

**Required Fields:**
| Field Name | Type | Default | Required | Notes |
|-----------|------|---------|----------|-------|
| id | String | cuid() | Yes | Primary key |
| userId | String | - | Yes | FK to User, unique |
| sandboxMode | Boolean | true | No | Testing mode |
| autoSendNegotiation | Boolean | false | No | Auto-send counter offers |
| negotiationStrategy | String | - | No | "aggressive", "balanced", "conservative" |
| rateFloor | Float | - | No | Minimum acceptable rate |
| rateMarkupPercentage | Float | - | No | Markup multiplier |
| excludedBrands | String[] | [] | No | Brands to avoid |
| excludedCategories | String[] | [] | No | Categories to avoid |
| maxDealsPerMonth | Int | - | No | Deal limit |
| createdAt | DateTime | now() | Yes | Auto-set |
| updatedAt | DateTime | - | Yes | Auto-set |

**Relation to User:**
```prisma
User relation fields: [userId]
```

---

### 2. TalentAISettings Model (MISSING - causes validation error)
**Files Importing/Using:**
- [src/cron/outreachRotation.ts](src/cron/outreachRotation.ts#L7-L12) - `include: { aiSettings: true }`
- [src/services/ai/negotiationEngine.ts](src/services/ai/negotiationEngine.ts#L43) - `include: { aiSettings: true }`
- [src/services/ai/autoReply.service.ts](src/services/ai/autoReply.service.ts#L10) - `talent?.aiSettings`
- [src/services/ai/aiAgentService.ts](src/services/ai/aiAgentService.ts#L17) - `include: { aiSettings: true }`
- [src/cron/outreachFollowUps.ts](src/cron/outreachFollowUps.ts) - Expects aiSettings

**Required Fields:**
| Field Name | Type | Default | Required | Notes |
|-----------|------|---------|----------|-------|
| id | String | cuid() | Yes | Primary key |
| talentId | String | - | Yes | FK to Talent, unique |
| outreachEnabled | Boolean | false | No | Enable AI outreach |
| autoReplyEnabled | Boolean | false | No | Enable auto-reply |
| negotiationStyle | String | - | No | "aggressive", "balanced", "passive" |
| minRate | Float | - | No | Minimum rate preference |
| maxRate | Float | - | No | Maximum rate preference |
| responseTimeHours | Int | 24 | No | Auto-reply delay |
| autoAcceptRateFloor | Float | - | No | Auto-accept if rate >= this |
| dealFilters | Json | - | No | Category/brand preferences |
| createdAt | DateTime | now() | Yes | Auto-set |
| updatedAt | DateTime | - | Yes | Auto-set |

**Relation to Talent:**
```prisma
Talent relation fields: [talentId]
```

---

### 3. OutboundTemplate Model (MISSING)
**Files Importing/Using:**
- [src/cron/outreachRotation.ts](src/cron/outreachRotation.ts#L13) - `include: { outboundTemplates: true }`
- [src/cron/outreachRotation.ts](src/cron/outreachRotation.ts#L20) - `talent.outboundTemplates.find((t) => t.enabled)`

**Required Fields:**
| Field Name | Type | Default | Required | Notes |
|-----------|------|---------|----------|-------|
| id | String | cuid() | Yes | Primary key |
| talentId | String | - | Yes | FK to Talent |
| name | String | - | Yes | Template name |
| subject | String | - | No | Email subject line |
| body | String | - | Yes | Email template body |
| enabled | Boolean | true | No | Active template |
| createdAt | DateTime | now() | Yes | Auto-set |
| updatedAt | DateTime | - | Yes | Auto-set |

**Relation to Talent:**
```prisma
Talent relation fields: [talentId]
Array: outboundTemplates: OutboundTemplate[]
```

---

## HIGH PRIORITY - Missing Fields on Existing Models

### 4. OutreachAction | runAt | DateTime

**Model Location:** [prisma/schema.prisma](apps/api/prisma/schema.prisma#L1027)

**Files That Use It:**
- [src/services/outreach/outreachService.ts](src/services/outreach/outreachService.ts#L28) - `const runAt = new Date(...)`
- [src/services/outreach/outreachService.ts](src/services/outreach/outreachService.ts#L35) - `data: { ..., runAt }`

**Current Schema (WRONG):**
```prisma
model OutreachAction {
  id           String    @id
  sequenceId   String
  stepId       String?
  leadId       String?
  actionType   String
  status       String    @default("pending")
  errorMessage String?
  scheduledAt  DateTime?  // Different from runAt
  executedAt   DateTime?
  metadata     Json?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime
  // Missing: runAt
}
```

**Fix:**
```prisma
model OutreachAction {
  // ... existing fields ...
  runAt        DateTime?  // ← ADD THIS
  // ... rest of fields ...
  
  @@index([runAt])  // ← ADD THIS INDEX
}
```

---

### 5. Talent | aiSettings | TalentAISettings? (Relation)

**Model Location:** [prisma/schema.prisma](apps/api/prisma/schema.prisma#L1450)

**Files That Use It:**
- [src/cron/outreachRotation.ts](src/cron/outreachRotation.ts#L7-L12)
- [src/services/ai/negotiationEngine.ts](src/services/ai/negotiationEngine.ts#L62-L63)
- [src/services/ai/autoReply.service.ts](src/services/ai/autoReply.service.ts#L10)
- [src/services/ai/aiAgentService.ts](src/services/ai/aiAgentService.ts#L17)

**Current Schema (MISSING):**
```prisma
model Talent {
  id                      String                    @id
  userId                  String                    @unique
  name                    String
  // ... many fields ...
  // MISSING: aiSettings relation
}
```

**Fix:**
```prisma
model Talent {
  // ... existing fields ...
  aiSettings         TalentAISettings?  // ← ADD THIS
  // ... rest of relations ...
}
```

---

### 6. Talent | outboundTemplates | OutboundTemplate[] (Relation)

**Model Location:** [prisma/schema.prisma](apps/api/prisma/schema.prisma#L1450)

**Files That Use It:**
- [src/cron/outreachRotation.ts](src/cron/outreachRotation.ts#L13) - `include: { outboundTemplates: true }`
- [src/cron/outreachRotation.ts](src/cron/outreachRotation.ts#L20) - `talent.outboundTemplates.find(...)`

**Current Schema (MISSING):**
```prisma
model Talent {
  // ... existing fields ...
  // MISSING: outboundTemplates relation
}
```

**Fix:**
```prisma
model Talent {
  // ... existing fields ...
  outboundTemplates  OutboundTemplate[]  // ← ADD THIS
  // ... rest of relations ...
}
```

---

### 7. XeroConnection | userId | String (with FK)

**Model Location:** [prisma/schema.prisma](apps/api/prisma/schema.prisma#L1695)

**Files That Use It:**
- [src/services/xero/xeroSync.ts](src/services/xero/xeroSync.ts) - Needs to associate connection with user
- Any finance module that reads XeroConnection

**Current Schema (WRONG):**
```prisma
model XeroConnection {
  id           String    @id
  connected    Boolean   @default(false)
  tenantId     String?
  accessToken  String?
  refreshToken String?
  expiresAt    DateTime?
  lastSyncedAt DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime
  // MISSING: userId
}
```

**Fix:**
```prisma
model XeroConnection {
  id           String    @id
  userId       String    @unique   // ← ADD THIS
  connected    Boolean   @default(false)
  tenantId     String?
  accessToken  String?
  refreshToken String?
  expiresAt    DateTime?
  lastSyncedAt DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime
  User         User      @relation(fields: [userId], references: [id], onDelete: Cascade)  // ← ADD THIS

  @@index([userId])  // ← ADD THIS INDEX
}
```

**Add to User model:**
```prisma
XeroConnection  XeroConnection?
```

---

### 8. Bundle | createdBy | String (should be FK to User)

**Model Location:** [prisma/schema.prisma](apps/api/prisma/schema.prisma#L1842)

**Files That Need It:**
- Any bundle creation endpoint
- Bundle audit trails

**Current Schema (INCOMPLETE):**
```prisma
model Bundle {
  id           String   @id
  name         String
  description  String?
  priceMin     Float?
  priceMax     Float?
  deliverables Json?
  dealId       String?
  creatorId    String?
  status       String   @default("active")
  createdBy    String   // ← Just a string, not a FK
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

**Fix:**
```prisma
model Bundle {
  id           String   @id
  name         String
  description  String?
  priceMin     Float?
  priceMax     Float?
  deliverables Json?
  dealId       String?
  creatorId    String?
  status       String   @default("active")
  createdBy    String   // ← Keep the field
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  User         User     @relation(fields: [createdBy], references: [id], onDelete: Cascade)  // ← ADD THIS

  @@index([dealId])
  @@index([creatorId])
  @@index([createdBy])    // ← ADD THIS INDEX
  @@index([status])
}
```

**Add to User model:**
```prisma
BundlesCreated  Bundle[]
```

---

### 9. AIPromptHistory | creatorId | String (FK validation fix)

**Model Location:** [prisma/schema.prisma](apps/api/prisma/schema.prisma#L51)

**Issue:** Prisma validation error says field type is "never" instead of String

**Current Schema (INCOMPLETE RELATION):**
```prisma
model AIPromptHistory {
  id        String   @id
  creatorId String   // ← Typed correctly but relation is incomplete
  prompt    String
  response  String
  category  String?
  helpful   Boolean?
  createdAt DateTime @default(now())
  Talent    Talent   @relation(fields: [creatorId], references: [id], onDelete: Cascade)
  // MISSING: opposite relation on Talent
}
```

**Fix:**
```prisma
model AIPromptHistory {
  id        String   @id
  creatorId String
  prompt    String
  response  String
  category  String?
  helpful   Boolean?
  createdAt DateTime @default(now())
  Talent    Talent   @relation(fields: [creatorId], references: [id], onDelete: Cascade)

  @@index([creatorId, createdAt])
}
```

**Add to Talent model:**
```prisma
AIPromptHistory  AIPromptHistory[]
```

---

## MEDIUM PRIORITY - Missing Service Exports

### 10. dealTimelineService | getTimelineForDeal | Function

**File:** [src/services/dealTimelineService.ts](src/services/dealTimelineService.ts)

**Files That Import It:**
- [src/controllers/dealTimelineController.ts](src/controllers/dealTimelineController.ts#L34) - `dealTimelineService.getTimelineForDeal(dealId, userId)`

**Current State:** Not exported from dealTimelineService.ts

**Expected Signature:**
```typescript
export async function getTimelineForDeal(
  dealId: string, 
  userId: string
): Promise<DealTimelineEvent[] | null>
```

**Return Type:**
```typescript
DealTimelineEvent[] | null  // null if deal not found or access denied
```

---

### 11. dealTimelineService | addEvent | Function

**File:** [src/services/dealTimelineService.ts](src/services/dealTimelineService.ts)

**Files That Import It:**
- [src/services/deliverablesService.ts](src/services/deliverablesService.ts#L2) - `import { addTimelineEntry }`
- [src/services/contractService.ts](src/services/contractService.ts#L2) - `import { addTimelineEntry }`
- [src/services/dealNegotiationService.ts](src/services/dealNegotiationService.ts#L2) - `import { addEvent as addTimelineEntry }`
- [src/controllers/dealService.ts](src/controllers/dealService.ts#L3) - `import { addEvent as addTimelineEntry }`

**Current State:** Not exported (only stub `addTimelineEntry` exists)

**Expected Signature:**
```typescript
export async function addEvent(
  dealId: string,
  type: string,
  message: string,
  metadata?: any
): Promise<DealTimelineEvent>
```

**Return Type:**
```typescript
DealTimelineEvent  // The created event
```

---

### 12. bundleGeneratorService | generateTieredBundles | Function

**File:** [src/services/bundleGeneratorService.ts](src/services/bundleGeneratorService.ts)

**Files That Import It:**
- [src/controllers/bundlesController.ts](src/controllers/bundlesController.ts#L3) - Expects this export

**Current State:** Not exported

**Expected Signature:**
```typescript
export async function generateTieredBundles(
  dealId: string,
  talentId?: string
): Promise<TieredBundle[]>
```

**Return Type:**
```typescript
interface TieredBundle {
  tier: "basic" | "standard" | "premium";
  name: string;
  price: number;
  deliverables: { type: string; description: string }[];
  timeline: { date: string; item: string }[];
  value_proposition: string;
}
```

---

### 13. campaignBuilderService | generateCampaign | Function

**File:** [src/services/campaignBuilderService.ts](src/services/campaignBuilderService.ts)

**Files That Import It:**
- [src/controllers/campaignBuilderController.ts](src/controllers/campaignBuilderController.ts#L10) - `generateCampaign(req, res)`
- [src/routes/campaignBuilder.ts](src/routes/campaignBuilder.ts#L2) - Expects named export

**Current State:** Function exists as `buildCampaignFromDeal` but not exported as `generateCampaign`

**Expected Signature:**
```typescript
export async function generateCampaign(dealId: string): Promise<CampaignPlan>
```

**Or alias:**
```typescript
export const generateCampaign = buildCampaignFromDeal;
```

---

## LOW PRIORITY - Type/Interface Issues

### 14. SessionUser | brandId | string?

**Type Location:** Middleware or Express types

**Files That Use It:**
- Any controller that needs to scope operations to a brand
- Brand-specific feature gating

**Current Issue:** Property doesn't exist on SessionUser type

**Fix:**
```typescript
interface SessionUser {
  id: string;
  email: string;
  name?: string;
  role: string;
  brandId?: string;    // ← ADD THIS
  subscription_status?: string;  // ← ADD THIS
  // ... existing properties
}
```

---

### 15. SessionUser | subscription_status | string?

**Type Location:** Middleware or Express types

**Files That Use It:**
- Feature gating (premium features)
- Subscription-based access control

**Current Issue:** Property doesn't exist on SessionUser type

**Fix:** See #14 above - add alongside `brandId`

---

## Summary by Priority

### CRITICAL (Blocks Compilation)
1. ✅ Add `AgentPolicy` model - [Schema](apps/api/prisma/schema.prisma)
2. ✅ Add `TalentAISettings` model - [Schema](apps/api/prisma/schema.prisma)
3. ✅ Add `OutboundTemplate` model - [Schema](apps/api/prisma/schema.prisma)
4. ✅ Add `OutreachAction.runAt` field - [Schema](apps/api/prisma/schema.prisma)

### HIGH (Runtime Failures)
5. ✅ Add `Talent.aiSettings` relation - [Schema](apps/api/prisma/schema.prisma)
6. ✅ Add `Talent.outboundTemplates` relation - [Schema](apps/api/prisma/schema.prisma)
7. ✅ Export `dealTimelineService.getTimelineForDeal` - [Service](src/services/dealTimelineService.ts)
8. ✅ Export `dealTimelineService.addEvent` - [Service](src/services/dealTimelineService.ts)

### MEDIUM (Feature Gaps)
9. ✅ Add `XeroConnection.userId` field - [Schema](apps/api/prisma/schema.prisma)
10. ✅ Export `bundleGeneratorService.generateTieredBundles` - [Service](src/services/bundleGeneratorService.ts)
11. ✅ Export `campaignBuilderService.generateCampaign` - [Service](src/services/campaignBuilderService.ts)

### LOW (Type Safety)
12. ✅ Add `SessionUser.brandId` property - [Types](middleware/auth.ts)
13. ✅ Add `SessionUser.subscription_status` property - [Types](middleware/auth.ts)

---

## Cross-Reference: Which Files Import What

### Talent Model Consumers
| File | Imports | Uses |
|------|---------|------|
| [src/cron/outreachRotation.ts](src/cron/outreachRotation.ts) | aiSettings, outboundTemplates | Check enabled, find template |
| [src/services/ai/negotiationEngine.ts](src/services/ai/negotiationEngine.ts) | aiSettings | Access negotiationStyle, minRate |
| [src/services/ai/autoReply.service.ts](src/services/ai/autoReply.service.ts) | aiSettings | Check if settings exist |
| [src/services/ai/aiAgentService.ts](src/services/ai/aiAgentService.ts) | aiSettings | Load in include |

### Deal Timeline Consumers
| File | Imports | Uses |
|------|---------|------|
| [src/controllers/dealTimelineController.ts](src/controllers/dealTimelineController.ts) | getTimelineForDeal | Fetch timeline |
| [src/services/deliverablesService.ts](src/services/deliverablesService.ts) | addTimelineEntry | Log deliverable events |
| [src/services/contractService.ts](src/services/contractService.ts) | addTimelineEntry | Log contract events |
| [src/services/dealNegotiationService.ts](src/services/dealNegotiationService.ts) | addEvent as addTimelineEntry | Log negotiation events |
| [src/controllers/dealService.ts](src/controllers/dealService.ts) | addEvent as addTimelineEntry | Log deal events |

### Agent Policy Consumers
| File | Imports | Uses |
|------|---------|------|
| [src/agent/agentPolicy.ts](src/agent/agentPolicy.ts) | prisma.agentPolicy | Find/create policy |
| prisma-broken/negotiationRealtimeEngine.ts | prisma.agentPolicy | Load policy for negotiation |
| prisma-broken/chainEngine.ts | prisma.agentPolicy | Load policy for chain |

---

## Database Migration Order

1. Create AgentPolicy table
2. Create TalentAISettings table with FK to Talent
3. Create OutboundTemplate table with FK to Talent
4. Add runAt to OutreachAction
5. Add aiSettings FK to Talent
6. Add outboundTemplates FK collection to Talent
7. Add userId to XeroConnection
8. Add User relation to Bundle
9. Add User relation to XeroConnection
10. Verify AIPromptHistory bidirectional relation

---

## Validation Checklist

After implementation:

```bash
# 1. Check schema syntax
npx prisma format

# 2. Validate schema
npx prisma validate

# 3. Create migration
npx prisma migrate dev --name add_missing_fields

# 4. Generate Prisma client
npx prisma generate

# 5. Check TypeScript
npm run build:api

# 6. Verify no import errors
npm run type-check
```
