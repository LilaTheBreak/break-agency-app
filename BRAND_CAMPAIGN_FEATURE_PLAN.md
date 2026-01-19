# Brand Campaign Functionality — Implementation Plan

**Date**: 19 Jan 2026  
**Status**: Planning Phase  
**Scope**: Parts 1-4 of brand campaign creation + approval + reporting

---

## ASSUMPTIONS & CONSTRAINTS

### Database State
- `CrmCampaign` exists for internal campaigns (admin-created)
- `BrandCampaign` exists but is **not** the right model for brand-created campaigns
- `Brand` model exists and is linked to campaigns
- `BrandUser` model exists for brand permission checks
- No existing `CreatorShortlist`, `CampaignApproval`, or `CampaignFeedback` models

### Architectural Decisions
1. **Use CrmCampaign** for brand-submitted campaigns (status: PENDING_ADMIN_REVIEW)
   - Single source of truth for all campaigns
   - Admin can seamlessly hand off to internal CRM workflow
   - Avoids data duplication

2. **Create new models**:
   - `CreatorShortlist` — Track curated creator list with approval state
   - `CampaignApproval` — Track brand approval decisions, admin overrides, feedback
   - `CampaignFeedback` — Store brand feedback and preferences for AI learning

3. **Permission Model**:
   - Brand users: Can create campaigns, approve/reject shortlist, view reports
   - Admin users: Can curate shortlist, override brand decisions, release reports
   - Talent: Cannot access brand campaign workflows

### Data Separation (Brand Safety)
- Brand users **cannot** see:
  - Talent earning history
  - Internal risk flags / health scores
  - Admin notes in shortlist
  - Other brand campaigns
  - Talent contact information
- All actions logged to AuditLog with role + action + reason

---

## SCHEMA DESIGN

### 1. CrmCampaign (Extend existing model)

Add fields to support brand submission:

```prisma
model CrmCampaign {
  // ... existing fields ...
  
  // Brand submission tracking
  submittedByUserId    String?           // FK to User (brand creator)
  submissionSource     String?           // "BRAND_PORTAL" or "ADMIN_CREATED"
  approvalStatus       String @default("PENDING_ADMIN_REVIEW")  // PENDING_ADMIN_REVIEW | APPROVED | REVISION_REQUESTED | REJECTED
  
  // Brand-provided preferences
  budgetRange          String?           // "£5K-£10K" etc
  campaignObjective    String?           // AWARENESS | CONVERSION | LAUNCH | EVENT
  platforms            String[]          // [Instagram, TikTok, YouTube]
  targetRegion         String[]          // [UK, US, EU]
  contentVerticals     String[]          // [Fashion, Tech, Beauty, etc]
  audiencePreferences  String?           // JSON: { ageRange, interests, etc }
  creatorSizeRange     String?           // NANO | MICRO | MID | MACRO
  
  // Timeline
  preferredStartDate   DateTime?
  preferredEndDate     DateTime?
  flexibilityToggle    Boolean @default(true)  // fixed vs flexible
  
  // Shortlist & approval
  CreatorShortlist     CreatorShortlist[]
  CampaignApprovals    CampaignApproval[]
  
  // Metadata
  brandId              String
  Brand                Brand @relation(fields: [brandId], references: [id], onDelete: Cascade)
}
```

### 2. CreatorShortlist (NEW)

Track curated creator list with approval state:

```prisma
model CreatorShortlist {
  id                      String   @id @default(cuid())
  campaignId              String
  talentId                String
  
  // Admin curation
  adminNotes              String?           // Internal notes (hidden from brand)
  aiExplanation           String?           // "Why this creator fits" (shown to brand)
  addedByAdminId          String
  
  // Brand approval state
  brandApprovalStatus     String @default("PENDING_BRAND_APPROVAL")  // PENDING_BRAND_APPROVAL | APPROVED | REJECTED | REVISION_REQUESTED
  brandApprovedAt         DateTime?
  brandApprovedByUserId   String?
  
  // Admin override
  adminOverrideReason     String?           // If admin overrides brand rejection
  adminOverrideAt         DateTime?
  adminOverrideByUserId   String?
  
  createdAt               DateTime @default(now())
  updatedAt               DateTime @updatedAt
  
  Campaign                CrmCampaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  Talent                  Talent @relation(fields: [talentId], references: [id], onDelete: Cascade)
  AddedByAdmin            User @relation("AddedByAdmin", fields: [addedByAdminId], references: [id])
  BrandApprovedBy         User? @relation("BrandApprovedBy", fields: [brandApprovedByUserId], references: [id])
  AdminOverrideBy         User? @relation("AdminOverrideBy", fields: [adminOverrideByUserId], references: [id])
  
  @@unique([campaignId, talentId])
  @@index([campaignId])
  @@index([talentId])
  @@index([brandApprovalStatus])
}
```

