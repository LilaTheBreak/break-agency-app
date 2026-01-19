# Brand Campaign Feature — QUICK REFERENCE GUIDE

## 🎯 What This Feature Does

Allows brands to create campaigns and approve creators for those campaigns through a controlled workflow. Admin curates, brand approves, AI learns.

---

## 📡 API ENDPOINTS

### Brand Campaign Management

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/brand/campaigns` | BRAND | Create new campaign |
| GET | `/api/brand/campaigns` | BRAND | List brand's campaigns |
| GET | `/api/brand/campaigns/:id` | BRAND | View campaign + shortlist |

### Brand Shortlist Approval

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/brand/shortlist` | BRAND | List pending approvals |
| PUT | `/api/brand/shortlist/:id/approve` | BRAND | Approve creator |
| PUT | `/api/brand/shortlist/:id/reject` | BRAND | Reject creator + reason |
| PUT | `/api/brand/shortlist/:id/revise` | BRAND | Request alternatives |

### Admin Campaign Management

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/admin/campaigns/:id/shortlist` | ADMIN | Curate creator list |
| PUT | `/api/admin/shortlist/:id` | ADMIN | Update notes/explanation |
| PUT | `/api/admin/shortlist/:id/override` | ADMIN | Override brand rejection |

---

## 🗄️ DATABASE MODELS

### CreatorShortlist
- Links campaign → talent
- Tracks brand approval state (PENDING_BRAND_APPROVAL | APPROVED | REJECTED | REVISION_REQUESTED)
- Stores admin notes (hidden from brand) + AI explanations (shown to brand)
- Records admin overrides with reason

### CampaignApproval (Audit Log)
- Every action: brand approval, rejection, revision, admin override
- Stores: action type, actor, role, reason, metadata
- Immutable record for compliance

### CampaignFeedback (Learning Signals)
- Brand feedback captured with learning signals
- Signals: ["approved_by_brand", "rejected_by_brand", "good_fit", "audience_mismatch", etc.]
- Used for future AI model improvements

### Extended CrmCampaign
- `submittedByUserId` - Brand creator
- `submissionSource` - "BRAND_PORTAL" or "ADMIN_CREATED"
- `approvalStatus` - PENDING_ADMIN_REVIEW | APPROVED | REVISION_REQUESTED | REJECTED
- Brand preferences: budgetRange, platforms, targetRegion, contentVerticals, creatorSizeRange, audiencePreferences, timeline fields

---

## 🔐 Permission Model

### Brand User
```typescript
// Can do:
- Create campaigns (auto PENDING_ADMIN_REVIEW)
- View their brand's campaigns only
- Approve/reject creators from shortlist
- Submit feedback + concerns

// Cannot do:
- Assign creators directly
- See admin notes
- See other brands
- See talent earnings/risk flags
- See internal performance metrics

// Checked:
- user?.role === 'BRAND'
- BrandUser link exists for user
- Campaign belongs to user's brand
```

### Admin User
```typescript
// Can do:
- Curate creator shortlist
- Add internal admin notes
- Override brand rejections (with reason)
- View all campaigns/approvals
- Approve reports before release

// Checked:
- user?.role === 'ADMIN' || 'SUPERADMIN'
```

---

## 📊 Data Flows

### Campaign Creation Flow
```
Brand submits form 
  ↓
POST /api/brand/campaigns validates + creates CrmCampaign
  ↓ 
Status: PENDING_ADMIN_REVIEW
  ↓
Admin notifies (TODO)
  ↓
Admin curates shortlist
```

### Approval Flow
```
Admin curates shortlist 
  ↓
POST /api/admin/campaigns/:id/shortlist creates CreatorShortlist entries
  ↓
Brand sees pending creators
  ↓
Brand approves/rejects/revises
  ↓
PUT /api/brand/shortlist/:id/{approve|reject|revise}
  ↓
Creates CampaignApproval + CampaignFeedback records
  ↓
Admin can override rejections
  ↓
PUT /api/admin/shortlist/:id/override (requires reason)
```

### Feedback Loop
```
Brand feedback collected
  ↓
