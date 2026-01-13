# Enterprise OS Phase 2B - Integration Guide

## Overview
Phase 2B focuses on integrating the 6 new components (4 from Phase 2A + 2 new from Phase 2B) into admin pages and enabling workflow integrations. This guide provides step-by-step instructions for component integration and workflow wiring.

## ✅ Components Ready for Integration

### Phase 2A Components (4 - COMPLETE)
1. **EnterpriseValueDashboard.tsx** (600 LOC)
   - Location: `/apps/web/src/components/EnterpriseValueDashboard.tsx`
   - Purpose: Real-time business health metrics
   - API Endpoint: `GET /api/enterprise-value/:talentId`
   - Integration Point: AdminTalentDetailPage

2. **ExitReadinessScorecard.tsx** (500 LOC)
   - Location: `/apps/web/src/components/ExitReadinessScorecard.tsx`
   - Purpose: 7-dimension valuation scorecard
   - API Endpoint: `GET /api/exit-readiness/:talentId`
   - Integration Point: AdminTalentDetailPage

3. **OwnedAssetsHub.tsx** (700 LOC)
   - Location: `/apps/web/src/components/OwnedAssetsHub.tsx`
   - Purpose: IP & asset registry with CRUD
   - API Endpoints: `GET/POST/PUT/DELETE /api/owned-assets/*`
   - Integration Point: AdminTalentDetailPage

4. **RevenueArchitectureVisualizer.tsx** (600 LOC)
   - Location: `/apps/web/src/components/RevenueArchitectureVisualizer.tsx`
   - Purpose: 4-stage revenue pipeline visualization
   - API Endpoint: `GET /api/revenue-architecture/:talentId`
   - Integration Point: AdminTalentDetailPage

### Phase 2B Components (2 - NEW)
5. **DealClassificationModal.tsx** (800 LOC)
   - Location: `/apps/web/src/components/DealClassificationModal.tsx`
   - Purpose: Revenue classification with risk assessment
   - API Endpoints: `GET/POST /api/revenue-classification/:dealId`, `POST /api/revenue-classification/:dealId/auto-classify`
   - Integration Point: Deal creation/edit flows
   - Blocking: Must classify before deal closure (HIGH risk requires manager approval)

6. **SOPEngineUI.tsx** (700 LOC)
   - Location: `/apps/web/src/components/SOPEngineUI.tsx`
   - Purpose: SOP template library and execution tracking
   - API Endpoints: `GET/POST /api/sop-templates/*`, `GET/POST/PATCH /api/sop-instances/*`
   - Integration Point: AdminTalentDetailPage (separate tab)
   - Note: Mock data in Phase 2, ready for API integration in Phase 3

## 📋 Integration Checklist

### Step 1: Update AdminTalentDetailPage
**File**: `/apps/web/src/pages/AdminTalentDetailPage.jsx`

```tsx
import EnterpriseValueDashboard from '@/components/EnterpriseValueDashboard';
import ExitReadinessScorecard from '@/components/ExitReadinessScorecard';
import OwnedAssetsHub from '@/components/OwnedAssetsHub';
import RevenueArchitectureVisualizer from '@/components/RevenueArchitectureVisualizer';
import SOPEngineUI from '@/components/SOPEngineUI';

// Inside component
const [activeTab, setActiveTab] = useState('overview'); // or 'metrics', 'assets', 'sop'

return (
  <div className="space-y-6">
    {/* Tab Navigation */}
    <div className="flex gap-4 border-b">
      <button onClick={() => setActiveTab('overview')}>Overview</button>
      <button onClick={() => setActiveTab('metrics')}>Enterprise Value</button>
      <button onClick={() => setActiveTab('readiness')}>Exit Readiness</button>
      <button onClick={() => setActiveTab('assets')}>Assets & IP</button>
      <button onClick={() => setActiveTab('revenue')}>Revenue Pipeline</button>
      <button onClick={() => setActiveTab('sop')}>SOP Engine</button>
    </div>

    {/* Tab Content */}
    {activeTab === 'overview' && <TalentOverview talentId={talentId} />}
    {activeTab === 'metrics' && <EnterpriseValueDashboard talentId={talentId} />}
    {activeTab === 'readiness' && <ExitReadinessScorecard talentId={talentId} />}
    {activeTab === 'assets' && <OwnedAssetsHub talentId={talentId} />}
    {activeTab === 'revenue' && <RevenueArchitectureVisualizer talentId={talentId} />}
    {activeTab === 'sop' && <SOPEngineUI talentId={talentId} />}
  </div>
);
```

