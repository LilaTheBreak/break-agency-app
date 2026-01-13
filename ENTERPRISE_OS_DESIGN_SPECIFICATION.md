# The Break: Enterprise Operating System Design Specification

**Status**: Phase 0 - Architecture Design  
**Date**: January 13, 2026  
**Version**: 1.0

---

## Executive Overview

This document specifies the transformation of The Break from a basic CRM into an **Enterprise Operating System** for creators focused on:
- **Enterprise Valuation** (measurable, systematic)
- **Exit Readiness** (prepared by default)
- **Recurring Revenue** (not one-off deals)
- **Founder Independence** (systems over hustle)

---

## Core Architecture Principles

1. **Systems-Driven**: Every metric computed server-side, not manual entry
2. **Measurable**: Only metrics with business meaning
3. **Enforceable**: Product logic prevents bad decisions
4. **Visible**: All metrics visible in dashboards
5. **Valuable**: Directly tied to long-term creator valuation
6. **Backwards Compatible**: All changes extend existing schema cleanly

---

## Feature Specifications

### 1. Enterprise Value Dashboard (Module 1)

**Purpose**: Single source of truth for business health and valuation metrics.

**Access**: Admin + Founder only

**Key Metrics**:
- **Revenue Breakdown**
  - Recurring vs one-off (%)
  - Founder-dependent vs scalable (%)
  - Platform-owned vs creator-owned (%)
- **Risk Indicators**
  - Revenue concentration risk (% from top 3 brands)
  - Platform dependency score (0-100)
  - Founder dependency risk (Low/Medium/High)
- **Monthly Recurring Revenue (MRR)**
  - Forecast 12 months
  - Growth rate
  - Churn indicators
- **IP & Owned Asset Inventory**
  - Total owned assets
  - Revenue-generating assets
  - Scalability potential

**Visual Design**:
- Premium, executive-grade layout
- Risk levels color-coded (Red/Yellow/Green)
- Interactive metrics with drill-down capability
- Historical trends (6/12 month views)

---

### 2. Revenue Classification System (Module 2)

**Purpose**: Enforce systematic tagging of all revenue sources for valuation clarity.

**Enforcement Rules**:
- Cannot create deal without revenue type tags
- Cannot close deal without complete classification
- Auto-flag high-risk configurations
- High-risk deals require manager approval

**Revenue Type Tags** (applies to Deals, Products, Campaigns):

| Tag | Definition | Example |
|-----|-----------|---------|
| `FOUNDER_DEPENDENT` | Requires founder presence | Speaking engagement, personal brand deal |
| `SCALABLE_INVENTORY` | Can sell unlimited copies | Course, template, SaaS |
| `RECURRING_REVENUE` | Repeats monthly/quarterly | Subscription, retainer, licensing |
| `PLATFORM_OWNED` | Platform owns customer relationship | Ads via The Break network |
| `CREATOR_OWNED` | Creator owns customer relationship | Direct email list, custom partnership |

**Additional Classifications**:
- Revenue Type: Consulting, Product Sales, Licensing, Sponsorship, Other
- Deal Value Type: Fixed, Variable (% commission), Hybrid
- Renewal Likelihood: High (>70%), Medium (30-70%), Low (<30%)

**Data Model Fields**:
```
Deal.revenueType[] = ["FOUNDER_DEPENDENT", "RECURRING_REVENUE", "CREATOR_OWNED"]
Deal.dealValueType = "FIXED" | "VARIABLE" | "HYBRID"
Deal.renewalLikelihood = "HIGH" | "MEDIUM" | "LOW"
Deal.estimatedMRR = Decimal
Deal.estimatedChurnRisk = Decimal (0-1)
Deal.isHighRisk = Boolean (computed)
Deal.risksIdentified = String[] (auto-populated)
```

---

### 3. Founder Dependency Index (Module 3)

**Purpose**: Quantify how much the business survives without the founder.

