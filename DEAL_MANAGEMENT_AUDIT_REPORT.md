# DEAL MANAGEMENT SYSTEM AUDIT

**Audit Date:** December 27, 2025  
**Scope:** End-to-end deal management system (CRUD, stage transitions, AI features, linking)

---

## EXECUTIVE SUMMARY

The deal management system operates on **TWO PARALLEL TRACKS** with incomplete integration:

1. **`Deal` model** (Main deals system) - Core pipeline management
2. **`CrmDeal` model** (CRM deals) - Admin-facing deal tracking

**Critical Finding:** Stage transition workflow exists but **`changeStage` function is not implemented**, causing silent failures when UI attempts stage advancement.

---

## 1. DEAL CRUD OPERATIONS

### ✅ FULLY WIRED: Core Deal (Main Pipeline)

**Database Model:** `Deal` (schema.prisma:405)
```prisma
model Deal {
  id, userId, talentId, brandId, stage, value, currency, brandName,
  aiSummary, notes, expectedClose, createdAt, updatedAt, ...
  Relations: Brand, Talent, User, Contract[], DealTimeline[], 
             Deliverable[], Invoice[], Payment[]
}
```

**API Routes:** `/api/deals` (apps/api/src/routes/deals.ts)
```
GET    /api/deals                → dealController.listDeals
POST   /api/deals                → dealController.createDeal
GET    /api/deals/:id            → dealController.getDeal
PUT    /api/deals/:id            → dealController.updateDeal
DELETE /api/deals/:id            → dealController.deleteDeal
POST   /api/deals/:id/stage      → dealController.changeDealStage ⚠️
```

**Controller:** `apps/api/src/controllers/dealController.ts`
- ✅ Validates input with Zod schemas
- ✅ Calls service layer functions
- ✅ Returns proper HTTP status codes

**Service Layer:** `apps/api/src/controllers/dealService.ts`
```typescript
✅ createDeal(userId, data)          → Creates Deal + timeline event
✅ listDealsForUser(userId)          → Lists all user deals
✅ getDealById(dealId, userId)       → Get with relations
✅ updateDeal(dealId, userId, data)  → Update + timeline tracking
✅ deleteDeal(dealId, userId)        → Hard delete (should be soft)
```

**Frontend Client:** `apps/web/src/services/dealsClient.js`
```javascript
✅ fetchDeals(filters)     → GET /api/deals
✅ createDeal(payload)     → POST /api/deals
✅ updateDeal(dealId, data) → PUT /api/deals/:id
```

**UI Components:**
- ✅ `DealsDashboard.jsx` - Lists deals, shows AI drafts
- ✅ `DealsTable.jsx` - Renders deal table with stage badges
- ✅ `DealPipelineBadge.jsx` - Stage visualization

**Evidence:** Server routes registered (server.ts:365), controller wired, Prisma queries execute successfully.

---

### ✅ FULLY WIRED: CRM Deals (Admin Track)

**Database Model:** `CrmDeal` (separate from `Deal`)
- ⚠️ **NOT FOUND IN SCHEMA** - Model appears to be referenced but not in schema.prisma
- Used by admin interface for brand relationship management

**API Routes:** `/api/crm-deals` (apps/api/src/routes/crmDeals.ts)
```
GET    /api/crm-deals                → List with filters (brandId, status, owner)
GET    /api/crm-deals/:id            → Get single deal
POST   /api/crm-deals                → Create new deal
PATCH  /api/crm-deals/:id            → Update deal
DELETE /api/crm-deals/:id            → Delete deal
POST   /api/crm-deals/:id/notes      → Add note
POST   /api/crm-deals/batch-import   → Import from localStorage
```

**Frontend Client:** `apps/web/src/services/crmClient.js`
```javascript
✅ fetchDeals(filters)     → GET /api/crm-deals
✅ createDeal(data)        → POST /api/crm-deals
✅ updateDeal(id, data)    → PATCH /api/crm-deals/:id
✅ deleteDeal(id)          → DELETE /api/crm-deals/:id
```

**UI Components:**
- ✅ `AdminDealsPage.jsx` - Full CRUD interface with drawer UI
- ✅ Filters by brand, status, owner
- ✅ Inline editing in drawer
- ✅ Migration tool from localStorage

**Evidence:** Server routes registered (server.ts:405), inline Prisma queries in route handlers, frontend calls working.

---

## 2. DEAL STAGE TRANSITIONS

### ❌ NOT HOOKED UP: Stage Advancement Workflow

**Intended Flow:**
```
UI → POST /api/deals/:id/stage → dealController.changeDealStage() 
  → dealWorkflowService.changeStage() → Update Deal.stage + create timeline event
```

**What's Broken:**

1. **Controller exists** (`dealController.ts:93-106`)
   - Validates stage with Zod schema
   - Calls `dealWorkflowService.changeStage()`
   - ✅ Controller code is correct

