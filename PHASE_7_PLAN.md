# Phase 7 Plan: Advanced Analytics & Visualizations 📊

## Overview

Phase 7 will enhance the analytics infrastructure built in Phases 5 & 6 by adding:
- **Data visualizations** (charts, graphs, trends)
- **BrandDashboard analytics integration**
- **Reusable chart components**
- **Enhanced user experience** for analytics insights

This transforms raw analytics data into actionable visual insights that help creators and brands make informed decisions.

---

## Goals

1. ✅ Add chart library (recharts) for data visualization
2. ✅ Create reusable chart component library
3. ✅ Add revenue trend charts to ExclusiveFinancials
4. ✅ Add growth visualization to ExclusiveAnalytics
5. ✅ Add campaign performance charts
6. ✅ Add social platform comparison charts
7. ✅ Wire BrandDashboard to analytics APIs
8. ✅ Test all visualizations end-to-end
9. ✅ Document Phase 7 completion

---

## Technical Architecture

### Chart Library: Recharts
- **Why Recharts?**
  - React-native components
  - Responsive by default
  - Composable API
  - Built on D3.js
  - Strong TypeScript support
  - Good documentation

### Component Structure
```
apps/web/src/components/charts/
├── LineChart.jsx          # Revenue trends, growth over time
├── BarChart.jsx           # Campaign performance, comparisons
├── PieChart.jsx           # Social platform breakdown
├── AreaChart.jsx          # Cumulative metrics
└── MetricCard.jsx         # Single metric with sparkline
```

---

## Implementation Plan

### Task 1: Install Chart Library ✅
```bash
cd apps/web
pnpm add recharts
```

**Dependencies**:
- `recharts` - Main charting library
- Already have: `react`, `react-dom`

---

### Task 2: Create Reusable Chart Components ✅

#### **LineChart Component**
**Purpose**: Display trends over time (revenue, growth, engagement)

**Props**:
```javascript
{
  data: Array<{x: string, y: number}>,
  xKey: string,
  yKey: string,
  title?: string,
  color?: string,
  height?: number,
  showGrid?: boolean,
  showTooltip?: boolean,
  formatValue?: (value) => string
}
```

**Example**:
```javascript
<LineChart
  data={revenueData.trend}
  xKey="date"
  yKey="revenue"
  title="Revenue Trend"
  color="#000000"
  formatValue={(v) => `£${v}`}
/>
```

#### **BarChart Component**
**Purpose**: Compare values (campaigns, platforms, periods)

**Props**:
```javascript
{
  data: Array<{name: string, value: number}>,
  xKey: string,
  yKey: string,
  title?: string,
  color?: string,
  height?: number
}
```

**Example**:
```javascript
<BarChart
  data={campaignPerformance}
  xKey="campaign"
  yKey="submissions"
  title="Campaign Performance"
  color="#000000"
/>
```

#### **PieChart Component**
**Purpose**: Show distribution (social platforms, revenue sources)

**Props**:
```javascript
{
  data: Array<{name: string, value: number}>,
  title?: string,
  colors?: string[],
  height?: number,
  showLegend?: boolean
}
```

**Example**:
```javascript
<PieChart
  data={socialBreakdown}
  title="Platform Distribution"
  colors={['#000', '#333', '#666', '#999']}
/>
```

#### **AreaChart Component**
**Purpose**: Cumulative metrics, stacked values

**Props**:
```javascript
{
  data: Array<{x: string, ...values}>,
  xKey: string,
  areas: Array<{key: string, color: string}>,
  title?: string,
  stacked?: boolean
}
```

---

### Task 3: Add Revenue Trend Chart to ExclusiveFinancials ✅

**File**: `apps/web/src/pages/ExclusiveTalentDashboard.jsx`  
**Component**: `ExclusiveFinancials`

**Current State**:
```javascript
// Shows current revenue, projected, trend (text only)
const financialSummary = revenueData ? [
  { label: "Current revenue", value: revenueData.current },
  { label: "Projected revenue", value: revenueData.projected },
  { label: "Trend", value: revenueData.trend }
] : FINANCIAL_SUMMARY;
```

**Enhancement**:
```javascript
// Add visual revenue trend chart
<div className="grid gap-6 md:grid-cols-2">
  {/* Left: Summary cards */}
  <div className="space-y-4">
    {financialSummary.map(item => (
      <MetricCard key={item.label} {...item} />
    ))}
  </div>
  
  {/* Right: Revenue trend chart */}
  <div className="rounded-2xl border p-6">
    <h3 className="font-serif text-xl mb-4">Revenue Trend</h3>
    <LineChart
      data={revenueData.breakdown || []}
      xKey="date"
      yKey="amount"
      color="#000000"
      formatValue={(v) => `£${(v/1000).toFixed(0)}K`}
    />
  </div>
</div>
```

