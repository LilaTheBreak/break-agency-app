# Enterprise OS - Quick Start Guide for Developers

**Last Updated**: January 13, 2026

---

## 🚀 5-Minute Setup

### 1. Apply Database Changes
```bash
cd /Users/admin/Desktop/break-agency-app-1
npm run prisma:migrate dev --name add_enterprise_os_models
```

### 2. Test an Endpoint
```bash
# Start the API server (if not running)
npm run dev

# In another terminal, test:
curl -X POST http://localhost:3000/api/enterprise-value/talent_123/compute \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📁 File Structure

```
/apps/api/prisma/
  schema.prisma                           # 9 new models added

/apps/api/src/services/
  enterpriseValueService.ts               # Compute metrics dashboard
  revenueClassificationService.ts         # Enforce deal tagging
  founderDependencyService.ts             # Business independence score
  exitReadinessService.ts                 # Flagship scorecard
  (ownedAssets logic in ownedAssets.ts route)

/apps/api/src/routes/
  enterpriseValue.ts                      # /api/enterprise-value/*
  revenueClassification.ts                # /api/revenue-classification/*
  founderDependency.ts                    # /api/founder-dependency/*
  ownedAssets.ts                          # /api/owned-assets/*
  exitReadiness.ts                        # /api/exit-readiness/*
  index.ts                                # (added imports + routes)

/docs/
  ENTERPRISE_OS_DESIGN_SPECIFICATION.md   # Full spec
  ENTERPRISE_OS_IMPLEMENTATION_GUIDE.md   # How it works
  ENTERPRISE_OS_PHASE1_SUMMARY.md         # What was built
```

---

## 🔌 API Quick Reference

### Enterprise Value (Revenue Metrics)
```bash
# Get current metrics
curl GET /api/enterprise-value/:talentId

# Recompute from deals
curl POST /api/enterprise-value/:talentId/compute

# Get 12-month history
curl GET /api/enterprise-value/:talentId/history?months=12
```

### Revenue Classification (Deal Tagging)
```bash
# Get deal's classification
curl GET /api/revenue-classification/:dealId

# Classify deal
curl POST /api/revenue-classification/:dealId \
  -d '{
    "tags": ["RECURRING_REVENUE", "CREATOR_OWNED"],
    "dealValueType": "FIXED",
    "renewalLikelihood": "HIGH",
    "estimatedMRR": 5000
  }'

# Auto-classify from deal data
curl POST /api/revenue-classification/:dealId/auto-classify

# List high-risk deals
curl GET /api/revenue-classification/talent/:talentId/high-risk
```

### Founder Dependency (Independence Score)
```bash
# Get score (0-100, higher = more independent)
curl GET /api/founder-dependency/:talentId

# Get improvement recommendations
curl GET /api/founder-dependency/:talentId/recommendations
```

### Owned Assets (IP Registry)
```bash
# List all assets
curl GET /api/owned-assets/:talentId

# Get full inventory (summary + breakdown)
curl GET /api/owned-assets/:talentId/inventory

# Create asset
curl POST /api/owned-assets/:talentId \
  -d '{
    "name": "Newsletter",
    "type": "EMAIL_LIST",
    "revenueGeneratedAnnual": 12000,
    "scalabilityScore": 85
  }'

# Update asset
curl PUT /api/owned-assets/:assetId \
  -d '{"estimatedValue": 50000}'

# Delete asset
curl DELETE /api/owned-assets/:assetId
```

### Exit Readiness Scorecard (Flagship Metric)
```bash
# Get scorecard
curl GET /api/exit-readiness/:talentId
# Returns: score (0-100), category, 7 component scores

# Get detailed breakdown
curl GET /api/exit-readiness/:talentId/breakdown
# Returns: visual-friendly metrics for dashboard

# Get improvement recommendations
curl GET /api/exit-readiness/:talentId/recommendations
# Returns: sorted by priority & impact

# Force recomputation
curl POST /api/exit-readiness/:talentId/compute
```

---

## 🎯 Common Tasks

### Task: Check if a creator is exit-ready
```typescript
import * as exitReadinessService from '../services/exitReadinessService';

const scorecard = await exitReadinessService.getExitReadinessScore(talentId);

if (scorecard.overallScore >= 75) {
  console.log('✅ Investment Grade - Ready for buyers');
} else if (scorecard.overallScore >= 50) {
  console.log('⚠️ Developing - Needs improvements');
} else {
  console.log('❌ Underdeveloped - Not yet sellable');
}

