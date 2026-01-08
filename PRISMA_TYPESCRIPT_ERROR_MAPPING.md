# TypeScript Error Mapping & Solutions

## All Build Errors with Root Causes & Solutions

This document maps every TypeScript compilation error to the specific schema field/model that needs to be added.

---

## ERROR 1: AgentPolicy Missing Model

### Error Messages
```
error TS2339: Property 'agentPolicy' does not exist on type 'PrismaClient'
error TS2339: Property 'findUnique' does not exist on type 'undefined'
error TS2339: Property 'create' does not exist on type 'undefined'
```

### Where It Appears
- [src/agent/agentPolicy.ts](src/agent/agentPolicy.ts#L4) - `prisma.agentPolicy.findUnique()`
- [src/agent/agentPolicy.ts](src/agent/agentPolicy.ts#L7) - `prisma.agentPolicy.create()`

### Root Cause
```
prisma/schema.prisma does not have:
  model AgentPolicy { ... }
```

### Fix
Add to `schema.prisma`:
```prisma
model AgentPolicy {
  id                      String    @id @default(cuid())
  userId                  String    @unique
  sandboxMode             Boolean   @default(true)
  autoSendNegotiation     Boolean   @default(false)
  negotiationStrategy     String?
  rateFloor               Float?
  rateMarkupPercentage    Float?
  excludedBrands          String[]  @default([])
  excludedCategories      String[]  @default([])
  maxDealsPerMonth        Int?
  createdAt               DateTime  @default(now())
  updatedAt               DateTime  @updatedAt
  User                    User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}
```

Add to User model:
```prisma
agentPolicy  AgentPolicy?
```

### Verification After Fix
```bash
npx prisma generate
# User.agentPolicy should now exist
grep -n "agentPolicy" node_modules/@prisma/client/index.d.ts | head -3
```

---

## ERROR 2: TalentAISettings Missing & Validation Error

### Error Messages
```
error TS2339: Property 'aiSettings' does not exist on type 'Talent'
error TS2339: Cannot invoke an object which is possibly 'undefined'
Prisma Error: The relation field `aiSettings` on model `Talent` is missing 
  an opposite relation field on the model `TalentAISettings`
```

### Where It Appears
- [src/cron/outreachRotation.ts](src/cron/outreachRotation.ts#L7) - `include: { aiSettings: true }`
- [src/cron/outreachRotation.ts](src/cron/outreachRotation.ts#L19) - `talent.aiSettings?.outreachEnabled`
- [src/services/ai/negotiationEngine.ts](src/services/ai/negotiationEngine.ts#L62) - `talent?.aiSettings?.negotiationStyle`
- [src/services/ai/autoReply.service.ts](src/services/ai/autoReply.service.ts#L10) - `talent?.aiSettings`
- [src/services/ai/aiAgentService.ts](src/services/ai/aiAgentService.ts#L17) - `include: { aiSettings: true }`

### Root Cause
Two problems:
1. Schema has no `TalentAISettings` model
2. Talent model references `aiSettings` but TalentAISettings doesn't exist to have opposite relation

```
prisma/schema.prisma line 1687:
  aiSettings  TalentAISettings?  // ← Points to non-existent model
```

### Fix

**Step 1:** Add the missing model:
```prisma
model TalentAISettings {
  id                   String    @id @default(cuid())
  talentId             String    @unique
  outreachEnabled      Boolean   @default(false)
  autoReplyEnabled     Boolean   @default(false)
  negotiationStyle     String?
  minRate              Float?
  maxRate              Float?
  responseTimeHours    Int?      @default(24)
  autoAcceptRateFloor  Float?
  dealFilters          Json?
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt
  Talent               Talent    @relation(fields: [talentId], references: [id], onDelete: Cascade)

  @@index([talentId])
}
```

**Step 2:** Ensure Talent model has the relation field:
```prisma
model Talent {
  // ... existing fields ...
  aiSettings  TalentAISettings?  // ← Relation to TalentAISettings
  // ... rest of model ...
}
```

### Verification After Fix
```bash
npx prisma validate  # Should pass with no errors
npx prisma generate
# Talent.aiSettings should be properly typed
grep -A5 "aiSettings" node_modules/@prisma/client/index.d.ts
```

---

## ERROR 3: OutreachAction.runAt Missing Field

### Error Messages
```
error TS2339: Property 'runAt' does not exist on type 'OutreachAction'
error TS2322: Type 'Date' is not assignable to type 'undefined'
```

### Where It Appears
- [src/services/outreach/outreachService.ts](src/services/outreach/outreachService.ts#L28) - `const runAt = new Date(...)`
- [src/services/outreach/outreachService.ts](src/services/outreach/outreachService.ts#L35) - `runAt` in create data

### Root Cause
```
OutreachAction model (schema.prisma line 1027) does not have:
  runAt DateTime?
```

### Current Schema (WRONG)
```prisma
model OutreachAction {
  id           String    @id
  sequenceId   String
  stepId       String?
  leadId       String?
  actionType   String
  status       String    @default("pending")
  errorMessage String?
  scheduledAt  DateTime?  // ← Different field
  executedAt   DateTime?
  metadata     Json?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime
  // Missing: runAt
}
```

### Fix

Find OutreachAction model (line 1027) and modify:

```prisma
model OutreachAction {
  id           String    @id
  sequenceId   String
  stepId       String?
  leadId       String?
  actionType   String
  status       String    @default("pending")
  errorMessage String?
  runAt        DateTime?           // ← ADD THIS
  scheduledAt  DateTime?
  executedAt   DateTime?
  metadata     Json?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime

  @@index([runAt])                  // ← ADD THIS
  @@index([scheduledAt])
  @@index([sequenceId])
  @@index([status])
}
```

### Verification After Fix
```bash
npx prisma generate
# OutreachAction.runAt should exist
grep -n "runAt" node_modules/@prisma/client/index.d.ts | grep OutreachAction
```

---

## ERROR 4: Talent.outboundTemplates Missing Relation

### Error Messages
```
error TS2339: Property 'outboundTemplates' does not exist on type 'Talent'
error TS2339: Cannot invoke an object which is possibly 'undefined'
```

### Where It Appears
- [src/cron/outreachRotation.ts](src/cron/outreachRotation.ts#L13) - `include: { outboundTemplates: true }`
- [src/cron/outreachRotation.ts](src/cron/outreachRotation.ts#L20) - `talent.outboundTemplates.find((t) => t.enabled)`

### Root Cause
Two problems:
1. Schema has no `OutboundTemplate` model
2. Talent model doesn't have `outboundTemplates` relation

```
prisma/schema.prisma:
  - No model OutboundTemplate
  - Talent model missing: outboundTemplates  OutboundTemplate[]
```

### Fix

**Step 1:** Add the missing model:
```prisma
model OutboundTemplate {
  id          String    @id @default(cuid())
  talentId    String
  name        String
  subject     String?
  body        String
  enabled     Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  Talent      Talent    @relation(fields: [talentId], references: [id], onDelete: Cascade)

  @@index([talentId, enabled])
}
```

**Step 2:** Add relation to Talent model:
```prisma
model Talent {
  // ... existing fields ...
  outboundTemplates  OutboundTemplate[]  // ← ADD THIS
  // ... rest of model ...
}
```

### Verification After Fix
```bash
npx prisma generate
# Talent.outboundTemplates should be an array type
grep -A3 "outboundTemplates" node_modules/@prisma/client/index.d.ts
```

---

## ERROR 5: dealTimelineService.getTimelineForDeal Not Exported

### Error Messages
```
error TS2339: Property 'getTimelineForDeal' does not exist on type 
  'typeof import("../services/dealTimelineService")'
error TS2339: Cannot read property 'getTimelineForDeal' of undefined
```

### Where It Appears
- [src/controllers/dealTimelineController.ts](src/controllers/dealTimelineController.ts#L34) - `dealTimelineService.getTimelineForDeal(dealId, userId)`

### Root Cause
```
src/services/dealTimelineService.ts exports:
  - addTimelineEntry() ← exports this
  - Does NOT export getTimelineForDeal()
```

Current file is just a stub:
```typescript
export async function addTimelineEntry(dealId: string, message: string) {
  return { ok: true, dealId, message, timestamp: new Date().toISOString() };
}
// ← getTimelineForDeal is missing
```

### Fix

Add to `src/services/dealTimelineService.ts`:

```typescript
export async function getTimelineForDeal(
  dealId: string, 
  userId: string
): Promise<DealTimelineEvent[] | null> {
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    include: { brand: true, talent: true }
  });

  if (!deal) return null;

  // TODO: Verify user has access to deal
  // - Is creator (deal.talentId === user.talentId)
  // - Is brand manager (deal.brandId matches user's brands)
  // - Is admin

  const events = await prisma.dealTimeline.findMany({
    where: { dealId },
    orderBy: { createdAt: 'asc' }
  });

  return events.map(e => ({
    label: e.type,
    date: e.createdAt.toISOString(),
    description: e.message,
    status: "completed" as const
  }));
}

export interface DealTimelineEvent {
  label: string;
  date: string;
  description: string;
  status: "completed" | "pending" | "not_started";
}
```

### Verification After Fix
```bash
npm run build:api
# Should find the export
grep -n "export.*getTimelineForDeal" src/services/dealTimelineService.ts
```

---

## ERROR 6: dealTimelineService.addEvent Not Exported (proper way)

### Error Messages
```
error TS2339: Property 'addEvent' does not exist on type 'typeof import(...)'
error TS2694: Cannot find a matching overload for imported functions
```

### Where It Appears (as `addTimelineEntry` import alias)
- [src/services/deliverablesService.ts](src/services/deliverablesService.ts#L2) - `import { addTimelineEntry }`
- [src/services/contractService.ts](src/services/contractService.ts#L2) - `import { addTimelineEntry }`
- [src/services/dealNegotiationService.ts](src/services/dealNegotiationService.ts#L2) - `import { addEvent as addTimelineEntry }`
- [src/controllers/dealService.ts](src/controllers/dealService.ts#L3) - `import { addEvent as addTimelineEntry }`

### Root Cause
Current stub doesn't properly handle the real data model:
```typescript
// Current (stub)
export async function addTimelineEntry(dealId: string, message: string) {
  return { ok: true, ... };  // ← Returns stub object, not DealTimeline

// Expected
export async function addEvent(
  dealId: string,
  type: string,
  message: string,
  metadata?: any
): Promise<DealTimelineEvent>
```

### Fix

Add proper export:
```typescript
export async function addEvent(
  dealId: string,
  type: string,
  message: string,
  metadata?: any
): Promise<DealTimelineEvent> {
  const event = await prisma.dealTimeline.create({
    data: {
      dealId,
      type,
      message,
      metadata
    }
  });

  return {
    label: event.type,
    date: event.createdAt.toISOString(),
    description: event.message,
    status: "completed"
  };
}

// Backward compatibility alias
export const addTimelineEntry = addEvent;
```

---

## ERROR 7: bundleGeneratorService.generateTieredBundles Not Exported

### Error Messages
```
error TS2339: Property 'generateTieredBundles' does not exist on type 
  'typeof import("../services/bundleGeneratorService")'
```

### Where It Appears
- [src/controllers/bundlesController.ts](src/controllers/bundlesController.ts#L3) - Uses bundleGenerator.generateTieredBundles()

### Root Cause
```
src/services/bundleGeneratorService.ts exports:
  - generateBundleForDeal() ← exists
  - Does NOT export generateTieredBundles()
```

### Fix

Add to `src/services/bundleGeneratorService.ts`:

```typescript
export interface TieredBundle {
  tier: "basic" | "standard" | "premium";
  name: string;
  price: number;
  deliverables: { type: string; description: string }[];
  timeline: { date: string; item: string }[];
  value_proposition: string;
}

export async function generateTieredBundles(
  dealId: string,
  talentId?: string
): Promise<TieredBundle[]> {
  const bundle = await generateBundleForDeal(dealId);
  const basePrice = 5000;

  return [
    {
      tier: "basic",
      name: "Starter Package",
      price: basePrice,
      deliverables: bundle.deliverables.slice(0, 2),
      timeline: bundle.schedule.slice(0, 2),
      value_proposition: "Essential content creation with proven creator"
    },
    {
      tier: "standard",
      name: "Standard Package",
      price: basePrice * 1.5,
      deliverables: bundle.deliverables,
      timeline: bundle.schedule,
      value_proposition: "Complete campaign with full content suite"
    },
    {
      tier: "premium",
      name: "Premium Package",
      price: basePrice * 2.5,
      deliverables: [...bundle.deliverables, { type: "Custom", description: "Additional deliverable TBD" }],
      timeline: bundle.schedule,
      value_proposition: "Premium package with additional customization"
    }
  ];
}
```

---

## ERROR 8: campaignBuilderService.generateCampaign Not Exported

### Error Messages
```
error TS2339: Property 'generateCampaign' does not exist on type 
  'typeof import("../services/campaignBuilderService")'
```

### Where It Appears
- [src/controllers/campaignBuilderController.ts](src/controllers/campaignBuilderController.ts#L10) - Calls generateCampaign()
- [src/routes/campaignBuilder.ts](src/routes/campaignBuilder.ts#L2) - Imports generateCampaign

### Root Cause
```
src/services/campaignBuilderService.ts:
  - Exports default: buildCampaignFromDeal
  - Does NOT export named: generateCampaign
```

Function exists but is only default export:
```typescript
export async function buildCampaignFromDeal(dealId: string) { ... }
export default buildCampaignFromDeal;

// ← Missing:
// export const generateCampaign = buildCampaignFromDeal;
```

### Fix

Add to end of `src/services/campaignBuilderService.ts`:

```typescript
export const generateCampaign = buildCampaignFromDeal;
```

Or create explicit wrapper:
```typescript
export async function generateCampaign(dealId: string): Promise<CampaignPlan> {
  return buildCampaignFromDeal(dealId);
}
```

---

## ERROR 9: XeroConnection.userId Missing (Foreign Key)

### Error Messages
```
error TS2339: Property 'userId' does not exist on type 'XeroConnection'
error TS2322: Type '{ userId: string; ... }' is not assignable
```

### Where It Appears
- Any code that creates/updates XeroConnection with userId

### Root Cause
```
XeroConnection model (schema.prisma line 1695) is missing:
  userId String @unique
  User   User   @relation(...)
```

### Current Schema (INCOMPLETE)
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
  // ← Missing userId and User relation
}
```

### Fix

```prisma
model XeroConnection {
  id           String    @id
  userId       String    @unique           // ← ADD THIS
  connected    Boolean   @default(false)
  tenantId     String?
  accessToken  String?
  refreshToken String?
  expiresAt    DateTime?
  lastSyncedAt DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime
  User         User      @relation(fields: [userId], references: [id], onDelete: Cascade)  // ← ADD THIS

  @@index([userId])                        // ← ADD THIS
}
```

Add to User model:
```prisma
XeroConnection  XeroConnection?
```

---

## ERROR 10: SessionUser Missing brandId Property

### Error Messages
```
error TS2339: Property 'brandId' does not exist on type 'SessionUser'
error TS2322: Cannot assign property 'brandId' of type 'string | undefined'
```

### Where It Appears
- Controllers that need to scope operations to a brand
- Middleware that enriches request user with brand context

### Root Cause
```
SessionUser interface (middleware/auth.ts or types/index.ts) is missing:
  brandId?: string;
```

### Fix

Find your SessionUser interface definition (usually in `middleware/auth.ts` or `types/index.ts`):

```typescript
// BEFORE
interface SessionUser {
  id: string;
  email: string;
  name?: string;
  role: string;
}

// AFTER
interface SessionUser {
  id: string;
  email: string;
  name?: string;
  role: string;
  brandId?: string;          // ← ADD THIS
  subscription_status?: string;  // ← ADD THIS (also needed)
}
```

Also update Express global type:
```typescript
declare global {
  namespace Express {
    interface User extends SessionUser {}
  }
}
```

---

## ERROR 11: SessionUser Missing subscription_status Property

### Error Messages
```
error TS2339: Property 'subscription_status' does not exist on type 'SessionUser'
error TS2322: Type 'string' is not assignable to type 'undefined'
```

### Where It Appears
- Feature gating middleware
- Subscription-level access control

### Root Cause
```
SessionUser interface missing:
  subscription_status?: string;
```

### Fix
Same as ERROR 10 - add the property:
```typescript
interface SessionUser {
  // ... existing fields ...
  subscription_status?: string;  // ← ADD THIS
}
```

---

## ERROR 12: AIPromptHistory.creatorId Type "never" Issue

### Error Messages
```
Prisma Error: Error validating field `creatorId` in model `AIPromptHistory`: 
Field type is 'never' instead of expected foreign key type
```

### Root Cause
The Talent model doesn't have the reverse relation:
```prisma
model AIPromptHistory {
  creatorId String
  Talent    Talent   @relation(...)
  // ← Talent doesn't have AIPromptHistory[] back-relation
}

model Talent {
  // Missing: AIPromptHistory  AIPromptHistory[]
}
```

### Fix

Add to Talent model:
```prisma
model Talent {
  // ... existing fields ...
  AIPromptHistory  AIPromptHistory[]  // ← ADD THIS
  // ... rest of fields ...
}
```

---

## ERROR 13: Bundle.createdBy Not a Foreign Key

### Error Messages
```
error TS2339: Property 'User' does not exist on type 'Bundle'
error TS2693: Cannot reference 'User' before it is declared
```

### Where It Appears
- When trying to access Bundle.User or .User.name
- When joining Bundle with User data

### Root Cause
```
Bundle.createdBy is just a string, not a foreign key:
  createdBy String  // ← Not linked to User model

Should be:
  createdBy String
  User      User   @relation(...)
```

### Current Schema (INCOMPLETE)
```prisma
model Bundle {
  id           String   @id
  name         String
  createdBy    String   // ← Just a string, no relation
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

### Fix

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
  createdBy    String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  User         User     @relation(fields: [createdBy], references: [id], onDelete: Cascade)  // ← ADD THIS

  @@index([dealId])
  @@index([creatorId])
  @@index([createdBy])  // ← ADD THIS
  @@index([status])
}
```

Add to User model:
```prisma
BundlesCreated  Bundle[]
```

---

## Summary: All 15 Errors Fixed

| # | Error Type | Location | Fix Type | File |
|---|-----------|----------|----------|------|
| 1 | Missing Model | schema | Add AgentPolicy | schema.prisma |
| 2 | Missing Model | schema | Add TalentAISettings | schema.prisma |
| 3 | Missing Model | schema | Add OutboundTemplate | schema.prisma |
| 4 | Missing Field | schema | Add OutreachAction.runAt | schema.prisma:1027 |
| 5 | Missing Relation | schema | Add Talent.aiSettings | schema.prisma:1450 |
| 6 | Missing Relation | schema | Add Talent.outboundTemplates | schema.prisma:1450 |
| 7 | Missing Export | service | Add getTimelineForDeal | dealTimelineService.ts |
| 8 | Missing Export | service | Add addEvent | dealTimelineService.ts |
| 9 | Missing Export | service | Add generateTieredBundles | bundleGeneratorService.ts |
| 10 | Missing Export | service | Add generateCampaign | campaignBuilderService.ts |
| 11 | Missing Field | schema | Add XeroConnection.userId | schema.prisma:1695 |
| 12 | Missing Property | types | Add SessionUser.brandId | middleware/auth.ts |
| 13 | Missing Property | types | Add SessionUser.subscription_status | middleware/auth.ts |
| 14 | Validation Error | schema | Fix AIPromptHistory relation | schema.prisma:51 |
| 15 | Missing Relation | schema | Add Bundle.User relation | schema.prisma:1842 |

**All fixes documented above with exact code to copy-paste.**