---

### Task 4: Add Growth Visualization to ExclusiveAnalytics ✅

**File**: `apps/web/src/pages/ExclusiveTalentDashboard.jsx`  
**Component**: `ExclusiveAnalytics`

**Enhancement**: Add growth tracking chart using `useGrowth` hook

```javascript
import { useGrowth } from "../hooks/useAnalytics.js";

function ExclusiveAnalytics() {
  const [growthPeriod, setGrowthPeriod] = useState('30d');
  const { data: growthData, loading: growthLoading } = useGrowth(growthPeriod);
  
  return (
    <section>
      <div className="rounded-2xl border p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-serif text-xl">Growth Tracking</h3>
          <select value={growthPeriod} onChange={(e) => setGrowthPeriod(e.target.value)}>
            <option value="30d">30 Days</option>
            <option value="90d">90 Days</option>
            <option value="12m">12 Months</option>
          </select>
        </div>
        
        {growthLoading ? (
          <div className="animate-pulse h-64 bg-gray-100 rounded"></div>
        ) : (
          <LineChart
            data={growthData?.history || []}
            xKey="date"
            yKey="value"
            title="Total Reach Growth"
            color="#000000"
          />
        )}
      </div>
    </section>
  );
}
```

---

### Task 5: Add Campaign Performance Visualization ✅

**File**: `apps/web/src/pages/ExclusiveTalentDashboard.jsx`  
**Component**: `ExclusiveAnalytics`

**Enhancement**: Add campaign performance bar chart

```javascript
import { usePerformance } from "../hooks/useAnalytics.js";

function ExclusiveAnalytics() {
  const { data: performanceData } = usePerformance();
  
  return (
    <section>
      <div className="rounded-2xl border p-6">
        <h3 className="font-serif text-xl mb-4">Campaign Performance</h3>
        <BarChart
          data={performanceData?.campaigns || []}
          xKey="name"
          yKey="submissions"
          title="Submissions by Campaign"
          color="#000000"
          height={300}
        />
      </div>
    </section>
  );
}
```

---

### Task 6: Add Social Platform Comparison ✅

**File**: `apps/web/src/pages/ExclusiveTalentDashboard.jsx`  
**Component**: `ExclusiveAnalytics`

**Enhancement**: Add pie chart for social platform distribution

```javascript
// Already using useSocials() hook
const { data: socialsData } = useSocials();

// Add pie chart showing platform distribution
<div className="rounded-2xl border p-6">
  <h3 className="font-serif text-xl mb-4">Platform Distribution</h3>
  <PieChart
    data={socialsData?.platforms?.map(p => ({
      name: p.platform,
      value: p.reach
    })) || []}
    colors={['#000000', '#333333', '#666666', '#999999']}
    showLegend={true}
  />
</div>
```

---

### Task 7: Wire BrandDashboard to Analytics ✅

**File**: `apps/web/src/pages/BrandDashboard.jsx`  
**Components**: `BrandOverviewSection`

**Current State**: Uses mock data from constants

**Enhancement**: Add analytics integration

```javascript
import { useRevenue, useMetrics, useSocials } from "../hooks/useAnalytics.js";

function BrandOverviewSection({ session }) {
  const { data: revenueData, loading: revenueLoading } = useRevenue('Month');
  const { data: metricsData, loading: metricsLoading } = useMetrics();
  const { data: socialsData, loading: socialsLoading } = useSocials();
  
  // Create analytics metrics from real data
  const analyticsMetrics = metricsData ? [
    { label: "Active Campaigns", value: metricsData.activeCampaigns || "0", delta: "—" },
    { label: "Win Rate", value: metricsData.winRate || "0%", delta: "—" },
    { label: "Avg Deal Value", value: metricsData.avgDealValue || "£0", delta: "—" },
    { label: "Revenue", value: revenueData?.current || "£0", delta: revenueData?.trend || "—" }
  ] : ANALYTICS_METRICS;
  
  return (
    <section>
      {/* Display real analytics */}
      <div className="grid gap-4 md:grid-cols-4">
        {analyticsMetrics.map(metric => (
          <div key={metric.label} className="rounded-2xl border p-4">
            <div className="text-sm text-gray-600">{metric.label}</div>
            <div className="text-2xl font-serif mt-2">{metric.value}</div>
            <div className="text-sm text-green-600 mt-1">{metric.delta}</div>
          </div>
        ))}
      </div>
      
      {/* Add revenue chart */}
      {revenueData?.breakdown && (
        <div className="rounded-2xl border p-6 mt-6">
          <h3 className="font-serif text-xl mb-4">Revenue Trend</h3>
          <LineChart
            data={revenueData.breakdown}
            xKey="date"
            yKey="amount"
            color="#000000"
          />
        </div>
      )}
    </section>
  );
}
```

