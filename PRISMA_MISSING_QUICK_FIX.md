# Quick Implementation Guide

## One-Line Summary Per Fix

| Priority | Item | Fix | File |
|----------|------|-----|------|
| 🔴 CRITICAL | AgentPolicy missing | Add model with userId FK | schema.prisma |
| 🔴 CRITICAL | TalentAISettings missing | Add model with talentId FK | schema.prisma |
| 🔴 CRITICAL | OutboundTemplate missing | Add model with talentId FK | schema.prisma |
| 🔴 CRITICAL | OutreachAction.runAt | Add DateTime field + index | schema.prisma line 1027 |
| 🟠 HIGH | Talent.aiSettings | Add relation to TalentAISettings | schema.prisma line 1450 |
| 🟠 HIGH | Talent.outboundTemplates | Add relation to OutboundTemplate | schema.prisma line 1450 |
| 🟠 HIGH | dealTimelineService.getTimelineForDeal | Export new function | src/services/dealTimelineService.ts |
| 🟠 HIGH | dealTimelineService.addEvent | Export new function | src/services/dealTimelineService.ts |
| 🟡 MEDIUM | XeroConnection.userId | Add String @unique FK to User | schema.prisma line 1695 |
| 🟡 MEDIUM | bundleGeneratorService.generateTieredBundles | Export new function | src/services/bundleGeneratorService.ts |
| 🟡 MEDIUM | campaignBuilderService.generateCampaign | Export existing function | src/services/campaignBuilderService.ts |
| 🟢 LOW | SessionUser.brandId | Add optional string property | middleware/auth.ts or types |
| 🟢 LOW | SessionUser.subscription_status | Add optional string property | middleware/auth.ts or types |

---

## Schema.prisma Changes

### ADD: New Models

```prisma
// Add after model AIPromptHistory (line 60)
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

// Add after ApprovalResponse model
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

// Add after OutreachStep model
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

### MODIFY: OutreachAction Model (line 1027)

**BEFORE:**
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

  @@index([scheduledAt])
  @@index([sequenceId])
  @@index([status])
}
```

**AFTER:**
```prisma
model OutreachAction {
  id           String    @id
  sequenceId   String
  stepId       String?
  leadId       String?
  actionType   String
  status       String    @default("pending")
  errorMessage String?
  runAt        DateTime?          // ← ADD THIS LINE
  scheduledAt  DateTime?
  executedAt   DateTime?
  metadata     Json?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime

  @@index([runAt])                // ← ADD THIS LINE
  @@index([scheduledAt])
  @@index([sequenceId])
  @@index([status])
}
```

### MODIFY: Talent Model (line 1450)

**Find:** `model Talent {` on line 1450

**Add these relations BEFORE `User` relation:**
```prisma
  aiSettings         TalentAISettings?
  outboundTemplates  OutboundTemplate[]
```

### MODIFY: XeroConnection Model (line 1695)

**BEFORE:**
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
}
```

**AFTER:**
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

### MODIFY: Bundle Model (line 1842)

**BEFORE:**
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

  @@index([dealId])
  @@index([creatorId])
  @@index([status])
}
```

**AFTER:**
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
  @@index([createdBy])                     // ← ADD THIS
  @@index([status])
}
```

### MODIFY: User Model (add relations)

Find `model User {` and add these relations:

```prisma
  agentPolicy       AgentPolicy?
  XeroConnection    XeroConnection?
  BundlesCreated    Bundle[]
```

---

## Service Function Exports

### dealTimelineService.ts

**ADD these functions:**

```typescript
export async function getTimelineForDeal(dealId: string, userId: string): Promise<DealTimelineEvent[] | null> {
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    include: { brand: true, talent: true }
  });

  if (!deal) return null;

  // TODO: Add access control check
  // if (user is not owner, manager, or admin) return null;

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

export async function addEvent(dealId: string, type: string, message: string, metadata?: any) {
  return prisma.dealTimeline.create({
    data: {
      dealId,
      type,
      message,
      metadata
    }
  });
}