### 3. CampaignApproval (NEW)

Track all approval/override/feedback events:

```prisma
model CampaignApproval {
  id              String   @id @default(cuid())
  campaignId      String
  action          String   // "BRAND_APPROVED" | "BRAND_REJECTED" | "ADMIN_OVERRIDE" | "FEEDBACK_SUBMITTED"
  actorId         String   // User who took action
  actorRole       String   // "BRAND" | "ADMIN"
  reason          String?  // Provided reason (especially for overrides)
  metadata        Json?    // Additional context (e.g., shortlist IDs affected)
  createdAt       DateTime @default(now())
  
  Campaign        CrmCampaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  Actor           User @relation(fields: [actorId], references: [id])
  
  @@index([campaignId])
  @@index([createdAt])
}
```

### 4. CampaignFeedback (NEW)

Store brand feedback for AI learning:

```prisma
model CampaignFeedback {
  id              String   @id @default(cuid())
  campaignId      String
  shortlistId     String?  // Specific shortlist item if feedback on creator
  feedbackType    String   // "APPROVAL" | "REJECTION" | "PREFERENCE" | "CONCERN"
  content         String
  signals         String[] // AI learning signals: ["good_fit", "audience_mismatch", etc]
  submittedByUserId String
  submittedAt     DateTime @default(now())
  
  Campaign        CrmCampaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  SubmittedBy     User @relation(fields: [submittedByUserId], references: [id])
  
  @@index([campaignId])
  @@index([feedbackType])
}
```

### 5. CampaignReport (NEW)

Store AI-generated post-campaign reports:

```prisma
model CampaignReport {
  id              String   @id @default(cuid())
  campaignId      String   @unique
  
  reportContent   Json     // Generated report (JSON to support rich formatting)
  tone            String @default("confident")  // Brand-safe tone
  
  generatedAt     DateTime @default(now())
  approvedByAdminId String?
  approvedAt      DateTime?
  
  releasedAt      DateTime?
  viewedByBrandAt DateTime?
  
  updatedAt       DateTime @updatedAt
  
  Campaign        CrmCampaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  ApprovedByAdmin User? @relation(fields: [approvedByAdminId], references: [id])
  
  @@index([campaignId])
  @@index([approvedAt])
}
```

---

## API ENDPOINTS

### PART 1: Campaign Creation (Brand)

```
POST /api/brand/campaigns
  Body: {
    campaignName: string
    objective: "AWARENESS" | "CONVERSION" | "LAUNCH" | "EVENT"
    platforms: string[]
    targetRegion: string[]
    budgetRange: string
    preferredStartDate: ISO date
    preferredEndDate: ISO date
    flexibilityToggle: boolean
    contentVerticals: string[]
    audiencePreferences: { ageRange?: string, interests?: string[] }
    creatorSizeRange: "NANO" | "MICRO" | "MID" | "MACRO"
  }
  Response: { campaignId, status: "PENDING_ADMIN_REVIEW" }
  Auth: BRAND role only
```

### PART 2: Shortlist Management

**Admin curates:**
```
POST /api/admin/campaigns/:campaignId/shortlist
  Body: { talentIds: string[], aiExplanations: {} }
  Response: { createdShortlist: [] }
  Auth: ADMIN only

PUT /api/admin/shortlist/:shortlistId
  Body: { adminNotes: string, aiExplanation: string }
  Response: { updated shortlist }
  Auth: ADMIN only
```