---

## Data Flow

### Revenue Trend Chart
```
useRevenue('Month')
  ↓
/api/analytics/revenue?period=Month
  ↓
{ current, projected, trend, breakdown: [{date, amount, source}, ...] }
  ↓
LineChart(breakdown)
  ↓
Visual trend line
```

### Growth Chart
```
useGrowth('30d')
  ↓
/api/analytics/growth?period=30d
  ↓
{ history: [{date, reach, engagement, followers}, ...] }
  ↓
LineChart(history)
  ↓
Multi-line growth chart
```

### Campaign Performance
```
usePerformance()
  ↓
/api/analytics/performance
  ↓
{ campaigns: [{name, submissions, completionRate}, ...] }
  ↓
BarChart(campaigns)
  ↓
Campaign comparison bars
```

---

## Chart Component Specifications

### LineChart.jsx
```javascript
import { LineChart as RechartsLine, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function LineChart({ 
  data, 
  xKey, 
  yKey, 
  title, 
  color = '#000000', 
  height = 300,
  showGrid = true,
  formatValue = (v) => v
}) {
  return (
    <div>
      {title && <h3 className="font-serif text-lg mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLine data={data}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
          <XAxis dataKey={xKey} stroke="#6b7280" />
          <YAxis stroke="#6b7280" tickFormatter={formatValue} />
          <Tooltip formatter={formatValue} />
          <Line 
            type="monotone" 
            dataKey={yKey} 
            stroke={color} 
            strokeWidth={2}
            dot={{ fill: color, r: 4 }}
          />
        </RechartsLine>
      </ResponsiveContainer>
    </div>
  );
}
```

### BarChart.jsx
```javascript
import { BarChart as RechartsBar, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function BarChart({ 
  data, 
  xKey, 
  yKey, 
  title, 
  color = '#000000', 
  height = 300 
}) {
  return (
    <div>
      {title && <h3 className="font-serif text-lg mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBar data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey={xKey} stroke="#6b7280" />
          <YAxis stroke="#6b7280" />
          <Tooltip />
          <Bar dataKey={yKey} fill={color} radius={[4, 4, 0, 0]} />
        </RechartsBar>
      </ResponsiveContainer>
    </div>
  );
}
```

### PieChart.jsx
```javascript
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const DEFAULT_COLORS = ['#000000', '#333333', '#666666', '#999999', '#CCCCCC'];

export function PieChart({ 
  data, 
  title, 
  colors = DEFAULT_COLORS, 
  height = 300,
  showLegend = true 
}) {
  return (
    <div>
      {title && <h3 className="font-serif text-lg mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsPie>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip />
          {showLegend && <Legend />}
        </RechartsPie>
      </ResponsiveContainer>
    </div>
  );
}
```

---

## Success Criteria

### Functionality
- ✅ Recharts installed and working
- ✅ LineChart component displays trends
- ✅ BarChart component shows comparisons
- ✅ PieChart component visualizes distributions
- ✅ ExclusiveFinancials shows revenue trend chart
- ✅ ExclusiveAnalytics shows growth chart
- ✅ Campaign performance visualized
- ✅ Social platforms compared visually
- ✅ BrandDashboard wired to analytics APIs
- ✅ All charts responsive and styled

### User Experience
- ✅ Charts load with smooth animations
- ✅ Loading states show skeleton charts
- ✅ Error states display fallback messages
- ✅ Charts are interactive (tooltips on hover)
- ✅ Responsive design works on mobile
- ✅ Performance is smooth (no lag)

### Code Quality
- ✅ Components are reusable
- ✅ Props are well-documented
- ✅ Consistent styling with brand
- ✅ No console errors
- ✅ Proper error boundaries

---

## Testing Plan

### 1. Component Testing
```bash
# Start dev servers
cd apps/api && pnpm dev
cd apps/web && pnpm dev

# Login as creator
# Visit http://localhost:5173/creator/dashboard/financials
# Verify revenue trend chart displays
# Verify chart is interactive (hover tooltips)
# Verify loading states work
```