**Inputs**:
- % of revenue requiring founder presence (from deals)
- Number of SOP-less critical processes
- Manual ops volume (hours/week)
- Delegation coverage (% of tasks delegable)
- Team depth (number of trained staff per role)

**Scoring Algorithm**:

```
Score = 100 - (
  (founderDependencyPercent * 0.4) +
  (soplessProcesses * 0.15) +
  (manualOpsRatio * 0.25) +
  (delegationGap * 0.2)
)

Risk Rating:
- Low: 70-100 (healthy business independence)
- Medium: 40-70 (significant founder dependency)
- High: 0-40 (founder is the business)
```

**Output**:
- Overall risk rating
- "What to systemize next" recommendations ranked by impact
- Projected valuation penalty (e.g., 30% markdown for high founder dependency)

---

### 4. Owned Assets & IP Hub (Module 4)

**Purpose**: Systematic registry of all business assets beyond personal brand.

**Asset Types Tracked**:
- **Email Lists**: Subscriber count, engagement rate, revenue generated
- **Communities**: Member count, engagement, monetization path
- **Courses / Education IP**: Students, revenue, scalability
- **SaaS / Tools**: User count, revenue, licensing status
- **Domains**: List of owned domains, valuation
- **Trademarks**: Registered marks, jurisdiction, protection status
- **Data Assets**: Customer databases, proprietary data, value

**Fields per Asset**:
```
Asset {
  name: String
  type: ENUM
  description: String
  ownershipStatus: "OWNED" | "LICENSED" | "LICENSED_OUT"
  revenueGenerated: Decimal (annual)
  growthRate: Decimal (%)
  scalabilityScore: 0-100 (can grow without founder?)
  legalStatus: "PROTECTED" | "UNPROTECTED" | "PENDING"
  transferableIndependently: Boolean
  createdAt: DateTime
  lastValuationDate: DateTime
  estimatedValue: Decimal
  notes: String
}
```

---

### 5. Revenue Architecture Builder (Module 5)

**Purpose**: Visual map showing how content flows to recurring revenue.

**Revenue Flow Pattern**:
```
Content (YouTube, TikTok, etc.)
    ↓
Lead Capture (Email list, Community)
    ↓
Conversion (Product, Course, Sponsorship)
    ↓
Recurring Revenue (Subscription, Retainer, License)
```

**Enforcement Rules**:
- Every creator must have ≥1 complete revenue path
- Flag creators missing conversion or recurring revenue step
- Auto-calculate concentration risk for each path

**Visual Components**:
- Interactive flow diagram
- Revenue per path (MRR, annual)
- Contribution % for each stream
- Gap indicators (missing steps in flow)
- Health scorecard (complete vs incomplete flows)

---

### 6. Exit Readiness Scorecard (Module 6 - FLAGSHIP)

**Purpose**: Single metric: "How sellable is this creator business?"

**Scoring Criteria** (weighted):

| Criterion | Weight | Details |
|-----------|--------|---------|
| Revenue Predictability | 20% | MRR consistency, churn rate, contract length |
| Founder Independence | 20% | Founder Dependency Score (inverse) |
| Team & System Depth | 15% | SOPs, staff trained, process documentation |
| IP Ownership | 15% | % revenue from owned assets vs personal brand |
| Gross Margin | 10% | Net revenue after COGS/commissions |
| Platform Risk | 10% | Single-platform dependency, algorithm risk |
| Recurring Revenue % | 10% | % of MRR that auto-renews |

**Output**:
```
ExitReadinessScore {
  overallScore: 0-100 (%)
  category: "UNDERDEVELOPED" | "DEVELOPING" | "INVESTMENT_GRADE" | "ENTERPRISE_CLASS"
  breakdown: {
    revenuePrediability: 0-100,
    founderIndependence: 0-100,
    teamDepth: 0-100,
    ipOwnership: 0-100,
    grossMargin: 0-100,
    platformRisk: 0-100,
    recurringRevenuePercent: 0-100
  }
  recommendations: [
    {
      priority: "HIGH" | "MEDIUM" | "LOW",
      area: String,
      action: String,
      estimatedImpact: Number (% improvement),
      effort: "1HR" | "1DAY" | "1WEEK" | "1MONTH",
      valueMultiplier: Number (e.g., 1.25x)
    }
  ]
}
```