### Step 2: Update AdminDealsPage
**File**: `/apps/web/src/pages/AdminDealsPage.jsx`

Add DealClassificationModal to deal creation/editing workflow:

```tsx
const [showClassification, setShowClassification] = useState(false);
const [selectedDeal, setSelectedDeal] = useState(null);

// In deal row or edit modal
<DealClassificationModal
  dealId={selectedDeal?.id}
  dealData={selectedDeal}
  isOpen={showClassification}
  onClose={() => setShowClassification(false)}
  onClassified={handleDealClassified}
  onApprovalRequired={handleApprovalRequired}
/>

// When saving deal
const handleSaveDeal = (dealData) => {
  setSelectedDeal(dealData);
  setShowClassification(true); // Force classification before save
};

const handleDealClassified = () => {
  // Proceed with deal save
  saveDealToAPI(selectedDeal);
  setShowClassification(false);
};

const handleApprovalRequired = (dealData) => {
  // For HIGH risk deals, trigger manager approval workflow
  triggerApprovalRequest(dealData);
};
```

### Step 3: Create Deal Approval Workflow
**File**: `/apps/web/src/components/DealApprovalModal.tsx` (NEW)

Create modal for manager approval of high-risk deals:

```tsx
interface DealApprovalRequest {
  id: string;
  dealId: string;
  dealData: any;
  riskLevel: 'HIGH';
  classification: any;
  requestedAt: string;
  approvedBy?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

// Component structure:
- Display deal info
- Show risk reasons
- Display classification details
- Manager decision buttons (Approve/Request Changes/Reject)
- Approval comments field
- Email notification on decision
```

### Step 4: Create Metric Refresh Integration
**File**: `/apps/web/src/hooks/useEnterpriseMetrics.ts` (NEW)

Create custom hook for metric refresh:

```tsx
export const useEnterpriseMetrics = (talentId: string) => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);

  const refreshMetrics = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/enterprise-value/${talentId}/compute`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      const data = await response.json();
      setMetrics(data);
    } finally {
      setLoading(false);
    }
  };

  return { metrics, loading, refreshMetrics };
};
```

### Step 5: Wire Up Approval Notifications
**File**: `/apps/api/src/routes/approvals.ts` (NEW)

Create approval workflow endpoints:

```typescript
// POST /api/approvals/deal-classification - Request manager approval
// PATCH /api/approvals/:approvalId - Approve/reject request
// GET /api/approvals/pending - Get pending approvals
// POST /api/approvals/:approvalId/notify - Send notification
```

## 🔄 Workflow Integration Details

### Deal Classification Flow
```
Deal Creation
  ↓
Validate Deal Data
  ↓
Show DealClassificationModal
  ↓
User selects revenue tags
  ↓
Auto-classification suggestion offered
  ↓
Risk level calculated (LOW/MEDIUM/HIGH)
  ↓
IF HIGH risk:
  → Trigger DealApprovalModal
  → Manager must approve
  → Send notification email
ELSE:
  → Save deal immediately
  → Update enterprise metrics
```

### Metric Refresh Flow
```
User clicks "Compute Enterprise Value"
  ↓
Backend processes POST /api/enterprise-value/:talentId/compute
  ↓
Aggregates all revenue streams
  ↓
Calculates metrics:
  - Recurring %
  - Founder dependency %
  - Platform concentration risk
  - Asset ownership %
  ↓
Returns updated EnterpriseValueMetrics
  ↓
Dashboard updates in real-time
  ↓
Recommendations regenerate based on new data
```

### SOP Execution Tracking
```
Create SOP Template
  ↓
Start SOP Execution (creates Instance)
  ↓
Track progress through steps
  ↓
Flag deviations if SOP not followed
  ↓
Mark complete when finished
  ↓
Analytics: Compare planned vs actual
  ↓