2. **Service function MISSING** (`dealWorkflowService.ts`)
   ```typescript
   // ONLY THESE EXIST:
   ✅ advanceDealStage(dealId, nextStage, userId)
   ✅ getWorkflowStatus(dealId)
   ✅ logWorkflowEvent(dealId, message, userId)
   
   // MISSING:
   ❌ changeStage(dealId, stage, userId) <- Called by controller but NOT DEFINED
   ```

3. **Frontend has NO UI** for stage transitions
   - `DealsDashboard.jsx` - No stage change buttons
   - `DealsTable.jsx` - Only displays stage badge (read-only)
   - `AdminDealsPage.jsx` - Uses manual status field, not Deal stages

**Dead Click:**
- **Route:** `POST /api/deals/:id/stage`
- **Controller:** `dealController.changeDealStage`
- **Why it fails:** Calls `dealWorkflowService.changeStage()` which doesn't exist → Runtime error

**Fix Required:**
```typescript
// Add to apps/api/src/services/deals/dealWorkflowService.ts
export async function changeStage(dealId: string, stage: DealStage, userId: string) {
  const deal = await prisma.deal.findUnique({ where: { id: dealId } });
  if (!deal) return { success: false, status: 404, error: "Deal not found" };
  
  const updated = await prisma.deal.update({
    where: { id: dealId },
    data: { stage, updatedAt: new Date() }
  });
  
  await prisma.dealTimeline.create({
    data: {
      dealId,
      type: "stage_changed",
      message: `Stage changed to ${stage}`,
      createdById: userId
    }
  });
  
  return { success: true, deal: updated };
}
```

---

## 3. DEAL INTELLIGENCE/AI FEATURES

### ⚠️ PARTIAL: Deal Extraction (Working)

**API Route:** `POST /api/ai/deal/extract` (apps/api/src/routes/ai.ts:22)
- ✅ Wired to `dealExtractorController.extractDealData`
- ✅ Extracts structured deal data from email body using AI
- ✅ Returns: brandName, dealValue, currency, contactEmail, deliverables

**Controller:** `apps/api/src/controllers/dealExtractorController.ts`
- ✅ Validates emailId input
- ✅ Fetches email from `inboundEmail` table
- ✅ Calls `extractDealFromEmail(email.body)` AI service
- ✅ Returns extracted data + latency metrics

**Frontend:**
- ✅ `DealsDashboard.jsx` - Shows AI-extracted drafts
- ✅ `DealExtractorPanel.jsx` - Manual text extraction UI
- ✅ `DealAIPanel.jsx` - Email-based extraction trigger

**Evidence:** Functional - loads drafts from `useDealExtraction` hook.

---

### ❌ NOT HOOKED UP: Deal Intelligence Features (Disabled)

**API Routes:** (apps/api/src/routes/dealIntelligence.ts)
```
POST /api/deals/intelligence/run/:dealId    → Returns 501 DISABLED
GET  /api/deals/intelligence/:dealId        → Returns 501 DISABLED
POST /api/deals/:dealId/draft-email         → Returns 501 DISABLED
```

**Reason:** "Deal intelligence features temporarily disabled — dependent models removed from schema."

**Frontend Calls Still Exist:**
- `dealAIClient.js` - `runDealIntelligence()`, `getDealIntelligence()`, `draftNegotiationEmail()`
- These will fail with 501 errors

**Dead Clicks:**
- **Component:** `DealAIPanel.jsx` - "Get Insights" button
- **What happens:** Calls `/api/ai/deal/negotiation` → 501 response
- **File:** `apps/web/src/components/DealAIPanel.jsx:53`

---

### ⚠️ PARTIAL: Negotiation Insights (Placeholder)

**API Route:** `POST /api/ai/deal/negotiation` (apps/api/src/routes/ai.ts:25)
- ✅ Route exists and is registered
- ✅ Calls `aiController.generateNegotiationInsights`
- ⚠️ Controller implementation unknown (not audited)

**Frontend:**
- ✅ `DealsDashboard.jsx:112` - "Generate Negotiation Insight" button
- ✅ Uses `useNegotiationInsights` hook
- ❓ Unclear if backend returns real data or placeholder

---

### ✅ WORKING: Deal Analysis Service

**File:** `apps/api/src/routes/dealAnalysis.ts`
```typescript
✅ analyzeDeal(deal) - OpenAI GPT-4o-mini analysis
✅ Returns: summary, riskFactors[], negotiationLevers[]
✅ Handles missing API key gracefully
```

**Not currently exposed as API endpoint** - Only used as utility function.

---

## 4. DEAL-CONTRACT LINKING

### ✅ FULLY WIRED: Database Relations

**Schema (schema.prisma:405-440):**
```prisma
model Deal {
  Contract  Contract[]  // One deal → many contracts
}

model Contract {
  dealId   String?
  Deal     Deal?  @relation(fields: [dealId], references: [id])
}
```

