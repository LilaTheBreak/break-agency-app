# Phase 5 Plan: Analytics & Financial APIs

## Status: IN PROGRESS

**Start Date**: December 18, 2024  
**Target Completion**: December 18, 2024  
**Priority**: HIGH (blocks ExclusiveTalentDashboard full functionality)

---

## 🎯 Phase 5 Objectives

Phase 5 focuses on building the **analytics and financial APIs** needed to complete the ExclusiveTalentDashboard and other analytics-dependent pages. This phase removes the remaining TODO comments for analytics endpoints and wires all dashboards to real data.

### Success Criteria
- ✅ All analytics APIs built and tested
- ✅ ExclusiveTalentDashboard Analytics page wired to API
- ✅ Financial summary APIs implemented
- ✅ Social analytics endpoints functional
- ✅ All TODO comments for analytics removed
- ✅ Comprehensive error handling and loading states

---

## 📋 Tasks Breakdown

### 1. Analytics Revenue API ⚡ HIGH PRIORITY
**Endpoint**: `GET /api/analytics/revenue`  
**Purpose**: Provides revenue data for ExclusiveTalentDashboard

**Requirements**:
- Aggregate revenue from completed contracts
- Support time period filters (Week, Month, YTD, All Time)
- Calculate trends (vs previous period)
- Return rounded format (£48K not £48,234.56)
- Include projected vs actual revenue

**Response Schema**:
```json
{
  "current": "£74K",
  "projected": "£120K",
  "trend": "+18%",
  "period": "Month",
  "breakdown": [
    { "source": "Brand Deals", "amount": "£42K" },
    { "source": "UGC Content", "amount": "£18K" },
    { "source": "Events", "amount": "£14K" }
  ]
}
```

**Prisma Models Used**:
- `Contract` (finalPayment, status)
- `Deal` (amount, status)
- `OpportunityApplication` (proposedRate, status)

---

### 2. Analytics Metrics API ⚡ HIGH PRIORITY
**Endpoint**: `GET /api/analytics/metrics`  
**Purpose**: Provides high-level performance metrics

**Requirements**:
- Active campaigns count
- Total opportunities applied to
- Win rate (applications → contracts)
- Average deal value
- Response time (applications)
- Completion rate (submissions)

**Response Schema**:
```json
{
  "activeCampaigns": 8,
  "totalOpportunities": 24,
  "winRate": "42%",
  "avgDealValue": "£8.5K",
  "responseTime": "12 hours",
  "completionRate": "96%"
}
```

**Prisma Models Used**:
- `Campaign` (status)
- `OpportunityApplication` (status)
- `Contract` (status)
- `Submission` (stage)

---

### 3. Social Analytics API ⚡ HIGH PRIORITY
**Endpoint**: `GET /api/analytics/socials`  
**Purpose**: Social platform performance data

**Requirements**:
- Fetch from SocialAccount table
- Calculate growth rates
- Engagement metrics (if available from integrations)
- Platform-specific insights

**Response Schema**:
```json
{
  "platforms": [
    {
      "platform": "Instagram",
      "handle": "@exclusive.creator",
      "followers": 124500,
      "growth": "+8.2%",
      "engagement": "4.8%",
      "topPost": {
        "url": "...",
        "likes": 12400,
        "comments": 340
      }
    }
  ],
  "totalReach": "342K",
  "totalEngagement": "4.2%"
}
```

**Prisma Models Used**:
- `SocialAccount` (platform, handle, followers)
- `SocialSnapshot` (followers, engagementRate, date)

---

### 4. Growth Audit API 🔶 MEDIUM PRIORITY
**Endpoint**: `GET /api/analytics/growth`  
**Purpose**: Track creator growth over time

**Requirements**:
- Follower growth trends
- Revenue growth trends
- Opportunity growth trends
- Historical snapshots (30d, 90d, 12m)

**Response Schema**:
```json
{
  "followerGrowth": {
    "current": 342000,
    "trend": "+12%",
    "history": [310000, 320000, 332000, 342000]
  },
  "revenueGrowth": {
    "current": "£74K",
    "trend": "+18%",
    "history": ["£42K", "£58K", "£68K", "£74K"]
  }
}
```

---

### 5. Performance Analytics API 🔶 MEDIUM PRIORITY
**Endpoint**: `GET /api/analytics/performance`  
**Purpose**: Detailed performance metrics for campaigns

**Requirements**:
- Campaign-level performance
- Content performance (submissions)
- ROI calculations
- Brand satisfaction scores

**Response Schema**:
```json
{
  "campaigns": [
    {
      "id": "...",
      "name": "...",
      "performance": "Excellent",
      "roi": "340%",
      "brandScore": 4.8
    }
  ]
}
```

---

### 6. AI Insights API 🔷 LOW PRIORITY
**Endpoint**: `GET /api/analytics/insights`  
**Purpose**: AI-generated insights and recommendations

**Requirements**:
- Identify growth opportunities
- Content performance patterns
- Revenue optimization suggestions
- Scheduling recommendations

**Response Schema**:
```json
{
  "insights": [
    {
      "id": "...",
      "type": "opportunity",
      "title": "Instagram engagement peak identified",
      "description": "Your posts at 7pm GMT get 42% more engagement",
      "action": "Schedule key posts for 7pm GMT",
      "impact": "High"
    }
  ]
}
```

---

### 7. Frontend Integration 🎨
**Files to Update**:
- `apps/web/src/pages/ExclusiveTalentDashboard.jsx` (ExclusiveAnalyticsPage)
- `apps/web/src/pages/ExclusiveAnalytics.jsx` (create if needed)
- Wire financial summaries to revenue API
- Update social panels with real data

