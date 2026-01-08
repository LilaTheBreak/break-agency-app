# API Stability Fixes - Detailed Code Changes

---

## File 1: `apps/api/src/routes/adminActivity.ts`

### Added: `/api/activity` Endpoint + Error Handling

**Full New Content:**

```typescript
import { Router } from "express";
import prisma from "../lib/prisma.js";
import { isAdminRequest } from "../lib/auditLogger.js";
import { logError } from "../lib/logger.js";

const router = Router();

/**
 * GET /api/activity - Get recent activity logs (backwards compatible endpoint)
 * Frontend expects this endpoint; routes to admin activity
 */
router.get("/activity", async (req, res) => {
  try {
    if (!isAdminRequest(req)) {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    const limit = Math.min(parseInt(String(req.query.limit ?? "50"), 10) || 50, 200);
    
    // Fetch recent audit logs
    const logs = await prisma.auditLog.findMany({
      where: {
        entityType: "AdminActivity"
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        userId: true,
        action: true,
        entityType: true,
        entityId: true,
        timestamp: true,
        createdAt: true
      }
    });
    
    // Return as array (frontend expects array, not object wrapper)
    return res.json(logs);
  } catch (error) {
    logError("[/api/activity] Failed to fetch activity", error, { userId: (req as any).user?.id });
    return res.status(500).json({ 
      error: "Failed to fetch activity logs",
      errorCode: "ACTIVITY_FETCH_FAILED"
    });
  }
});

/**
 * GET /api/admin/activity - Get admin activity logs
 */
router.get("/admin/activity", async (req, res) => {
  try {
    if (!isAdminRequest(req)) {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    const limit = Math.min(parseInt(String(req.query.limit ?? "50"), 10) || 50, 200);
    
    const logs = await prisma.auditLog.findMany({
      where: {
        entityType: "AdminActivity"
      },
      orderBy: { createdAt: "desc" },
      take: limit
    });
    
    return res.json({ activities: logs });
  } catch (error) {
    logError("[/api/admin/activity] Failed to fetch admin activity", error, { userId: (req as any).user?.id });
    return res.status(500).json({ 
      error: "Failed to fetch activity logs",
      errorCode: "ACTIVITY_FETCH_FAILED"
    });
  }
});

/**
 * GET /api/admin/activity/live - Get live activity updates
 */
router.get("/admin/activity/live", async (req, res) => {
  try {
    if (!isAdminRequest(req)) {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    const since = req.query.since ? new Date(String(req.query.since)) : null;
    
    const query = prisma.auditLog.findMany({
      where: {
        entityType: "AdminActivity",
        ...(since ? { createdAt: { gt: since } } : {})
      },
      orderBy: { createdAt: "desc" },
      take: 50
    });
    
    const activities = await query;
    return res.json({ activities });
  } catch (error) {
    logError("[/api/admin/activity/live] Failed to fetch live activity", error, { userId: (req as any).user?.id });
    return res.status(500).json({ 
      error: "Failed to fetch live activity",
      errorCode: "ACTIVITY_LIVE_FETCH_FAILED"
    });
  }
});

export default router;
```

### Changes Summary
- ✅ Added new route: `GET /api/activity`
- ✅ Added try/catch to all endpoints
- ✅ Added proper error logging with context
- ✅ Returns 500 with structured error object on failure
- ✅ Maintains auth checks

---

## File 2: `apps/api/src/routes/index.ts`

### Added: Queues Router Import & Mount

**Changes:**

```typescript
// Line 26: Added import
import queuesRouter from "./queues.js";

// Lines 95-96: Mounted router
router.use("/queues", queuesRouter);
```

**Before (lines 1-26):**
```typescript
import { Prisma, type User } from "@prisma/client";
import { Router, Request, Response } from "express";
import prisma from "../lib/prisma.js";

// Feature routers
import socialRouter from "./social.js";
import emailRouter from "./email.js";
// ... other imports ...
import campaignsRouter from "./campaigns.js";
import deckRouter from "./deck.js";
// ← queuesRouter was NOT imported here
```

**After (lines 1-26):**
```typescript
import { Prisma, type User } from "@prisma/client";
import { Router, Request, Response } from "express";
import prisma from "../lib/prisma.js";

// Feature routers
import socialRouter from "./social.js";
import emailRouter from "./email.js";
// ... other imports ...
import campaignsRouter from "./campaigns.js";
import deckRouter from "./deck.js";
import queuesRouter from "./queues.js";  // ← ADDED
```

**Before (lines 95-105):**
```typescript
router.use(socialRouter);
router.use(emailRouter);
router.use(auditRouter);
router.use(adminActivityRouter);
router.use(payoutsRouter);
router.use("/dashboard", dashboardRouter);
router.use("/dashboard", dashboardRevenueRouter);
router.use("/dashboard", dashboardCampaignPacingRouter);
router.use(messagesRouter);
// ← queuesRouter was NOT mounted
```

**After (lines 95-106):**
```typescript
router.use(socialRouter);
router.use(emailRouter);
router.use(auditRouter);
router.use(adminActivityRouter);
router.use(payoutsRouter);
router.use("/dashboard", dashboardRouter);
router.use("/dashboard", dashboardRevenueRouter);
router.use("/dashboard", dashboardCampaignPacingRouter);
router.use("/queues", queuesRouter);  // ← ADDED
router.use(messagesRouter);
```