**Category Definitions**:
- **Underdeveloped** (0-35): Pre-revenue or heavily founder-dependent
- **Developing** (35-65): Growing but significant vulnerabilities
- **Investment Grade** (65-85): Sellable to small/mid market buyers
- **Enterprise Class** (85-100): Attractive to institutional buyers

---

### 7. SOP Engine (Module 7)

**Purpose**: Live system for process documentation, tracking, and enforcement.

**SOP Linkages**:
- Linked to Deals (enforce deal closure SOP)
- Linked to Campaigns (execution checklist)
- Linked to Revenue Streams (renewal process)
- Linked to Roles (responsibility assignment)

**SOP Status Tracking**:
- **Draft**: Being written, not yet active
- **Active**: In use, team trained
- **Broken**: Process failing, needs revision
- **Followed**: Consistently executed (green flag)

**Deviation Flagging**:
- Auto-flag deals without renewal SOP
- Auto-flag high-value deals without documented process
- Auto-flag founder-heavy workflows without delegation plan
- Auto-flag expired contract renewal dates without SOP trigger

**Data Model**:
```
SOPTemplate {
  id, title, description, category
  linkedDealTypes: String[]
  linkedCampaignTypes: String[]
  linkedRevenueTypes: String[]
  steps: { order, title, owner, durationHours }
  checklistItems: { title, owner, required }
  delegationInstructions: String
  failureRecovery: String
  lastReviewDate: DateTime
  ownerUserId: String
}

SOPInstance {
  id, templateId, linkedDealId, linkedCampaignId
  status: "DRAFT" | "ACTIVE" | "BROKEN" | "FOLLOWED"
  currentStep: Int
  completedDate: DateTime?
  deviationFlags: String[]
  notes: String
  createdAt, updatedAt
}
```

---

## Data Model Extensions

### New Prisma Models