**Brand approves:**
```
PUT /api/brand/shortlist/:shortlistId/approve
  Body: { feedback?: string }
  Response: { status: "APPROVED" }
  Auth: BRAND role only

PUT /api/brand/shortlist/:shortlistId/reject
  Body: { reason: string, feedback?: string }
  Response: { status: "REJECTED" }
  Auth: BRAND role only

PUT /api/brand/shortlist/:shortlistId/revise
  Body: { feedback: string }
  Response: { status: "REVISION_REQUESTED" }
  Auth: BRAND role only
```

### PART 3: Admin Override + Feedback

```
PUT /api/admin/shortlist/:shortlistId/override
  Body: { reason: string }
  Response: { status: "APPROVED" (overridden) }
  Auth: ADMIN only

POST /api/brand/campaigns/:campaignId/feedback
  Body: { feedbackType: string, content: string, signals?: string[] }
  Response: { feedbackId }
  Auth: BRAND role only
```

### PART 4: Reporting

```
POST /api/admin/campaigns/:campaignId/generate-report
  Response: { reportId, status: "PENDING_ADMIN_APPROVAL" }
  Auth: ADMIN only

PUT /api/admin/reports/:reportId/approve
  Response: { status: "APPROVED", releasedAt: timestamp }
  Auth: ADMIN only

GET /api/brand/campaigns/:campaignId/report
  Response: { reportContent, approvedAt, viewedAt }
  Auth: BRAND role (only if campaign belongs to their brand)
```

---

## UI COMPONENTS

### Brand-Side

1. **CampaignWizard.jsx** — 4-step form component
   - Step 1: Basics (name, objective, platforms, region)
   - Step 2: Budget & Timeline (budget range, dates, flexibility)
   - Step 3: Creator Preferences (verticals, audience, size range)
   - Step 4: Review & Submit

2. **ShortlistApprovalPage.jsx** — View and approve creator shortlist
   - Creator cards with AI explanations
   - Approve / Reject / Request revision buttons
   - Feedback textarea

3. **CampaignReportPage.jsx** — View generated report
   - Read-only report display
   - Timeline of actions

### Admin-Side

1. **CampaignShortlistCuration.jsx** — Admin curates shortlist
   - Select creators to add to shortlist
   - Add AI explanations + internal notes
   - View brand feedback

2. **CampaignOverridePanel.jsx** — Admin override interface
   - View brand rejections
   - Override with reason capture
   - Add recommended alternatives

3. **ReportApprovalPage.jsx** — Admin approve/edit report before release
   - Read/edit report content
   - Approve or request changes

---

## HARD GUARDRAILS (Implementation Checklist)

- [ ] Brand cannot see internal risk flags or admin notes
- [ ] Brand cannot see other brand campaigns
- [ ] Brand cannot create contracts or assign talent directly
- [ ] All actions logged with user role + reason
- [ ] Admin must approve report before brand sees it
- [ ] No talent earnings exposed to brand
- [ ] Campaign creation requires BRAND role check
- [ ] Shortlist API requires BRAND/ADMIN role check
- [ ] Report generation triggers only after campaign ends
- [ ] Admin override requires reason (non-nullable)

---

## IMPLEMENTATION SEQUENCE

1. ✅ Audit schema (DONE)
2. Run Prisma migration for new models
3. Build campaign creation API + wizard UI
4. Build shortlist curation + approval UI/API
5. Build admin override + feedback loops
6. Build AI report generation service
7. Build report approval UI
8. End-to-end testing
9. Commit with detailed messages

---

## SUCCESS CRITERIA

- [ ] Brand creates campaign via wizard (PENDING_ADMIN_REVIEW)
- [ ] Admin curates shortlist with AI explanations
- [ ] Brand approves/rejects creators with feedback
- [ ] Admin can override brand rejections with reason
- [ ] AI generates campaign report (post-campaign)
- [ ] Admin approves report before brand sees it
- [ ] Brand views premium report in dashboard
- [ ] All actions logged in AuditLog
- [ ] No permission bypasses or data leaks
- [ ] No internal CRM tools exposed to brand