// Show recommendations
scorecard.recommendations.forEach(rec => {
  console.log(`${rec.priority}: ${rec.action} (+${rec.estimatedImpact}%)`);
});
```

### Task: Flag high-risk deals
```typescript
import * as revClassService from '../services/revenueClassificationService';

// Auto-flag all deals without proper classification
const deals = await prisma.deal.findMany({ where: { talentId } });

for (const deal of deals) {
  const classification = await revClassService.getRevenueClassification(deal.id);
  
  if (classification.isHighRisk) {
    // Send alert to manager
    await notifyManager(talentId, `Deal ${deal.id} flagged as high-risk`);
  }
}
```

### Task: Calculate total owned asset value
```typescript
const assets = await prisma.ownedAsset.findMany({ where: { talentId } });
const totalValue = assets.reduce((sum, a) => sum + Number(a.estimatedValue || 0), 0);
const totalRevenue = assets.reduce((sum, a) => sum + Number(a.revenueGeneratedAnnual || 0), 0);

console.log(`Portfolio Value: $${totalValue}`);
console.log(`Annual Revenue from Assets: $${totalRevenue}`);
```

### Task: Track business independence over time
```typescript
// Get historical data (mock - enhance with time-series DB later)
const current = await exitReadinessService.getExitReadinessScore(talentId);
const month1Ago = await getHistoricalScore(talentId, 1);

const improvement = current.founderIndependence - month1Ago.founderIndependence;
console.log(`Independence improved: ${improvement} points this month`);
```

---

## 🧪 Testing

### Unit Test Example
```typescript
import * as founderDepService from './founderDependencyService';

describe('Founder Dependency Index', () => {
  it('should calculate LOW risk for independent business', async () => {
    const score = founderDepService.calculateFounderDependencyScore({
      founderDependencyPercent: 20,
      soplessProcessCount: 1,
      manualOpsHoursPerWeek: 2,
      delegationCoveragePercent: 80,
      teamDepthScore: 75,
    });

    expect(score).toBeGreaterThan(70); // LOW risk
  });

  it('should calculate HIGH risk for founder-dependent business', async () => {
    const score = founderDepService.calculateFounderDependencyScore({
      founderDependencyPercent: 90,
      soplessProcessCount: 10,
      manualOpsHoursPerWeek: 40,
      delegationCoveragePercent: 10,
      teamDepthScore: 20,
    });

    expect(score).toBeLessThan(40); // HIGH risk
  });
});
```

### Integration Test Example
```typescript
describe('Exit Readiness Scorecard', () => {
  it('should compute score from real business data', async () => {
    // Create test talent with deals
    const talent = await prisma.talent.create({...});
    const deal = await prisma.deal.create({
      talentId: talent.id,
      value: 50000,
      ...
    });

    // Compute scorecard
    const scorecard = await exitReadinessService.computeExitReadinessScore(talent.id);

    expect(scorecard).toHaveProperty('overallScore');
    expect(scorecard.overallScore).toBeGreaterThanOrEqual(0);
    expect(scorecard.overallScore).toBeLessThanOrEqual(100);
    expect(scorecard.recommendations).toBeInstanceOf(Array);
  });
});
```

---

## 🐛 Debugging

### Check what's in the database
```bash
# Start Prisma Studio
npm run prisma:studio

# Then navigate to:
# http://localhost:5555
# Browse all tables including new ones
```

### Check a specific metric computation
```typescript
// Add this to a route or script
import * as enterpriseValueService from '../services/enterpriseValueService';

const metrics = await enterpriseValueService.computeEnterpriseValueMetrics('talent_123');

console.log('Metrics computed:', {
  recurringPercent: metrics.recurringRevenuePercent,
  founderDepPercent: metrics.founderDependentPercent,
  creatorOwnedPercent: metrics.creatorOwnedPercent,
  concentrationRisk: metrics.revenueConcentrationRisk,
  mrr: metrics.monthlyRecurringRevenue,
});
```

### Trace through risk detection
```typescript
// In revenueClassificationService.ts, add logging:
function identifyRisks(tags, dealValueType, churnRisk) {
  const risks = [];
  const isFounderDependent = tags.includes('FOUNDER_DEPENDENT');
  const isRecurring = tags.includes('RECURRING_REVENUE');

  console.log('Risk detection:', {
    tags,
    isFounderDependent,
    isRecurring,
    churnRisk,
  });

  // ... rest of logic
  
  console.log('Risks identified:', risks);
  return risks;
}
```

---

## 📊 Sample Data

### Create test talent with revenue streams
```typescript
const talent = await prisma.talent.create({
  data: {
    userId: 'user_123',
    name: 'Test Creator',
    currency: 'USD',
  },
});