```prisma
model EnterpriseValueMetrics {
  id String @id @default(cuid())
  talentId String @unique
  
  // Revenue breakdown
  recurringRevenuePercent Decimal @db.Decimal(5, 2)
  founderDependentPercent Decimal @db.Decimal(5, 2)
  creatorOwnedPercent Decimal @db.Decimal(5, 2)
  
  // Risk metrics
  revenueConcentrationRisk Decimal @db.Decimal(5, 2) // % from top 3
  platformDependencyScore Int // 0-100
  monthlyRecurringRevenue Decimal @db.Decimal(15, 2)
  mrrGrowthRate Decimal @db.Decimal(5, 2) // %
  
  // Assets
  ownedAssetCount Int @default(0)
  revenueGeneratingAssets Int @default(0)
  
  updatedAt DateTime @updatedAt
  Talent Talent @relation(fields: [talentId], references: [id], onDelete: Cascade)
  @@index([talentId])
}

model RevenueStream {
  id String @id @default(cuid())
  talentId String
  dealId String?
  
  name String
  type String // "PRODUCT", "SERVICE", "LICENSING", etc.
  monthlyRevenue Decimal @db.Decimal(15, 2)
  churnRate Decimal @db.Decimal(5, 2)
  scalabilityScore Int // 0-100
  ownershipStatus String // "OWNED", "LICENSED", "PLATFORM"
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  Talent Talent @relation(fields: [talentId], references: [id], onDelete: Cascade)
  Deal Deal? @relation(fields: [dealId], references: [id], onDelete: SetNull)
  
  @@index([talentId])
  @@index([dealId])
}

model RevenueClassification {
  id String @id @default(cuid())
  dealId String @unique
  
  // Tags
  tags String[] // ["FOUNDER_DEPENDENT", "RECURRING_REVENUE", "CREATOR_OWNED"]
  dealValueType String // "FIXED", "VARIABLE", "HYBRID"
  renewalLikelihood String // "HIGH", "MEDIUM", "LOW"
  
  // Estimates
  estimatedMRR Decimal @db.Decimal(15, 2) @default(0)
  estimatedChurnRisk Decimal @db.Decimal(5, 2) @default(0) // 0-1
  isHighRisk Boolean @default(false)
  risksIdentified String[]
  
  Deal Deal @relation(fields: [dealId], references: [id], onDelete: Cascade)
  
  @@index([dealId])
}

model FounderDependencyIndex {
  id String @id @default(cuid())
  talentId String @unique
  
  founderDependencyPercent Decimal @db.Decimal(5, 2) // % of revenue needing founder
  soplessProcessCount Int // Critical processes without SOP
  manualOpsHoursPerWeek Decimal @db.Decimal(5, 2)
  delegationCoveragePercent Decimal @db.Decimal(5, 2)
  teamDepth Int // Number of staff trained per role
  
  riskRating String // "LOW", "MEDIUM", "HIGH"
  score Int // 0-100
  recommendations String[]
  projectedValuationPenalty Decimal @db.Decimal(5, 2) // % markdown
  
  updatedAt DateTime @updatedAt
  Talent Talent @relation(fields: [talentId], references: [id], onDelete: Cascade)
  
  @@index([talentId])
}

model OwnedAsset {
  id String @id @default(cuid())
  talentId String
  
  name String
  type String // "EMAIL_LIST", "COMMUNITY", "COURSE", "SAAS", "DOMAIN", "TRADEMARK", "DATA"
  description String?
  
  ownershipStatus String // "OWNED", "LICENSED", "LICENSED_OUT"
  revenueGeneratedAnnual Decimal @db.Decimal(15, 2) @default(0)
  growthRatePercent Decimal @db.Decimal(5, 2)
  scalabilityScore Int // 0-100
  legalStatus String // "PROTECTED", "UNPROTECTED", "PENDING"
  transferableIndependently Boolean @default(false)
  
  estimatedValue Decimal @db.Decimal(15, 2)?
  notes String?
  
  createdAt DateTime @default(now())
  lastValuationDate DateTime?
  updatedAt DateTime @updatedAt
  
  Talent Talent @relation(fields: [talentId], references: [id], onDelete: Cascade)
  
  @@index([talentId])
  @@index([type])
}

model RevenueArchitecture {
  id String @id @default(cuid())
  talentId String @unique
  
  // Track revenue paths
  contentChannels String[] // ["YOUTUBE", "TIKTOK", "INSTAGRAM", etc.]
  leadCaptureMethods String[] // ["EMAIL", "COMMUNITY", etc.]
  conversionPoints String[] // ["COURSE", "SPONSORSHIP", etc.]
  recurringRevenueStreams String[]
  
  // Completeness score
  isFullyMapped Boolean @default(false)
  completionPercent Int // 0-100
  gapsList String[]
  
  updatedAt DateTime @updatedAt
  Talent Talent @relation(fields: [talentId], references: [id], onDelete: Cascade)
  
  @@index([talentId])
}

model ExitReadinessScore {
  id String @id @default(cuid())
  talentId String @unique
  
  overallScore Int // 0-100
  category String // "UNDERDEVELOPED", "DEVELOPING", "INVESTMENT_GRADE", "ENTERPRISE_CLASS"
  
  // Component scores
  revenuePredicability Int
  founderIndependence Int
  teamDepth Int
  ipOwnership Int
  grossMargin Int
  platformRisk Int
  recurringRevenuePercent Int
  
  // Recommendations
  recommendations Json[] // Array of {priority, area, action, estimatedImpact, effort, valueMultiplier}
  
  updatedAt DateTime @updatedAt
  Talent Talent @relation(fields: [talentId], references: [id], onDelete: Cascade)
  
  @@index([talentId])
  @@index([overallScore])
  @@index([category])
}

model SOPTemplate {
  id String @id @default(cuid())
  organizationId String?
  
  title String
  description String?
  category String // "DEAL", "CAMPAIGN", "REVENUE", "RENEWAL", etc.
  
  linkedDealTypes String[] @default([])
  linkedCampaignTypes String[] @default([])
  linkedRevenueTypes String[] @default([])
  
  steps Json[] // [{order, title, owner, durationHours}]
  checklistItems Json[] // [{title, owner, required}]
  delegationInstructions String?
  failureRecovery String?
  
  ownerUserId String
  lastReviewDate DateTime?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  instances SOPInstance[]
  
  @@index([category])
  @@index([ownerUserId])
}

model SOPInstance {
  id String @id @default(cuid())
  templateId String
  
  linkedDealId String?
  linkedCampaignId String?
  linkedRevenueStreamId String?
  
  status String @default("DRAFT") // "DRAFT", "ACTIVE", "BROKEN", "FOLLOWED"
  currentStep Int @default(0)
  completedAt DateTime?
  
  deviationFlags String[] @default([])
  notes String?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  SOPTemplate SOPTemplate @relation(fields: [templateId], references: [id], onDelete: Cascade)
  Deal Deal? @relation(fields: [linkedDealId], references: [id], onDelete: SetNull)
  
  @@index([templateId])
  @@index([status])
  @@index([linkedDealId])
}
```