Stored in CampaignFeedback with signals: ["approved_by_brand", "good_fit", etc.]
  ↓
AI model learns from patterns (future integration)
  ↓
Future campaigns get better recommendations
```

---

## 🛡️ Data Guardrails

| Data | Brand Sees | Admin Sees | Notes |
|------|-----------|-----------|-------|
| Campaign name/objective | ✅ | ✅ | Brand-submitted |
| Creator name/photo | ✅ | ✅ | Public profile |
| AI explanations ("why this fits") | ✅ | ✅ | Generated for brand |
| Admin notes | ❌ | ✅ | Hidden in queries |
| Talent risk flags | ❌ | ✅ | Never sent to brand |
| Talent earnings | ❌ | ✅ | Never sent to brand |
| Internal metrics | ❌ | ✅ | Hidden |
| Other brand campaigns | ❌ | ✅ | Filtered by brandId |

---

## 🚨 Error Handling

**Brand Not Linked to Brand:**
```json
{
  "status": 403,
  "error": "You are not linked to any brand. Contact your admin to link you to a brand."
}
```

**Wrong Role:**
```json
{
  "status": 403,
  "error": "Only brand users can create campaigns."
}
```

**Missing Required Field:**
```json
{
  "status": 400,
  "error": "Missing required fields: campaignName, objective, platforms"
}
```

---

## 🧪 Testing Scenarios

### Scenario 1: Brand Creates Campaign
```bash
# 1. Create campaign
POST /api/brand/campaigns
{
  "campaignName": "Q1 Product Launch",
  "objective": "LAUNCH",
  "platforms": ["Instagram", "TikTok"],
  "targetRegion": ["UK", "US"],
  "budgetRange": "£5K-£10K",
  "contentVerticals": ["Tech", "Lifestyle"],
  "creatorSizeRange": "MICRO"
}

# Response: { campaignId, status: "PENDING_ADMIN_REVIEW" }

# 2. List campaigns
GET /api/brand/campaigns

# Response: { campaigns: [...], count: 1 }
```

### Scenario 2: Admin Curates + Brand Approves
```bash
# 1. Admin curates shortlist
POST /api/admin/campaigns/{campaignId}/shortlist
{
  "creators": [
    { 
      "talentId": "talent_123",
      "aiExplanation": "Perfect fit: 250K followers, tech-savvy audience, brand alignment"
    }
  ]
}

# Response: { shortlist: [...], count: 1 }

# 2. Brand views pending
GET /api/brand/shortlist

# Response: { shortlist: [...], count: 1 }

# 3. Brand approves
PUT /api/brand/shortlist/{shortlistId}/approve
{
  "feedback": "Looks great, let's go ahead"
}

# Response: { status: "APPROVED", message: "..." }
```

### Scenario 3: Brand Rejects + Admin Overrides
```bash
# 1. Brand rejects
PUT /api/brand/shortlist/{shortlistId}/reject
{
  "reason": "Audience doesn't match our target demographic",
  "feedback": "We need younger audience (18-25)"
}

# 2. Admin sees rejection in audit
GET /api/admin/shortlist/{shortlistId}
# See: brandApprovalStatus = "REJECTED"

# 3. Admin overrides
PUT /api/admin/shortlist/{shortlistId}/override
{
  "reason": "Audience data updated, new followers skew younger. Strategic fit confirmed."
}

# Response: { status: "APPROVED" (overridden), message: "..." }
```

---

## 🔄 Status Transitions

### Campaign Statuses
```
PENDING_ADMIN_REVIEW  →  APPROVED
                      →  REVISION_REQUESTED
                      →  REJECTED
```

### Creator Approval Statuses
```
PENDING_BRAND_APPROVAL  →  APPROVED (brand approved)
                        →  APPROVED (admin override)
                        →  REJECTED (brand rejected)
                        →  REVISION_REQUESTED (brand wants alternatives)