// Add revenue streams
const streams = await Promise.all([
  prisma.revenueStream.create({
    data: {
      talentId: talent.id,
      name: 'YouTube Sponsorships',
      type: 'SPONSORSHIP',
      monthlyRevenue: 5000,
      isRecurring: true,
      ownershipStatus: 'CREATOR_OWNED',
    },
  }),
  prisma.revenueStream.create({
    data: {
      talentId: talent.id,
      name: 'Online Course',
      type: 'COURSE',
      monthlyRevenue: 2000,
      isRecurring: true,
      ownershipStatus: 'OWNED',
      scalabilityScore: 90,
    },
  }),
]);

// Compute metrics
const metrics = await enterpriseValueService.computeEnterpriseValueMetrics(talent.id);
console.log('Metrics:', metrics);
```

---

## 🔄 Workflow Integration Points

### When a Deal is Created
- [ ] Auto-create RevenueClassification (empty, tagged)
- [ ] If high-value: require manager to complete tagging
- [ ] Trigger metric recomputation

### When a Deal is Closed
- [ ] Validate RevenueClassification complete
- [ ] Create RevenueStream entry
- [ ] Recompute EnterpriseValueMetrics
- [ ] Recompute ExitReadinessScore
- [ ] Notify if metrics improved significantly

### When Revenue Stream Updates
- [ ] Recompute EnterpriseValueMetrics
- [ ] Recompute FounderDependencyIndex
- [ ] Recompute ExitReadinessScore

### When Owned Asset Created/Updated
- [ ] Update EnterpriseValueMetrics.totalOwnedAssetValue
- [ ] Recompute ExitReadinessScore.ipOwnership

---

## 📈 Next Steps for UI Development

### Component Checklist
- [ ] Enterprise Value Dashboard
  - [ ] Revenue breakdown pie chart
  - [ ] MRR card with trend
  - [ ] Concentration risk gauge
  - [ ] Platform dependency score
  - [ ] Owned assets summary

- [ ] Exit Readiness Scorecard
  - [ ] Overall score circle (0-100)
  - [ ] Category badge (color-coded)
  - [ ] 7-dimension breakdown (radial chart)
  - [ ] Recommendations list (priority, effort, impact)

- [ ] Owned Assets Registry
  - [ ] Asset type filter tabs
  - [ ] Table: Name, Type, Revenue, Value, Legal Status, Scalability
  - [ ] Add/Edit/Delete modals
  - [ ] Summary cards (total value, revenue, count)

- [ ] Revenue Architecture Visualizer
  - [ ] Flow diagram: Content → Lead → Conversion → Recurring
  - [ ] Gap indicators (red for missing steps)
  - [ ] Revenue per stream
  - [ ] Completeness %

- [ ] Deal Classification Modal
  - [ ] Tag selector (multi-select)
  - [ ] Value type dropdown
  - [ ] Renewal likelihood radio
  - [ ] Risk warnings (if applicable)
  - [ ] Save button

---

## 🚨 Important Gotchas

1. **Metric Computation is Async**: Always `await` computation calls
2. **High-Risk Deals Need Manager Approval**: Check `classifiedBy` field
3. **Revenue Streams Must Have talentId**: Always provide when creating
4. **Exit Readiness Score is Weighted**: 7 dimensions, not equally important
5. **Owned Assets Can Be Optional**: A creator might have zero at first
6. **Founder Dependency Impacts Valuation**: Up to 50% markdown if HIGH risk

---

## 📞 Questions?

Check these files in order:
1. `ENTERPRISE_OS_DESIGN_SPECIFICATION.md` - What each feature does
2. `ENTERPRISE_OS_IMPLEMENTATION_GUIDE.md` - How to use the APIs
3. Service files in `/apps/api/src/services/` - Implementation details
4. Route files in `/apps/api/src/routes/` - Endpoint contracts

---

**Happy building!** 🚀