---

## API Endpoints

### Enterprise Value Metrics

```
GET    /api/enterprise-value/:talentId        - Get full metrics
POST   /api/enterprise-value/:talentId        - Create/update (auto-computed)
GET    /api/enterprise-value/:talentId/history - Get 12-month history
```

### Revenue Streams & Classification

```
GET    /api/revenue-streams/:talentId         - List all revenue streams
POST   /api/revenue-streams/:talentId         - Create new stream
PUT    /api/revenue-streams/:streamId         - Update stream
DELETE /api/revenue-streams/:streamId         - Delete stream

GET    /api/revenue-classification/:dealId    - Get deal classification
POST   /api/revenue-classification/:dealId    - Create/update classification
GET    /api/revenue-classification/risky      - List high-risk deals
```

### Founder Dependency

```
GET    /api/founder-dependency/:talentId      - Get index score
POST   /api/founder-dependency/:talentId      - Compute/update
GET    /api/founder-dependency/:talentId/recommendations - Get improvement plan
```

### Owned Assets

```
GET    /api/owned-assets/:talentId            - List all assets
POST   /api/owned-assets/:talentId            - Create asset
PUT    /api/owned-assets/:assetId             - Update asset
DELETE /api/owned-assets/:assetId             - Delete asset
GET    /api/owned-assets/:talentId/inventory  - Full IP inventory
```

### Revenue Architecture

```
GET    /api/revenue-architecture/:talentId    - Get architecture map
POST   /api/revenue-architecture/:talentId    - Create/update
PUT    /api/revenue-architecture/:talentId    - Update flows
GET    /api/revenue-architecture/:talentId/gaps - Identify missing steps
```

### Exit Readiness

```
GET    /api/exit-readiness/:talentId          - Get scorecard
POST   /api/exit-readiness/:talentId          - Compute score
GET    /api/exit-readiness/:talentId/breakdown - Detailed metrics
GET    /api/exit-readiness/:talentId/recommendations - Action plan
```

### SOPs

```
GET    /api/sop-templates                     - List all templates
POST   /api/sop-templates                     - Create template
PUT    /api/sop-templates/:id                 - Update template
GET    /api/sop-instances/:dealId             - Get SOPs for deal
POST   /api/sop-instances                     - Create instance
PUT    /api/sop-instances/:id                 - Update status/progress
GET    /api/sop-instances/:id/deviations      - Check deviations
```

---

## Business Logic Rules