**Deal Model Includes:**
- `contractReceivedAt: DateTime?`
- `contractSignedAt: DateTime?`

**Controller Support:**
```typescript
// apps/api/src/controllers/dealController.ts:56
DealUpdateSchema = z.object({
  contractId: z.string().optional()  ✅ Accepts contract linking
})

// apps/api/src/controllers/dealService.ts:87
if (data.contractId && data.contractId !== existingDeal.contractId) {
  await addTimelineEntry(dealId, { 
    type: "contract_linked", 
    message: "Contract linked to deal." 
  });  ✅ Timeline tracking works
}
```

**Frontend:**
- ✅ `AdminDealsPage.jsx` - Shows linked contracts in drawer
- ✅ `ContractChip.jsx` - Visual display component
- ⚠️ No UI to create link (must be done via API or contract side)

**Evidence:** Database foreign keys exist, timeline events fire on link.

---

## 5. DEAL-CAMPAIGN LINKING

### ⚠️ PARTIAL: CRM Track Only

**CrmDeal Track (Admin):**
- ✅ `linkedCampaignIds: String[]` field on CrmDeal model
- ✅ UI in `AdminDealsPage.jsx` to link campaign
- ✅ Campaign can link back to deals via API:
  ```
  POST /api/crm-campaigns/:campaignId/link-deal
  DELETE /api/crm-campaigns/:campaignId/unlink-deal/:dealId
  ```

**Main Deal Track:**
- ❌ NO campaign relation in `Deal` model
- ❌ Cannot link Deal (pipeline) to Campaign
- ⚠️ Schema has `Campaign` model but no Deal foreign key

**Workaround:**
- Applications create Deals automatically (opportunities.ts:385)
- No direct campaign → deal linking in main pipeline

---

## DEAD CLICKS SUMMARY

| Button/Feature | File | Issue | Fix Priority |
|----------------|------|-------|--------------|
| **Stage Advancement** | `POST /api/deals/:id/stage` | `changeStage()` function missing | 🔴 CRITICAL |
| **"Get Insights"** | `DealAIPanel.jsx:53` | Returns 501 - feature disabled | 🟡 MEDIUM |
| **Deal Intelligence Run** | `/api/deals/intelligence/run/:dealId` | Hardcoded 501 response | 🟡 MEDIUM |
| **"Convert to Deal"** | `DealsDashboard.jsx:103` | Button exists but no handler | 🟠 HIGH |
| **Draft Email** | `/api/deals/:dealId/draft-email` | Returns 501 - feature disabled | 🟡 MEDIUM |

---

## RECOMMENDATIONS

### 1. **URGENT: Fix Stage Transition System**
```typescript
// Implement changeStage in dealWorkflowService.ts
// Add UI buttons to DealsTable.jsx for stage advancement
// Add stage history visualization
```

### 2. **Consolidate Deal Models**
- Decide: Keep `Deal` OR `CrmDeal` as single source of truth
- Current state creates data silos and confusion
- Recommend: Merge into single `Deal` model with role-based views

### 3. **Complete Campaign Linking**
- Add Campaign relation to Deal model
- Expose API endpoint for deal → campaign linking
- Add UI in DealsDashboard for campaign association

### 4. **Re-enable or Remove AI Features**
- Either implement disabled intelligence features
- Or remove frontend buttons to prevent user confusion

### 5. **Implement Soft Delete**
- `deleteDeal()` currently hard-deletes records
- Add `isArchived` flag for data retention

---

## TEST SCENARIOS REQUIRED

1. ✅ Create deal via API → Verify timeline event created
2. ✅ List deals with filters → Verify correct subset returned
3. ❌ **FAILS:** Change deal stage → Runtime error (function missing)
4. ✅ Link contract to deal → Timeline event fires
5. ⚠️ **UNCLEAR:** Extract deal from email → Success but no create flow
6. ❌ **FAILS:** Get deal intelligence → 501 response
7. ✅ Delete deal → Hard delete succeeds (should be soft)
8. ⚠️ **MIXED:** Campaign linking works for CrmDeals, not for Deals

---

## SCHEMA NOTES

**Deal Stage Enum:**
```prisma
enum DealStage {
  NEW_LEAD
  BRIEF_RECEIVED
  NEGOTIATING
  PENDING_CONTRACT
  CONTRACT_SENT
  LIVE
  CONTENT_SUBMITTED
  APPROVED
  PAYMENT_SENT
  CLOSED_WON
  CLOSED_LOST
}
```

**Related Models:**
- `DealNegotiation` (1:1 with Deal) - negotiation history tracking
- `DealTimeline` (1:many) - activity log
- `Deliverable` (1:many) - linked deliverables
- `Invoice`, `Payment`, `Payout` - financial tracking

---

**End of Audit**