### Changes Summary
- ✅ Import queuesRouter (line 26)
- ✅ Mount at `/queues` (line 96)
- ✅ Routes now accessible at `/api/queues/*`

---

## File 3: `apps/web/src/services/dashboardClient.js`

### Updated: getRecentActivity() with 5xx Error Handling

**Before (lines 14-32):**
```javascript
export async function getRecentActivity(limit = 5) {
  const response = await apiFetch(`/api/activity?limit=${limit}`);
  // Handle permission errors gracefully - return empty array
  if (response.status === 403) {
    return [];
  }
  // Handle not found - return empty array
  if (response.status === 404) {
    return [];
  }
  // If response is ok, return data (even if empty array)
  if (response.ok) {
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }
  // For any other error, return empty array (graceful degradation)
  return [];
}
```

**After (lines 14-53):**
```javascript
export async function getRecentActivity(limit = 5) {
  try {
    const response = await apiFetch(`/api/activity?limit=${limit}`);
    
    // Handle permission errors gracefully - return empty array
    if (response.status === 403) {
      console.warn("[Activity] Permission denied (403)");
      return [];
    }
    
    // Handle not found - return empty array
    if (response.status === 404) {
      console.warn("[Activity] Endpoint not found (404)");
      return [];
    }
    
    // Handle server errors gracefully - return empty array instead of crashing
    if (response.status >= 500) {
      console.error("[Activity] Server error (" + response.status + ")");
      return [];
    }
    
    // If response is ok, return data (even if empty array)
    if (response.ok) {
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    }
    
    // For any other error, return empty array (graceful degradation)
    console.warn("[Activity] Failed to fetch (status " + response.status + ")");
    return [];
  } catch (error) {
    console.error("[Activity] Fetch error:", error);
    return [];
  }
}
```

### Updated: getPendingApprovals() with 5xx Error Handling

**Before (lines 35-50):**
```javascript
export async function getPendingApprovals(limit = 4) {
  const response = await apiFetch(`/api/approvals?status=pending&limit=${limit}`);
  if (response.status === 403) {
    return [];
  }
  if (response.status === 404) {
    return [];
  }
  if (!response.ok) {
    const error = new Error("Failed to fetch pending approvals");
    error.status = response.status;
    throw error;  // ← This throws and crashes the page!
  }
  return response.json();
}
```

**After (lines 55-91):**
```javascript
export async function getPendingApprovals(limit = 4) {
  try {
    const response = await apiFetch(`/api/approvals?status=pending&limit=${limit}`);
    
    // Handle permission errors gracefully
    if (response.status === 403) {
      console.warn("[Approvals] Permission denied (403)");
      return [];
    }
    
    // Handle not found
    if (response.status === 404) {
      console.warn("[Approvals] Endpoint not found (404)");
      return [];
    }
    
    // Handle server errors gracefully
    if (response.status >= 500) {
      console.error("[Approvals] Server error (" + response.status + ")");
      return [];
    }
    
    // If response is ok, return data
    if (response.ok) {
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    }
    
    // For any other error
    console.warn("[Approvals] Failed to fetch (status " + response.status + ")");
    return [];
  } catch (error) {
    console.error("[Approvals] Fetch error:", error);
    return [];
  }
}
```

### Changes Summary
- ✅ Added try/catch blocks (prevents throws)
- ✅ Added 5xx error handling (lines 25-27 in getRecentActivity)
- ✅ Added console logging (debugging)
- ✅ Always returns empty array on error (graceful degradation)
- ✅ Never throws (prevents page crash)

---

## Summary of Changes

| File | Type | Location | Changes |
|------|------|----------|---------|
| **adminActivity.ts** | Backend | Route handler | +New `/api/activity` endpoint + try/catch + logging |
| **index.ts** | Backend | Router mount | +Import queuesRouter + mount at `/queues` |
| **dashboardClient.js** | Frontend | API client | +5xx error handling + try/catch in 2 functions |

**Total Lines Added:** ~110  
**Breaking Changes:** 0  
**New Dependencies:** 0

---

## Testing the Changes

### Test 1: Queues Endpoint
```bash
curl -X GET http://localhost:3001/api/queues/all \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected Response: 200 OK
# { "id": "...", ... }
```

### Test 2: Activity Endpoint
```bash
curl -X GET "http://localhost:3001/api/activity?limit=5" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected Response: 200 OK
# [{ "id": "...", "action": "...", ... }]
```

### Test 3: Server Error Handling (Frontend)
```javascript
// Open browser console on /admin/dashboard
// Should see logs like:
// [Activity] Server error (500)
// [Activity] Fetch error: Error...
// ✅ Dashboard still loads (empty activity section)
```

---

## Deployment Checklist

- [ ] Code reviewed
- [ ] Builds pass (web: ✅, api: compile-checked)
- [ ] Files staged for deployment
- [ ] API deployed first
- [ ] Web deployed second
- [ ] Cache cleared
- [ ] Test admin pages load
- [ ] Monitor logs for errors

---

**All changes complete and ready for deployment** ✅
