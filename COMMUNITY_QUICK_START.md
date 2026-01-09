# Community Management - Quick Start Guide

## For Frontend Developers

### Import the Component
```tsx
import TalentCommunityTab from "@/components/TalentCommunityTab";

// Use it in your talent profile
<TalentCommunityTab talentId={talentId} />
```

### Use the Hook
```tsx
import { 
  useCommunitySnapshot, 
  useConnectAccount, 
  useDisconnectAccount 
} from "@/hooks/useCommunityData";

// Get data
const { data: snapshot, isLoading } = useCommunitySnapshot(talentId);

// Connect account
const { mutate: connect } = useConnectAccount();
connect({ 
  talentId, 
  platform: "instagram", 
  accountHandle: "username" 
});
```

### Component Props
```tsx
interface TalentCommunityTabProps {
  talentId: string;  // Required - talent's unique identifier
}
```

## For Backend Developers

### Add Connection Programmatically
```ts
import * as communityService from "./services/communityService";

// Connect account
const connection = await communityService.upsertCommunityConnection({
  talentId: "talent_123",
  platform: "instagram",
  accountHandle: "talentname",
  metadata: { verified: true }
});

// Get snapshot
const snapshot = await communityService.getCommunitySnapshot("talent_123");
```

### Record Engagement Metric
```ts
// After syncing data from Instagram API
await communityService.upsertMetric(
  connectionId,
  talentId,
  "instagram",
  "engagement_rate",
  "week",
  0.045,  // 4.5% engagement rate
  { likes: 2250, comments: 500, shares: 150 }
);
```

### Check Connection Status
```ts
const connections = await communityService.getTalentConnections(talentId);
connections.forEach(c => {
  if (c.status === "connected") {
    console.log(`Connected: @${c.accountHandle} on ${c.platform}`);
  }
});
```

## API Reference Quick Lookup

### GET Snapshot
```bash
curl -H "Authorization: Bearer token" \
  https://api.example.com/api/community/talent_123/snapshot

# Response
{
  "snapshot": {
    "connectedPlatforms": 3,
    "totalAudience": 125000,
    "engagementHealth": "Strong",
    "avgEngagementRate": 0.045,
    "mostEngagedPlatform": "instagram",
    "connections": [...],
    "metrics": [...]
  }
}
```

### POST Connect Account
```bash
curl -X POST -H "Authorization: Bearer token" \
  -H "Content-Type: application/json" \
  -d '{"platform":"instagram","accountHandle":"username"}' \
  https://api.example.com/api/community/talent_123/connections

# Response
{
  "message": "Account connected",
  "connection": {
    "id": "conn_123",
    "platform": "instagram",
    "status": "pending",
    "accountHandle": "username"
  }
}
```

### POST Metric
```bash
curl -X POST -H "Authorization: Bearer token" \
  -H "Content-Type: application/json" \
  -d '{
    "metricType": "engagement_rate",
    "period": "week",
    "value": 0.045
  }' \
  https://api.example.com/api/community/conn_123/metrics
```

## Supported Platforms
- `instagram`
- `tiktok`
- `twitter`
- `youtube`
- `linkedin`
- `discord`
- `threads`

## Connection Status Types
- `connected` - Active and syncing
- `pending` - Awaiting authorization
- `error` - Sync failed
- `inactive` - Paused or disconnected

## Metric Types
- `engagement_rate` - Percentage of audience engaging
- `comments_vs_likes` - Comment/like ratio (quality indicator)
- `saves_shares` - How often content is saved/shared
- `repeat_commenters` - % of community that engages repeatedly
- `response_velocity` - How fast audience engages

## Metric Periods
- `day` - 24-hour period
- `week` - 7-day period
- `month` - 30-day period
- `lifetime` - All-time

## Health Scoring
Based on engagement metrics and community signals:
- `Strong` - High engagement, active audience, quick response
- `Stable` - Consistent engagement, growing slowly
- `Low` - Below average engagement, declining trends

## Database Tables
- `CommunityConnection` - Social accounts
- `CommunityMetric` - Engagement metrics
- Relations via `Talent.CommunityConnections`

## Key Type Definitions
```typescript
type Platform = "instagram" | "tiktok" | "twitter" | "youtube" | "linkedin" | "discord" | "threads";
type ConnectionStatus = "connected" | "pending" | "error" | "inactive";
type MetricType = "engagement_rate" | "comments_vs_likes" | "saves_shares" | "repeat_commenters" | "response_velocity";
type MetricPeriod = "day" | "week" | "month" | "lifetime";
type EngagementHealth = "Low" | "Stable" | "Strong";
```

## File Locations
- Service: `/apps/api/src/services/communityService.ts`
- Controller: `/apps/api/src/controllers/communityController.ts`
- Routes: `/apps/api/src/routes/community.ts`
- Component: `/apps/web/src/components/TalentCommunityTab.tsx`
- Hook: `/apps/web/src/hooks/useCommunityData.ts`
- Schema: `/apps/api/prisma/schema.prisma` (CommunityConnection, CommunityMetric)

## Common Tasks

### View all connections for a talent
```ts
const connections = await communityService.getTalentConnections(talentId);
```

### Mark connection as connected (after OAuth)
```ts
await communityService.markConnectionConnected(connectionId, 50000, metadata);
```

### Handle connection error
```ts
await communityService.markConnectionError(connectionId, "API rate limited");
```

### Get specific connection
```ts
const connection = await communityService.getConnection(connectionId);
```

### Delete connection
```ts
await communityService.deleteConnection(connectionId);
```

### Calculate engagement health
```ts
const health = communityService.calculateEngagementHealth(engagementRate);
// Returns: "Low" | "Stable" | "Strong"
```

### Calculate trend
```ts
const trend = communityService.calculateTrend(previousValue, currentValue);
// Returns: "up" | "down" | "stable"
```

## Testing the Feature

### 1. Connect an account
```bash
POST /api/community/talent_123/connections
{"platform": "instagram", "accountHandle": "testuser"}
```

### 2. Mark as connected
```bash
PATCH /api/community/conn_123/mark-connected
{"followers": 50000}
```

### 3. Add metrics
```bash
POST /api/community/conn_123/metrics
{"metricType": "engagement_rate", "period": "week", "value": 0.045}
```

### 4. View snapshot
```bash
GET /api/community/talent_123/snapshot
```

## Troubleshooting

**No data in dashboard?**
- Check if account is marked as "connected" (status = "connected")
- Verify metrics exist with `GET /api/community/:talentId/snapshot`
- Check metrics timestamps are recent

**401 Unauthorized?**
- Missing or invalid authentication token
- Ensure `requireAuth` middleware is applied

**404 Not Found?**
- Verify talentId/connectionId exists
- Check database for existing connections

**Validation errors (400)?**
- Check platform spelling (lowercase)
- Verify metric value is a number
- Ensure period is one of: day, week, month, lifetime

## Next Steps for Integration

1. Add tab to talent profile navigation
2. Implement OAuth connection flows for each platform
3. Build webhook handlers for real-time metric updates
4. Create cron jobs for daily metric aggregation
5. Add admin dashboard to view all talent metrics
6. Implement sentiment analysis for feedback section
7. Build content format analysis
8. Add historical trend comparison

---

**Quick Help**: Check `COMMUNITY_MANAGEMENT_COMPLETE.md` for detailed documentation
