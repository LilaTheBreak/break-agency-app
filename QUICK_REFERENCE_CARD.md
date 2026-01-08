# Quick Reference Card - Prisma Missing Fields Fix

## The 15 Items at a Glance

### Models to Add (3)
```
AgentPolicy          → User policy for AI agent
TalentAISettings     → AI settings for creators
OutboundTemplate     → Email templates for outreach
```

### Fields to Add (6)
```
OutreachAction.runAt              → DateTime for scheduling
Talent.aiSettings                 → Relation to TalentAISettings
Talent.outboundTemplates          → Relation to OutboundTemplate
XeroConnection.userId             → FK to User
Bundle.User                       → User relation for createdBy
AIPromptHistory bidirectional     → Add to Talent model
```

### Exports to Add (4)
```
dealTimelineService.getTimelineForDeal()
dealTimelineService.addEvent()
bundleGeneratorService.generateTieredBundles()
campaignBuilderService.generateCampaign
```

### Types to Add (2)
```
SessionUser.brandId
SessionUser.subscription_status
```

---

## Files to Modify

| File | Changes | Priority |
|------|---------|----------|
| `apps/api/prisma/schema.prisma` | Add 3 models, update 6 models | 🔴 CRITICAL |
| `src/services/dealTimelineService.ts` | Add 2 exports | 🔴 CRITICAL |
| `src/services/bundleGeneratorService.ts` | Add 1 export | 🟡 MEDIUM |
| `src/services/campaignBuilderService.ts` | Add 1 export | 🟡 MEDIUM |
| `middleware/auth.ts` or types | Add 2 properties | 🟢 LOW |

---

## Time Breakdown

```
Read & Understand      → 5-10 minutes
Schema Changes        → 15 minutes  
Service Exports       → 10 minutes
Type Updates          → 5 minutes
Verify & Test         → 5-10 minutes
─────────────────────────────────
TOTAL                 → 40-50 minutes
```

---

## Implementation Checklist

### Phase 1: Schema (15 minutes)
```bash
[ ] Add AgentPolicy model to schema
[ ] Add TalentAISettings model to schema  
[ ] Add OutboundTemplate model to schema
[ ] Add runAt to OutreachAction
[ ] Add aiSettings to Talent
[ ] Add outboundTemplates to Talent
[ ] Add userId to XeroConnection
[ ] Update Bundle with User relation
[ ] Update User model relations
[ ] npx prisma format
[ ] npx prisma validate
[ ] npx prisma migrate dev --name add_missing_fields
```

### Phase 2: Services (10 minutes)
```bash
[ ] Add getTimelineForDeal to dealTimelineService
[ ] Add addEvent to dealTimelineService
[ ] Add generateTieredBundles to bundleGeneratorService
[ ] Add generateCampaign to campaignBuilderService
```

### Phase 3: Types (5 minutes)
```bash
[ ] Add brandId to SessionUser
[ ] Add subscription_status to SessionUser
```

### Phase 4: Verify (5 minutes)
```bash
[ ] npm run build:api
[ ] npm run type-check
[ ] npx prisma validate
[ ] npm test (if available)
```

---

## Critical Errors Fixed

| Error | Fix | Location |
|-------|-----|----------|
| `Property 'agentPolicy' does not exist` | Add AgentPolicy model | schema.prisma |
| `Property 'aiSettings' does not exist on Talent` | Add TalentAISettings model + relation | schema.prisma |
| `Property 'outboundTemplates' does not exist on Talent` | Add OutboundTemplate model + relation | schema.prisma |
| `Property 'runAt' does not exist on OutreachAction` | Add runAt DateTime field | schema.prisma:1027 |
| `Property 'getTimelineForDeal' does not exist` | Export function | dealTimelineService.ts |
| `Property 'generateTieredBundles' does not exist` | Export function | bundleGeneratorService.ts |
| `Property 'generateCampaign' does not exist` | Export function | campaignBuilderService.ts |

---

## Copy-Paste Code Blocks

### AgentPolicy Model
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

### TalentAISettings Model
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

### OutboundTemplate Model
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

### dealTimelineService Functions
```typescript
export async function getTimelineForDeal(dealId: string, userId: string) {
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    include: { brand: true, talent: true }
  });
  if (!deal) return null;
  
  const events = await prisma.dealTimeline.findMany({
    where: { dealId },
    orderBy: { createdAt: 'asc' }
  });
  
  return events.map(e => ({
    label: e.type,
    date: e.createdAt.toISOString(),
    description: e.message,
    status: "completed"
  }));
}

export async function addEvent(dealId: string, type: string, message: string, metadata?: any) {
  return prisma.dealTimeline.create({
    data: { dealId, type, message, metadata }
  });
}

export const addTimelineEntry = addEvent;
```

---

## Verification Commands

```bash
# Validate schema
npx prisma validate

# Generate types
npx prisma generate

# Build TypeScript
npm run build:api

# Type check only
npm run type-check

# View schema in UI
npx prisma studio

# Check imports work
grep -n "getTimelineForDeal" src/controllers/dealTimelineController.ts
```

---

## Need More Details?

| For | Read |
|-----|------|
| Quick overview | ANALYSIS_COMPLETE.md |
| Navigation | PRISMA_DOCUMENTATION_INDEX.md |
| Executive summary | PRISMA_ANALYSIS_EXECUTIVE_SUMMARY.md |
| Step-by-step guide | PRISMA_MISSING_QUICK_FIX.md |
| Detailed explanations | PRISMA_MISSING_FIELDS_ANALYSIS.md |
| Error lookup | PRISMA_TYPESCRIPT_ERROR_MAPPING.md |

---

## Success Indicators

✅ After implementation, you should see:
- `npm run build:api` completes without errors
- `npm run type-check` shows no issues
- `npx prisma validate` passes
- IDE autocomplete works for new fields
- All 15 items properly typed

---

## Rollback (if needed)

```bash
npx prisma migrate resolve --rolled-back add_missing_fields
git checkout apps/api/prisma/schema.prisma
git checkout src/services/
npx prisma generate
```

---

**Last Updated:** January 8, 2026  
**Status:** Ready to implement  
**Estimated Time:** 45 minutes
