# Prisma Schema Missing Fields & Models - Comprehensive Analysis

**Generated:** January 8, 2026  
**Status:** All TypeScript build errors mapped to specific schema issues

---

## Executive Summary

The Break Agency TypeScript codebase has **12+ missing Prisma models/fields** and **4 missing service exports** that are causing build failures. This document maps every error to the specific schema field/model that needs to be added.

---

## SECTION 1: MISSING PRISMA MODELS

### Model 1: `AgentPolicy` ❌ CRITICAL

**Status:** Referenced in code but NOT defined in schema  
**Severity:** CRITICAL - Actively used in agentPolicy.ts and negotiation services

**Location in schema:** Should be added to schema.prisma

**Code that uses it:**
- [src/agent/agentPolicy.ts](src/agent/agentPolicy.ts#L4) - `prisma.agentPolicy.findUnique()` 
- [src/agent/agentPolicy.ts](src/agent/agentPolicy.ts#L7) - `prisma.agentPolicy.create()`
- prisma-broken files: negotiationRealtimeEngine.ts, chainEngine.ts

**What it needs:**
```prisma
model AgentPolicy {
  id                      String    @id @default(cuid())
  userId                  String    @unique
  sandboxMode             Boolean   @default(true)
  autoSendNegotiation     Boolean   @default(false)
  negotiationStrategy     String?   // "aggressive", "balanced", "conservative"
  rateFloor               Float?
  rateMarkupPercentage    Float?    // Markup on base rate
  excludedBrands          String[]  @default([])
  excludedCategories      String[]  @default([])
  maxDealsPerMonth        Int?
  createdAt               DateTime  @default(now())
  updatedAt               DateTime  @updatedAt
  User                    User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}
```

**Related relation needed on User model:**
```prisma
agentPolicy  AgentPolicy?
```

---

### Model 2: `TalentAISettings` ❌ CRITICAL

**Status:** Referenced in schema but missing opposite relation  
**Severity:** CRITICAL - Prisma validation error, used in 4+ files

**Error from prisma-validate-output.txt:**
```
Error validating field `aiSettings` in model `Talent`: 
The relation field `aiSettings` on model `Talent` is missing an opposite 
relation field on the model `TalentAISettings`
```

**Files that use it:**
- [src/cron/outreachRotation.ts](src/cron/outreachRotation.ts#L7-L12) - Includes aiSettings, checks `talent.aiSettings?.outreachEnabled`
- [src/services/ai/negotiationEngine.ts](src/services/ai/negotiationEngine.ts#L43) - Includes aiSettings in talent query
- [src/services/ai/autoReply.service.ts](src/services/ai/autoReply.service.ts#L10) - Accesses `talent?.aiSettings`
- [src/services/ai/aiAgentService.ts](src/services/ai/aiAgentService.ts#L17) - Includes aiSettings

**What it needs:**
```prisma
model TalentAISettings {
  id                   String    @id @default(cuid())
  talentId             String    @unique
  outreachEnabled      Boolean   @default(false)
  autoReplyEnabled     Boolean   @default(false)
  negotiationStyle     String?   // "aggressive", "balanced", "passive"
  minRate              Float?
  maxRate              Float?
  responseTimeHours    Int?      @default(24)
  autoAcceptRateFloor  Float?    // Auto-accept if rate >= this
  dealFilters          Json?     // Categories, brands to prioritize/avoid
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt
  Talent               Talent    @relation(fields: [talentId], references: [id], onDelete: Cascade)
}
```

**Update to Talent model:**
Replace the reference in Talent from:
```prisma
// WRONG - relation without opposite field
aiSettings  TalentAISettings?
```

To:
```prisma
// CORRECT - with relation field and opposite
aiSettings  TalentAISettings?
```

---

### Model 3: `OutboundTemplate` ❌ CRITICAL

**Status:** Referenced in code but NOT defined in schema  
**Severity:** CRITICAL - Used in outreachRotation.ts

**Files that use it:**
- [src/cron/outreachRotation.ts](src/cron/outreachRotation.ts#L13) - Includes `outboundTemplates: true`
- [src/cron/outreachRotation.ts](src/cron/outreachRotation.ts#L20) - `talent.outboundTemplates.find((t) => t.enabled)`

**What it needs:**
```prisma
model OutboundTemplate {
  id          String    @id @default(cuid())
  talentId    String
  name        String
  subject     String?
  body        String    // Email template body
  enabled     Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  Talent      Talent    @relation(fields: [talentId], references: [id], onDelete: Cascade)

  @@index([talentId, enabled])
}
```

**Add to Talent model:**
```prisma
outboundTemplates  OutboundTemplate[]
```

---

## SECTION 2: MISSING FIELDS ON EXISTING MODELS

### Field 1: `AIPromptHistory.creatorId` type issue

**Model:** AIPromptHistory  
**Current definition (line 51-60):**
```prisma
model AIPromptHistory {
  id        String   @id
  creatorId String  // ← typed as String but validation says "never"
  prompt    String
  response  String
  category  String?
  helpful   Boolean?
  createdAt DateTime @default(now())
  Talent    Talent   @relation(fields: [creatorId], references: [id], onDelete: Cascade)
```

**Issue:** The field is defined but Prisma validation sees it as type `never`

**Fix needed:**
Ensure the relation is bidirectional. Add to Talent model:
```prisma
AIPromptHistory  AIPromptHistory[]
```

---

### Field 2: `OutreachAction.runAt` ❌ MISSING

**Model:** OutreachAction  
**Current definition (line 1027-1043):**
```prisma
model OutreachAction {
  id           String    @id
  sequenceId   String
  stepId       String?
  leadId       String?
  actionType   String
  status       String    @default("pending")
  errorMessage String?
  scheduledAt  DateTime?
  executedAt   DateTime?
  metadata     Json?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime
  // MISSING: runAt field
}
```

**Files that use it:**
- [src/services/outreach/outreachService.ts](src/services/outreach/outreachService.ts#L28) - Sets `runAt` on create
- [src/services/outreach/outreachService.ts](src/services/outreach/outreachService.ts#L35) - Passes `runAt` to create

**Required type:** `DateTime`  
**Why:** Scheduling when the outreach action should execute

**Fix needed:**
```prisma
model OutreachAction {
  id           String    @id
  sequenceId   String
  stepId       String?
  leadId       String?
  actionType   String
  status       String    @default("pending")
  errorMessage String?
  runAt        DateTime  // ← ADD THIS FIELD
  scheduledAt  DateTime?
  executedAt   DateTime?
  metadata     Json?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime

  @@index([scheduledAt])
  @@index([runAt])  // ← ADD THIS INDEX
  @@index([sequenceId])
  @@index([status])
}
```

---

### Field 3: `Talent.aiSettings` relation

**Model:** Talent  
**Current status (line 1450-1485):** Field is NOT present

**Files that expect it:**
- [src/cron/outreachRotation.ts](src/cron/outreachRotation.ts#L7-L12)
- [src/services/ai/negotiationEngine.ts](src/services/ai/negotiationEngine.ts#L43)
- [src/services/ai/autoReply.service.ts](src/services/ai/autoReply.service.ts#L10)

**Fix needed:**
Add to Talent model (after the existing fields):
```prisma
aiSettings         TalentAISettings?
outboundTemplates  OutboundTemplate[]
```

---

### Field 4: `XeroConnection.userId` ❌ MISSING

**Model:** XeroConnection  
**Current definition (line 1695-1705):**
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
  // MISSING: userId field
}
```

**Issue:** Code needs to know which user owns the Xero connection

**Fix needed:**
```prisma
model XeroConnection {
  id           String    @id
  userId       String    @unique  // ← ADD THIS
  connected    Boolean   @default(false)
  tenantId     String?
  accessToken  String?
  refreshToken String?
  expiresAt    DateTime?
  lastSyncedAt DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime
  User         User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}
```

**Add to User model:**
```prisma
XeroConnection  XeroConnection?
```

---

### Field 5: `Contract.contractId` / Contract relationship

**Model:** Contract  
**Current definition (line 203-230):** 
- Has `dealId` (FK to Deal)
- Has `brandId` (FK to Brand)
- Missing: direct usage reference in DealUpdateData

**Files that expect it:**
- [src/routes/admin/duplicates.ts](src/routes/admin/duplicates.ts) - Admin route
- Deal update workflows

**Current state:** Appears adequate with dealId + brandId. May need verification of:
- Can contracts be queried by dealId reliably? ✓ Yes, has index
- Can contracts be queried by brandId reliably? ✓ Yes, has index

**Status:** ✅ Likely OK but verify no other contractId references exist

---

### Field 6: `Bundle.createdBy` type/reference

**Model:** Bundle  
**Current definition (line 1842-1858):**
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
  createdBy    String   // ← Points to User.id but no FK relation
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

**Issue:** `createdBy` is a string but should be a foreign key to User

**Fix needed:**
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
  User         User     @relation(fields: [createdBy], references: [id], onDelete: Cascade)

  @@index([dealId])
  @@index([creatorId])
  @@index([createdBy])  // ← ADD THIS
  @@index([status])
}
```

**Add to User model:**
```prisma
BundlesCreated  Bundle[]  @relation("BundleCreator")
```

Then update Bundle:
```prisma
User  User  @relation("BundleCreator", fields: [createdBy], references: [id], onDelete: Cascade)
```

---

## SECTION 3: MISSING SERVICE EXPORTS

### Service 1: `dealTimelineService` ❌ INCOMPLETE

**File:** [src/services/dealTimelineService.ts](src/services/dealTimelineService.ts)

**Current exports:**
- ✅ `addTimelineEntry(dealId, message)` - Exists but is a stub

**Missing exports (referenced in code):**
1. ❌ `getTimelineForDeal(dealId, userId)` - Used in [src/controllers/dealTimelineController.ts](src/controllers/dealTimelineController.ts#L34)
2. ❌ `addEvent(dealId, type, message)` - Used in multiple places as `addEvent as addTimelineEntry`

**Files expecting these:**
- [src/controllers/dealTimelineController.ts](src/controllers/dealTimelineController.ts) - imports as `dealTimelineService.getTimelineForDeal()`
- [src/services/deliverablesService.ts](src/services/deliverablesService.ts#L2) - imports as `addTimelineEntry from dealTimelineService`
- [src/services/contractService.ts](src/services/contractService.ts#L2) - imports as `addTimelineEntry from dealTimelineService`
- [src/services/dealNegotiationService.ts](src/services/dealNegotiationService.ts#L2) - imports as `addEvent as addTimelineEntry`

**Fix needed:**

Add these exports to dealTimelineService:

```typescript
export async function getTimelineForDeal(dealId: string, userId: string): Promise<DealTimelineEvent[] | null> {
  // Get the deal and verify access
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    include: { brand: true, talent: true }
  });

  if (!deal) return null;

  // Verify user access (is owner, manager, or admin)
  // ... access control logic ...

  // Return timeline events from DealTimeline model
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

export async function addEvent(dealId: string, type: string, message: string, metadata?: any): Promise<any> {
  return prisma.dealTimeline.create({
    data: {
      dealId,
      type,
      message,
      metadata
    }
  });
}

// Alias for backward compatibility
export const addTimelineEntry = addEvent;
```

---

### Service 2: `bundleGeneratorService` ❌ MISSING EXPORT

**File:** [src/services/bundleGeneratorService.ts](src/services/bundleGeneratorService.ts)

**Current exports:**
- ✅ `generateBundleForDeal(dealId)` - Exists

**Missing exports (referenced in code):**
1. ❌ `generateTieredBundles(dealId, talentId)` - Used in bundlesController

**Files expecting it:**
- [src/controllers/bundlesController.ts](src/controllers/bundlesController.ts#L3) - imports bundleGenerator

**Fix needed:**

Add this export:

```typescript
export interface TieredBundle {
  tier: "basic" | "standard" | "premium";
  name: string;
  price: number;
  deliverables: { type: string; description: string }[];
  timeline: { date: string; item: string }[];
  value_proposition: string;
}

export async function generateTieredBundles(dealId: string, talentId?: string): Promise<TieredBundle[]> {
  const bundle = await generateBundleForDeal(dealId);
  
  // Generate 3 tiers based on the base bundle
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

### Service 3: `campaignBuilderService` ❌ MISSING EXPORT

**File:** [src/services/campaignBuilderService.ts](src/services/campaignBuilderService.ts)

**Current exports:**
- ✅ `buildCampaignFromDeal(dealId)` as default export
- ❌ No named export `generateCampaign`

**Missing exports (referenced in code):**
1. ❌ `generateCampaign(input)` - Used in [src/controllers/campaignBuilderController.ts](src/controllers/campaignBuilderController.ts#L10)

**Fix needed:**

Add this named export (alias the existing function):

```typescript
// At the end of campaignBuilderService.ts
export const generateCampaign = buildCampaignFromDeal;
```

Or make it an explicit wrapper:

```typescript
export async function generateCampaign(dealId: string): Promise<CampaignPlan> {
  return buildCampaignFromDeal(dealId);
}
```

---

### Service 4: Check dealTimelineService location

**Issue:** Multiple dealTimelineService files exist:
1. [src/services/dealTimelineService.ts](src/services/dealTimelineService.ts) - Stub version
2. [src/services/deals/dealTimelineService.ts](src/services/deals/dealTimelineService.ts) - Full implementation
3. [src/lib/dealTimelineService.ts](src/lib/dealTimelineService.ts) - Placeholder

**Fix needed:** 
- Consolidate to single location: `src/services/deals/dealTimelineService.ts`
- Update all imports to point to the correct file
- Delete duplicate files

---

## SECTION 4: TYPE/ENUM ISSUES

### Issue 1: Missing `SessionUser` properties ❌

**Type:** SessionUser / Express.User  
**Current issue:** Missing properties that are used in code:
- `brandId` - Used in brand context
- `subscription_status` - Used for feature gating

**Files that reference:**
- Various controllers that check user's brand/subscription

**Fix needed:**

Update your SessionUser type definition (likely in middleware/auth.ts or types/index.ts):

```typescript
interface SessionUser {
  id: string;
  email: string;
  name?: string;
  role: string;
  brandId?: string;  // ← ADD THIS
  subscription_status?: string;  // ← ADD THIS
  // ... existing fields
}

// Also ensure Express.User extends this:
declare global {
  namespace Express {
    interface User extends SessionUser {}
  }
}
```

---

### Issue 2: Missing Prisma Enums ❌

**Enums needed but not found in schema:**

1. `UserRoleType` - For type safety on user roles
2. `SubscriptionStatus` - For subscription tiers

**Fix needed:**

Add to schema.prisma:

```prisma
enum UserRole {
  SUPERADMIN
  ADMIN
  TALENT_MANAGER
  BRAND_MANAGER
  CREATOR
  GUEST
}

enum SubscriptionStatus {
  FREE
  STARTER
  PROFESSIONAL
  ENTERPRISE
}

// Update User model to use enums:
model User {
  // ... existing fields
  role          UserRole              @default(CREATOR)
  subscriptionStatus  SubscriptionStatus  @default(FREE)
  // ... rest of fields
}
```

---

## SECTION 5: SUMMARY TABLE

| Item | Type | Location | Status | Priority |
|------|------|----------|--------|----------|
| AgentPolicy | Model | schema.prisma | ❌ Missing | CRITICAL |
| TalentAISettings | Model | schema.prisma | ❌ Missing/Invalid | CRITICAL |
| OutboundTemplate | Model | schema.prisma | ❌ Missing | CRITICAL |
| OutreachAction.runAt | Field | schema.prisma:1027 | ❌ Missing | HIGH |
| Talent.aiSettings | Relation | schema.prisma:1450 | ⚠️ Invalid | CRITICAL |
| Talent.outboundTemplates | Relation | schema.prisma:1450 | ❌ Missing | CRITICAL |
| XeroConnection.userId | Field | schema.prisma:1695 | ❌ Missing | MEDIUM |
| Bundle.createdBy | FK Relation | schema.prisma:1842 | ⚠️ Weak | MEDIUM |
| dealTimelineService.getTimelineForDeal | Export | src/services | ❌ Missing | HIGH |
| dealTimelineService.addEvent | Export | src/services | ❌ Missing | HIGH |
| bundleGeneratorService.generateTieredBundles | Export | src/services | ❌ Missing | MEDIUM |
| campaignBuilderService.generateCampaign | Export | src/services | ❌ Missing | MEDIUM |
| SessionUser.brandId | Property | types | ❌ Missing | MEDIUM |
| SessionUser.subscription_status | Property | types | ❌ Missing | MEDIUM |
| UserRole enum | Enum | schema.prisma | ❌ Missing | LOW |
| SubscriptionStatus enum | Enum | schema.prisma | ❌ Missing | LOW |

---

## SECTION 6: IMPLEMENTATION ORDER

**Phase 1 - CRITICAL (blocks compilation):**
1. Add `AgentPolicy` model
2. Add `TalentAISettings` model and fix Talent relation
3. Add `OutboundTemplate` model and Talent.outboundTemplates relation
4. Add `OutreachAction.runAt` field

**Phase 2 - HIGH (breaks runtime functionality):**
5. Export missing functions from dealTimelineService
6. Export missing functions from bundleGeneratorService
7. Export missing functions from campaignBuilderService
8. Fix dealTimelineService file duplication

**Phase 3 - MEDIUM (improves type safety):**
9. Add `XeroConnection.userId` field
10. Strengthen `Bundle.createdBy` relation
11. Add `SessionUser` properties
12. Add Prisma enums (UserRole, SubscriptionStatus)

---

## Files to Modify

### 1. [apps/api/prisma/schema.prisma](apps/api/prisma/schema.prisma) - 6 changes
- Add AgentPolicy model
- Add TalentAISettings model
- Add OutboundTemplate model
- Update Talent model with relations
- Update OutreachAction with runAt field
- Update XeroConnection with userId field
- Update Bundle with User relation
- Add enums

### 2. [apps/api/src/services/dealTimelineService.ts](apps/api/src/services/dealTimelineService.ts) - Rewrite/delete
- Delete stub, use deals/dealTimelineService.ts instead
- Update imports across codebase

### 3. [apps/api/src/services/bundleGeneratorService.ts](apps/api/src/services/bundleGeneratorService.ts) - Add export
- Add `generateTieredBundles` function

### 4. [apps/api/src/services/campaignBuilderService.ts](apps/api/src/services/campaignBuilderService.ts) - Add export
- Add `generateCampaign` export

### 5. Types file (auth.ts or types/index.ts) - Update SessionUser interface
- Add `brandId?: string`
- Add `subscription_status?: string`

---

## Testing Checklist

After implementing all changes:

- [ ] Run `npx prisma format` to auto-format schema
- [ ] Run `npx prisma validate` to check schema integrity
- [ ] Run `npx prisma db push` to update database
- [ ] Run `npm run build:api` to check TypeScript compilation
- [ ] Run tests for:
  - [ ] Talent with aiSettings relationship
  - [ ] OutreachAction with runAt scheduling
  - [ ] dealTimelineService exports
  - [ ] AgentPolicy CRUD operations