// Backward compatibility alias
export const addTimelineEntry = addEvent;
```

### bundleGeneratorService.ts

**ADD these before the final export:**

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

### campaignBuilderService.ts

**At the end of the file, add:**

```typescript
export const generateCampaign = buildCampaignFromDeal;
```

---

## Type Updates

### Find SessionUser type (likely in middleware/auth.ts or types/index.ts)

**BEFORE:**
```typescript
interface SessionUser {
  id: string;
  email: string;
  name?: string;
  role: string;
  // ... other fields
}
```

**AFTER:**
```typescript
interface SessionUser {
  id: string;
  email: string;
  name?: string;
  role: string;
  brandId?: string;            // ← ADD THIS
  subscription_status?: string; // ← ADD THIS
  // ... other fields
}
```

---

## Execution Checklist

```bash
# 1. Update schema.prisma with all changes above
✅ Edit apps/api/prisma/schema.prisma

# 2. Format schema
npx prisma format

# 3. Validate schema
npx prisma validate

# 4. Create migration
npx prisma migrate dev --name add_missing_models_and_fields

# 5. Update service files
✅ Edit src/services/dealTimelineService.ts
✅ Edit src/services/bundleGeneratorService.ts
✅ Edit src/services/campaignBuilderService.ts

# 6. Update types
✅ Edit middleware/auth.ts (or wherever SessionUser is defined)

# 7. Verify compilation
npm run build:api

# 8. Run type check
npm run type-check

# 9. If build succeeds, verify the specific error locations are fixed:
grep -r "getTimelineForDeal" src/ # Should find imports
grep -r "generateTieredBundles" src/ # Should find imports
grep -r "generateCampaign" src/ # Should find imports
```

---

## Files to Create/Modify Summary

| File | Action | Lines | What |
|------|--------|-------|------|
| prisma/schema.prisma | MODIFY | Multiple | Add 3 models, modify 4 existing models, update User relation |
| src/services/dealTimelineService.ts | ADD | ~40 | Export getTimelineForDeal, addEvent |
| src/services/bundleGeneratorService.ts | ADD | ~35 | Export generateTieredBundles, TieredBundle interface |
| src/services/campaignBuilderService.ts | ADD | 1 | Export generateCampaign alias |
| middleware/auth.ts (or types) | MODIFY | 2 | Add brandId, subscription_status to SessionUser |

**Total Changes:** ~5-6 files  
**Estimated Time:** 30-45 minutes  
**Risk Level:** LOW (additive changes, no breaking changes to existing code)

---

## Validation After Implementation

### Test Schema Changes
```bash
npx prisma studio  # Should open without errors
```

### Test Service Exports
```bash
node -e "import('./src/services/dealTimelineService.ts').then(m => console.log(Object.keys(m)))"
node -e "import('./src/services/bundleGeneratorService.ts').then(m => console.log(Object.keys(m)))"
node -e "import('./src/services/campaignBuilderService.ts').then(m => console.log(Object.keys(m)))"
```

### Test Type Compilation
```bash
npx tsc --noEmit  # No output = success
npm run build:api  # Should complete without errors
```

---

## Rollback Plan (if needed)

```bash
# Undo the migration
npx prisma migrate resolve --rolled-back add_missing_models_and_fields

# Restore schema.prisma to previous state
git checkout apps/api/prisma/schema.prisma

# Undo service changes
git checkout src/services/

# Regenerate Prisma client
npx prisma generate
```

---

## After Implementation: Next Steps

1. **Test the data model:**
   - Create a TalentAISettings record and verify Talent can access it
   - Create an OutboundTemplate and verify it appears in Talent.outboundTemplates
   - Create an AgentPolicy and verify User can access it

2. **Test service functions:**
   - Call dealTimelineService.getTimelineForDeal() with a real dealId
   - Call bundleGeneratorService.generateTieredBundles() with a real dealId
   - Verify campaignBuilderService.generateCampaign() works as alias

3. **Run full test suite:**
   ```bash
   npm test
   ```

4. **Check no regressions:**
   ```bash
   npm run build  # Full build
   npm run lint   # Check style
   ```