### 2. Analytics Integration Testing
```bash
# Visit ExclusiveAnalytics page
# Verify growth chart displays
# Change time period (30d, 90d, 12m)
# Verify chart updates
# Verify campaign performance bar chart
# Verify social platform pie chart
```

### 3. BrandDashboard Testing
```bash
# Login as brand
# Visit http://localhost:5173/brand/dashboard
# Verify analytics metrics show real data
# Verify revenue chart displays
# Verify loading states
```

### 4. Responsive Testing
```bash
# Resize browser to mobile width
# Verify charts scale properly
# Verify tooltips still work
# Verify legends are readable
```

---

## Timeline

| Task | Estimated Time | Priority |
|------|---------------|----------|
| Install recharts | 5 min | HIGH |
| Create LineChart component | 20 min | HIGH |
| Create BarChart component | 15 min | HIGH |
| Create PieChart component | 15 min | MEDIUM |
| Add revenue trend to ExclusiveFinancials | 25 min | HIGH |
| Add growth chart to ExclusiveAnalytics | 25 min | HIGH |
| Add campaign performance chart | 20 min | MEDIUM |
| Add social platform chart | 20 min | MEDIUM |
| Wire BrandDashboard analytics | 30 min | HIGH |
| Test all visualizations | 30 min | HIGH |
| Document Phase 7 | 20 min | HIGH |
| **Total** | **~3.5 hours** | |

---

## Risk Assessment

### Potential Issues
1. **Recharts bundle size**: May increase initial load time
   - Mitigation: Use code splitting, lazy load chart components
   
2. **Performance with large datasets**: Charts may lag with 1000+ points
   - Mitigation: Implement data sampling, aggregate data on backend
   
3. **Mobile responsiveness**: Charts may be hard to read on small screens
   - Mitigation: Adjust chart dimensions, use simplified views on mobile
   
4. **Browser compatibility**: Recharts uses SVG
   - Mitigation: Test on Safari, Firefox, Chrome; add fallbacks

---

## Future Enhancements (Phase 8+)

1. **Export Functionality**: Download charts as PNG/PDF
2. **Custom Date Ranges**: Date picker for flexible periods
3. **Comparative Analysis**: Compare multiple time periods
4. **Real-time Updates**: WebSocket integration for live data
5. **Advanced Charts**: Heatmaps, scatter plots, radar charts
6. **Dashboard Builder**: Drag-and-drop custom dashboard
7. **Annotations**: Add notes to specific data points
8. **Forecast Models**: Predictive analytics visualization

---

## Dependencies

### Required
- `recharts` (chart library)
- Existing Phase 5 analytics APIs
- Existing Phase 6 analytics hooks

### Optional
- `date-fns` (date formatting)
- `lodash` (data transformation)

---

## File Structure After Phase 7

```
apps/web/src/
├── components/
│   └── charts/
│       ├── LineChart.jsx       ← NEW
│       ├── BarChart.jsx        ← NEW
│       ├── PieChart.jsx        ← NEW
│       └── AreaChart.jsx       ← NEW
├── hooks/
│   └── useAnalytics.js         ✓ Existing from Phase 6
├── pages/
│   ├── ExclusiveTalentDashboard.jsx  ← MODIFIED (add charts)
│   └── BrandDashboard.jsx            ← MODIFIED (add analytics)
└── ...
```

---

## Rollout Plan

### Phase 7.1: Core Components (HIGH)
1. Install recharts
2. Create LineChart, BarChart, PieChart components
3. Test components in isolation

### Phase 7.2: ExclusiveTalentDashboard (HIGH)
4. Add revenue trend chart to ExclusiveFinancials
5. Add growth chart to ExclusiveAnalytics
6. Add campaign performance chart
7. Add social platform chart

### Phase 7.3: BrandDashboard (HIGH)
8. Wire BrandDashboard to analytics APIs
9. Add revenue chart to BrandOverview
10. Add metrics display

### Phase 7.4: Testing & Documentation (HIGH)
11. Test all visualizations end-to-end
12. Test responsive behavior
13. Document Phase 7 completion

---

## Success Metrics

### Quantitative
- ✅ 4 chart components created
- ✅ 5+ charts added to dashboards
- ✅ 100% of analytics endpoints visualized
- ✅ 0 console errors
- ✅ <500ms chart render time

### Qualitative
- ✅ Charts are visually appealing
- ✅ Data insights are clear and actionable
- ✅ User experience is smooth and professional
- ✅ Code is maintainable and reusable

---

**Phase 7 transforms raw analytics data into beautiful, actionable visualizations that empower creators and brands to make data-driven decisions.**

Let's build it! 🚀