Update process if deviations are chronic
```

## 🎯 Real-Time Updates Strategy

### Polling Approach (Phase 2B)
- Dashboard refreshes every 30 seconds
- User can manually trigger refresh
- Minimal backend load
- Good for internal tools

### Webhook Approach (Phase 3)
- Event-driven updates
- Backend pushes changes to frontend
- Real-time collaboration
- Requires WebSocket setup

### Current Implementation
Phase 2B uses polling with manual refresh buttons:

```tsx
useEffect(() => {
  const interval = setInterval(refreshMetrics, 30000); // 30 seconds
  return () => clearInterval(interval);
}, [talentId]);
```

## 📊 Component Data Flow

```
AdminTalentDetailPage (container)
├── Tab Router (activeTab state)
├── EnterpriseValueDashboard
│   └── fetch GET /api/enterprise-value/:talentId
│   └── fetch GET /api/enterprise-value/:talentId/history
│   └── Auto-refresh every 30s
├── ExitReadinessScorecard
│   └── fetch GET /api/exit-readiness/:talentId
│   └── fetch GET /api/exit-readiness/:talentId/recommendations
│   └── Shows 7 weighted dimensions
├── OwnedAssetsHub
│   └── fetch GET /api/owned-assets/:talentId
│   └── CRUD operations for assets
│   └── Inventory summary calculations
├── RevenueArchitectureVisualizer
│   └── fetch GET /api/revenue-architecture/:talentId
│   └── Gap detection and recommendations
└── SOPEngineUI
    └── fetch GET /api/sop-templates/:talentId
    └── fetch GET /api/sop-instances/:talentId
    └── CRUD for templates and instances
```

## 🚨 Error Handling Strategy

Each component implements:
1. Loading states (skeleton loaders)
2. Error boundaries with user messages
3. Fallback UI for missing data
4. Retry buttons on API failures
5. Validation before API calls

Example:
```tsx
if (loading) return <SkeletonLoader />;
if (error) return <ErrorAlert message={error} onRetry={refetch} />;
if (!data) return <EmptyState message="No data available" />;
```

## 📦 Dependencies Required

All components use:
- **react**: ^18.0.0 (already installed)
- **typescript**: ^5.0.0 (already installed)
- **recharts**: ^2.10.0 (for charts - verify installed)
- **tailwindcss**: ^3.0.0 (for styling - verify installed)

Verify in `/apps/web/package.json`:
```json
{
  "dependencies": {
    "react": "^18.0.0",
    "recharts": "^2.10.0",
    "tailwindcss": "^3.0.0"
  }
}
```

## 🧪 Integration Testing Checklist

- [ ] Each component renders without errors
- [ ] API calls return correct data
- [ ] Tab navigation works smoothly
- [ ] Error states display properly
- [ ] Loading states show while fetching
- [ ] Modal open/close works
- [ ] Form submissions validate correctly
- [ ] Risk warnings display accurately
- [ ] Approval workflow blocks HIGH risk deals
- [ ] Metric refresh updates all charts
- [ ] SOP templates can be created/deleted
- [ ] SOP instances can be executed
- [ ] Responsive design works on mobile

## 📝 Component Status Summary

| Component | LOC | Status | Phase | Integration |
|-----------|-----|--------|-------|-------------|
| EnterpriseValueDashboard | 600 | ✅ Complete | 2A | AdminTalentDetailPage |
| ExitReadinessScorecard | 500 | ✅ Complete | 2A | AdminTalentDetailPage |
| OwnedAssetsHub | 700 | ✅ Complete | 2A | AdminTalentDetailPage |
| RevenueArchitectureVisualizer | 600 | ✅ Complete | 2A | AdminTalentDetailPage |
| DealClassificationModal | 800 | ✅ Complete | 2B | AdminDealsPage |
| SOPEngineUI | 700 | ✅ Complete | 2B | AdminTalentDetailPage |
| **Total Phase 2** | **3,900** | **✅ Complete** | **2A+2B** | **In Progress** |

## 🔗 Related Files
- [ENTERPRISE_OS_MASTER_INDEX.md](./ENTERPRISE_OS_MASTER_INDEX.md) - Complete documentation index
- [ENTERPRISE_OS_PHASE2A_LAUNCH.md](./ENTERPRISE_OS_PHASE2A_LAUNCH.md) - Phase 2A summary
- [ENTERPRISE_OS_DESIGN_SPECIFICATION.md](./ENTERPRISE_OS_DESIGN_SPECIFICATION.md) - Complete feature specification

## ⏭️ Next Steps (Phase 2B Completion)
1. **This Week**: Complete Step 1-2 (page integration)
2. **Next Week**: Complete Step 3-5 (workflow & approvals)
3. **Jan 24**: Phase 2B complete, ready for Phase 3 deployment

---

**Status**: Phase 2B Integration Planning Complete ✅
**Target Completion**: January 24, 2026
**Progress**: 14/16 tasks complete (87.5%)