```

---

## 📝 Audit Trail

Every action creates immutable `CampaignApproval` record:

```javascript
{
  campaignId: "campaign_123",
  action: "BRAND_APPROVED",
  actorId: "user_456",
  actorRole: "BRAND",
  reason: "Looks great",
  metadata: { shortlistId: "...", talentId: "..." },
  createdAt: "2026-01-19T10:30:00Z"
}
```

Retrieve audit trail:
```typescript
const approvals = await prisma.campaignApproval.findMany({
  where: { campaignId },
  orderBy: { createdAt: 'desc' }
});
```

---

## 🎯 Common Patterns

### Check if Brand User Can Access Campaign
```typescript
const brandUser = await prisma.brandUser.findFirst({
  where: { userId: req.user.id }
});

const campaign = await prisma.crmCampaign.findFirst({
  where: {
    id: campaignId,
    brandId: brandUser.brandId,  // Matches brand's brand
    submissionSource: 'BRAND_PORTAL'  // Only brand-created
  }
});

if (!campaign) return res.status(404).json({ error: 'Not found' });
```

### Get All Pending Approvals for Brand
```typescript
const shortlist = await prisma.creatorShortlist.findMany({
  where: {
    Campaign: { brandId: brandUser.brandId },
    brandApprovalStatus: 'PENDING_BRAND_APPROVAL'
  },
  include: {
    Talent: { select: { name: true, profileImageUrl: true } },
    Campaign: { select: { campaignName: true } }
  }
});
```

### Hide Admin Data from Brand Response
```typescript
// WRONG - sends admin notes to brand
const shortlist = await prisma.creatorShortlist.findMany({
  include: { /* all fields */ }
});

// RIGHT - excludes admin notes
const shortlist = await prisma.creatorShortlist.findMany({
  select: {
    id: true,
    aiExplanation: true,  // Show this
    brandApprovalStatus: true,
    // adminNotes: false  // Hide this
    Talent: { select: { name: true } }
  }
});
```

---

## 📚 Related Docs

- [BRAND_CAMPAIGN_FEATURE_PLAN.md](BRAND_CAMPAIGN_FEATURE_PLAN.md) — Detailed design
- [BRAND_CAMPAIGN_PROGRESS_REPORT.md](BRAND_CAMPAIGN_PROGRESS_REPORT.md) — Implementation status
- Prisma Schema: `apps/api/prisma/schema.prisma` (models section)
- Routes: `apps/api/src/routes/brand/` (campaigns.ts, shortlist.ts)

---

## ⚙️ Integration Points

### With Admin Notifications (TODO)
```typescript
// Send email when campaign submitted
await sendAdminNotification({
  subject: "New Campaign Awaiting Review",
  campaignName,
  brandName,
  submittedBy: user.email
});
```

### With AI Reporting (TODO)
```typescript
// After campaign ends, generate report
await generateCampaignReport({
  campaignId,
  templateType: "executive_summary"
});
```

### With AI Learning (TODO)
```typescript
// Read feedback signals for model training
const feedbackSignals = await prisma.campaignFeedback.findMany({
  where: { campaignId }
});
// → feeds into CreatorFitScore improvements
```

---

## 🔧 Troubleshooting

| Problem | Solution |
|---------|----------|
| Brand can't create campaign | Check: BRAND role, BrandUser link exists |
| Brand can't see shortlist | Check: Campaign exists, shortlist entries created by admin |
| Admin override failing | Check: Reason field is required, not empty |
| Admin notes leaking to brand | Check: select/include fields exclude adminNotes |
| Feedback not saved | Check: CampaignFeedback endpoint called, signals array populated |

---

## 📞 Support

Questions or issues? Check:
1. [BRAND_CAMPAIGN_PROGRESS_REPORT.md](BRAND_CAMPAIGN_PROGRESS_REPORT.md) for implementation status
2. [BRAND_CAMPAIGN_FEATURE_PLAN.md](BRAND_CAMPAIGN_FEATURE_PLAN.md) for detailed design
3. Route files in `apps/api/src/routes/brand/` for endpoint code
4. Prisma schema in `apps/api/prisma/schema.prisma` for data models