**Requirements**:
- Loading states with spinners
- Error handling with retry buttons
- Empty states with helpful messages
- Responsive charts/visualizations
- Time period selectors

---

## 🔧 Technical Implementation

### API Route Structure
Create: `apps/api/src/routes/analytics.ts`

```typescript
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';

const router = Router();

// All analytics endpoints require authentication
router.use(requireAuth);

router.get('/revenue', async (req, res) => {
  // Implementation
});

router.get('/metrics', async (req, res) => {
  // Implementation
});

router.get('/socials', async (req, res) => {
  // Implementation
});

router.get('/growth', async (req, res) => {
  // Implementation
});

router.get('/performance', async (req, res) => {
  // Implementation
});

router.get('/insights', async (req, res) => {
  // Implementation
});

export default router;
```

### Register in Server
Update `apps/api/src/server.ts`:
```typescript
import analyticsRouter from './routes/analytics.js';
app.use('/api/analytics', analyticsRouter);
```

---

## 📊 Database Queries

### Revenue Calculation
```typescript
const revenue = await prisma.contract.aggregate({
  where: {
    userId: req.user.id,
    status: 'COMPLETED'
  },
  _sum: {
    finalPayment: true
  }
});
```

### Metrics Calculation
```typescript
const activeCampaigns = await prisma.campaign.count({
  where: {
    userId: req.user.id,
    status: { in: ['ACTIVE', 'IN_PROGRESS'] }
  }
});
```

### Social Growth
```typescript
const snapshots = await prisma.socialSnapshot.findMany({
  where: {
    account: {
      userId: req.user.id
    }
  },
  orderBy: { date: 'desc' },
  take: 30
});
```

---

## 🧪 Testing Plan

### API Tests
1. **Revenue Endpoint**
   - GET /api/analytics/revenue (authenticated)
   - Verify calculations with seed data
   - Test time period filters

2. **Metrics Endpoint**
   - GET /api/analytics/metrics (authenticated)
   - Verify all counts match database
   - Test with zero data (empty state)

3. **Socials Endpoint**
   - GET /api/analytics/socials (authenticated)
   - Verify platform data
   - Test growth calculations

### Frontend Tests
1. ExclusiveTalentDashboard Analytics page loads
2. Charts render with real data
3. Loading states display correctly
4. Error handling works with retry
5. Empty states show helpful messages

---

## 📁 Files to Create/Modify

### New Files
- ✅ `apps/api/src/routes/analytics.ts` - New analytics router
- ✅ `apps/web/src/pages/ExclusiveAnalytics.jsx` - Analytics page component (if needed)
- ✅ `apps/web/src/hooks/useAnalytics.js` - Custom hook for analytics data

### Modified Files
- ✅ `apps/api/src/server.ts` - Register analytics router
- ✅ `apps/web/src/pages/ExclusiveTalentDashboard.jsx` - Wire Analytics page
- ✅ `apps/web/src/pages/ExclusiveFinancials.jsx` - Wire financial APIs
- ✅ Remove TODO comments for analytics constants

---

## 🎯 Implementation Order

### Session 1 (Current)
1. ✅ Create PHASE_5_PLAN.md
2. 🔄 Build revenue API endpoint
3. 🔄 Build metrics API endpoint
4. 🔄 Build social analytics API endpoint
5. 🔄 Test all endpoints with curl/Postman

### Session 2 (If Needed)
6. 🔄 Build growth audit API
7. 🔄 Build performance API
8. 🔄 Build insights API (basic version)
9. 🔄 Wire ExclusiveTalentDashboard
10. 🔄 Test frontend integration

---

## 🚧 Known Constraints

1. **Social Data Limitations**: May not have rich engagement data yet (depends on OAuth integrations)
2. **Historical Data**: Limited historical data in development database
3. **AI Insights**: Phase 5 will provide basic insights; advanced AI in future phase
4. **Real-time Updates**: Analytics will be calculated on-demand (no caching yet)

---

## 📦 Dependencies

**Prisma Models Required**:
- ✅ Contract (exists)
- ✅ Deal (exists)
- ✅ OpportunityApplication (exists)
- ✅ Campaign (exists)
- ✅ Submission (exists)
- ✅ SocialAccount (exists)
- ✅ SocialSnapshot (exists)

**NPM Packages**:
- No additional packages required
- Using existing Express, Prisma, TypeScript stack

---

## 🎉 Success Metrics

**Phase 5 Complete When**:
- [ ] 6 analytics endpoints functional
- [ ] ExclusiveTalentDashboard Analytics page wired
- [ ] All TODO comments for analytics removed
- [ ] Tests passing for all endpoints
- [ ] Error handling comprehensive
- [ ] Documentation updated (PHASE_5_COMPLETE.md)

---

## 📞 Test Accounts

**For Testing Analytics**:
- exclusive@thebreakco.com (EXCLUSIVE_TALENT role)
- creator@thebreakco.com (CREATOR role)
- admin@thebreakco.com (ADMIN role)

**Test Data Needed**:
- Seed completed contracts with revenue
- Seed social account snapshots
- Seed campaign data with various statuses

---

## 🔗 Related Documentation

- **Phase 4 Complete**: `PHASE_4_COMPLETE.md`
- **Exclusive Talent Status**: `EXCLUSIVE_TALENT_IMPLEMENTATION_STATUS.md`
- **Analytics Quick Start**: `CREATOR_ANALYTICS_QUICK_START.md`
- **Remaining Mock Data**: `REMAINING_MOCK_DATA.md`

---

**🚀 Let's build Phase 5 and complete the analytics infrastructure!**