### Revenue Classification Enforcement
- **Rule 1**: Cannot save deal without `revenueType` tags
- **Rule 2**: Cannot close deal without complete classification
- **Rule 3**: High-risk deals (multiple founder-dependent tags) require manager review
- **Rule 4**: Auto-flag deals with >2 revenue type concentrations

### Founder Dependency Scoring
- **Rule 5**: Recompute on deal creation/closure/update
- **Rule 6**: Auto-flag businesses with >70% founder dependency
- **Rule 7**: Recommend SOPs for top 3 founder-dependent workflows

### Exit Readiness Computation
- **Rule 8**: Recompute monthly or on material change
- **Rule 9**: Weight recurring revenue heavily (20% + 10% factor)
- **Rule 10**: Penalize single-platform dependency (up to -30 points)
- **Rule 11**: Premium for owned assets (up to +20 points)

### SOP Engine Enforcement
- **Rule 12**: Link all high-value deals (>$50k) to SOP template
- **Rule 13**: Auto-flag if SOP not marked "Followed" for 2+ executions
- **Rule 14**: Require SOP signature-off before deal can close
- **Rule 15**: Flag missing renewal SOP for recurring revenue deals

---

## Role-Based Access Control

| Feature | Admin | Founder | Talent Manager | Talent |
|---------|-------|---------|-----------------|--------|
| View Enterprise Dashboard | ✅ | ✅ | ⚠️ (own only) | ❌ |
| View Exit Readiness Score | ✅ | ✅ | ❌ | ❌ |
| Edit Revenue Classification | ✅ | ✅ | ⚠️ (own) | ❌ |
| Create Owned Assets | ✅ | ✅ | ⚠️ (own) | ❌ |
| Create SOP Templates | ✅ | ✅ | ⚠️ (org) | ❌ |
| Approve High-Risk Deals | ✅ | ✅ | ❌ | ❌ |

---

## Implementation Phases

### Phase 1: Foundation (Weeks 1-2)
- [ ] Implement Prisma models
- [ ] Build API endpoints (CRUD layer)
- [ ] Implement revenue classification enforcement

### Phase 2: Scoring Systems (Weeks 3-4)
- [ ] Founder Dependency Index scoring
- [ ] Exit Readiness calculation
- [ ] Revenue Architecture mapping

### Phase 3: UI Implementation (Weeks 5-6)
- [ ] Enterprise Value Dashboard
- [ ] Exit Readiness Scorecard
- [ ] Owned Assets Registry
- [ ] Revenue Architecture Visualizer

### Phase 4: SOP Engine (Weeks 7-8)
- [ ] SOP template creation/management
- [ ] Instance tracking
- [ ] Deviation flagging
- [ ] Workflow integration

### Phase 5: Polish & Deployment (Weeks 9-10)
- [ ] RBAC refinement
- [ ] Performance optimization
- [ ] Security audit
- [ ] Production deployment

---

## Success Metrics

✅ Every creator has an Exit Readiness Score  
✅ All deals tagged with revenue type (zero untagged deals)  
✅ Dashboard shows real-time founder dependency index  
✅ Owned assets automatically tracked and valued  
✅ SOPs linked to 100% of high-value deals  
✅ Actionable recommendations drive top 20% improvement in exit score  

---

## Non-Negotiable Principles (Guardrails)

- 🚫 No vanity metrics (every metric drives decisions)
- 🚫 No manual data entry (computed from existing data)
- 🚫 No platform lockin (all assets owned by creator, not platform)
- 🚫 No hidden scoring (full transparency in calculations)
- 🚫 Systems first (document processes before automating)
- 🚫 Recurring over one-off (recurring revenue prioritized)

---

## Next Steps

1. **Approve** this specification
2. **Implement** Prisma schema (Priority 1)
3. **Build** API endpoints (Priority 1)
4. **Test** all business logic rules
5. **Design** UI components (Priority 2)
6. **Deploy** to staging (Priority 2)
7. **Gather** founder feedback
8. **Refine** and deploy to production

