# Campaigns API Documentation

## Overview
The campaigns API provides endpoints for managing brand campaigns, allowing authenticated users to create, retrieve, and update campaign data based on their role permissions.

---

## Route Structure

**Base Path:** `/api/campaigns`

**Authentication:** All routes require authentication via session cookie or Bearer token

---

## Routes

### 1. Create Campaign
**Endpoint:** `POST /api/campaigns`

**Middleware:** `ensureManager`

**Allowed Roles:**
- `ADMIN`
- `SUPERADMIN`
- `AGENT`
- `BRAND`

**Request Body:**
```json
{
  "title": "Campaign Title (required)",
  "ownerId": "user-id (optional, defaults to requester)",
  "stage": "PLANNING | ACTIVE | REVIEW | COMPLETE (default: PLANNING)",
  "brands": [...],
  "creatorTeams": [...],
  "metadata": {}
}
```

**Response:**
```json
{
  "campaign": {
    "id": "...",
    "title": "...",
    "ownerId": "...",
    "stage": "...",
    "brandSummaries": [...],
    "aggregated": {...}
  }
}
```

**Error Responses:**
- `400` - Missing title
- `401` - Not authenticated
- `403` - Insufficient permissions (not a manager)
- `500` - Server error

---

### 2. Add Brand to Campaign
**Endpoint:** `POST /api/campaigns/:id/addBrand`

**Middleware:** `ensureManager`

**Allowed Roles:**
- `ADMIN`
- `SUPERADMIN`
- `AGENT`
- `BRAND`

**Request Body:**
```json
{
  "brand": {
    "id": "...",
    "name": "...",
    "reach": 0,
    "revenue": 0,
    "pacing": 0
  }
}
```

**Response:**
```json
{
  "campaign": { ... }
}
```

**Error Responses:**
- `400` - Invalid brand payload
- `401` - Not authenticated
- `403` - Insufficient permissions
- `404` - Campaign not found
- `500` - Server error

---

### 3. Get User Campaigns
**Endpoint:** `GET /api/campaigns/user/:userId`

**Middleware:** `ensureUser`

**Allowed Roles:** All authenticated users

**URL Parameters:**
- `:userId` - Can be:
  - `me` - Returns campaigns for the authenticated user
  - `all` - Returns all campaigns (admin only, non-admins get empty array)
  - User ID - Returns campaigns for that specific user

**Behavior:**
- **For Admins (`ADMIN`, `SUPERADMIN`)**: Can request `all` to see all campaigns
- **For Non-Admins**: Requesting `all` returns `200` with empty array (graceful degradation)
- **Campaign Ownership**: Returns campaigns where:
  - User is the owner (`ownerId`)
  - User is linked via `brandLinks` table

**Response:**
```json
{
  "campaigns": [
    {
      "id": "...",
      "title": "...",
      "ownerId": "...",
      "stage": "...",
      "brandSummaries": [...],
      "aggregated": {...}
    }
  ]
}
```

**Error Responses:**
- `401` - Not authenticated
- `200` with `{ campaigns: [] }` - No campaigns found or error occurred (graceful degradation)

**⚠️ CRITICAL ROUTE ORDERING:**
This route MUST be defined BEFORE `/api/campaigns/:id` in the router to prevent Express from matching "user" as a campaign ID.

---

### 4. Get Single Campaign
**Endpoint:** `GET /api/campaigns/:id`

**Middleware:** `ensureUser`

**Allowed Roles:** All authenticated users (with permission check)

**URL Parameters:**
- `:id` - Campaign ID

**Access Control:**
User can access campaign if:
- User is `ADMIN` or `SUPERADMIN`
- User is the campaign owner
- User is linked to the campaign via brands

**Response:**
```json
{
  "campaign": {
    "id": "...",
    "title": "...",
    "ownerId": "...",
    "stage": "...",
    "brandSummaries": [...],
    "aggregated": {...}
  }
}
```

**Error Responses:**
- `401` - Not authenticated
- `403` - Insufficient permissions
- `404` - Campaign not found
- `500` - Server error

**⚠️ CRITICAL ROUTE ORDERING:**
This route MUST be defined AFTER `/api/campaigns/user/:userId` to avoid route conflicts.

---

### 5. Update Campaign
**Endpoint:** `PUT /api/campaigns/:id`

**Middleware:** `ensureManager`

**Allowed Roles:**
- `ADMIN`
- `SUPERADMIN`
- `AGENT`
- `BRAND`

**Request Body:**
```json
{
  "title": "Updated Title (optional)",
  "stage": "PLANNING | ACTIVE | REVIEW | COMPLETE (optional)",
  "brands": [...] (optional),
  "creatorTeams": [...] (optional),
  "metadata": {} (optional)
}
```

**Response:**
```json
{
  "campaign": { ... }
}
```

**Error Responses:**
- `400` - Invalid payload
- `401` - Not authenticated
- `403` - Insufficient permissions
- `500` - Server error

---

## Middleware Reference

### `ensureUser`
- **Purpose:** Ensures user is authenticated
- **Returns:** `401` if `req.user` is not present
- **Usage:** For routes that require any authenticated user

### `ensureManager`
- **Purpose:** Ensures user is authenticated AND has manager-level permissions
- **Returns:** 
  - `401` if not authenticated
  - `403` if user role is not in: `["ADMIN", "SUPERADMIN", "AGENT", "BRAND"]`
- **Usage:** For routes that modify campaigns or require elevated permissions

---

## Helper Functions

### `isAdmin(user)`
Checks if user has admin privileges
```typescript
return user.role === "ADMIN" || user.role === "SUPERADMIN";
```

### `isManager(user)`
Checks if user has manager-level permissions
```typescript
return ["ADMIN", "SUPERADMIN", "AGENT", "BRAND"].includes(user.role);
```

### `canAccessCampaign(campaign, userId, userRole)`
Checks if user can access a specific campaign
```typescript
// Admins can access all campaigns
if (userRole === "ADMIN" || userRole === "SUPERADMIN") return true;

// Owner can access their campaigns
if (campaign.ownerId === userId) return true;

// Brand users can access campaigns they're linked to
if (campaign.brandSummaries?.some((brand) => brand.id === userId)) return true;

return false;
```

---

## Error Handling

### Graceful Degradation
The API implements graceful degradation for campaign fetching:

```typescript
// Instead of returning 403 for non-admin "all" requests:
if (targetId === "all" && !isAdmin(requester)) {
  return res.status(200).json({ campaigns: [] });
}

// Instead of crashing on database errors:
catch (error) {
  console.error("Campaigns fetch error:", error);
  res.status(200).json({ campaigns: [] });
}
```

This ensures dashboards continue to render even when:
- User lacks permissions
- Database queries fail
- No campaigns exist

### Standard HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad request (invalid payload)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (authenticated but insufficient permissions)
- `404` - Not found
- `500` - Server error

---

## Database Schema

### BrandCampaign Model
```prisma
model BrandCampaign {
  id                 String               @id
  title              String
  ownerId            String
  stage              String               @default("PLANNING")
  brands             Json?
  creatorTeams       Json?
  metadata           Json?
  createdAt          DateTime             @default(now())
  updatedAt          DateTime
  User               User                 @relation(...)
  CampaignBrandPivot CampaignBrandPivot[]
}
```

### CampaignBrandPivot Model
```prisma
model CampaignBrandPivot {
  id            String        @id
  campaignId    String
  brandId       String
  metrics       Json?
  createdAt     DateTime      @default(now())
  BrandCampaign BrandCampaign @relation(...)
  
  @@unique([campaignId, brandId])
}
```

---

## Frontend Integration

### Fetching User Campaigns
```javascript
import { apiFetch } from "./apiClient.js";

export async function fetchUserCampaigns({ session, userId }) {
  const target = userId || session?.id || "me";
  const response = await apiFetch(`/api/campaigns/user/${encodeURIComponent(target)}`);
  if (!response.ok) {
    throw new Error("Unable to load campaigns");
  }
  return response.json();
}
```

### Admin Dashboard Usage
```javascript
const { campaigns, loading, error } = useCampaigns({
  session,
  userId: isAdmin ? "all" : session?.id
});
```

---

## Known Issues & Fixes

### ✅ FIXED: Route Ordering Bug
**Issue:** `/api/campaigns/user/all` was returning 403

**Root Cause:** Express was matching `/campaigns/user/all` to the `/campaigns/:id` route because route matching happens in order. The handler treated "user" as a campaign ID, then `canAccessCampaign()` returned 403.

**Solution:** Moved `/campaigns/user/:userId` BEFORE `/campaigns/:id` in the router definition.

**Commit:** `16560a5` - "fix: reorder campaigns routes to prevent /campaigns/user/:userId being matched by /campaigns/:id"

---

## Testing

### Manual Testing
```bash
# Admin fetching all campaigns
curl -X GET http://localhost:3001/api/campaigns/user/all \
  -H "Cookie: session_token=..." \
  -H "Authorization: Bearer ..."

# Creator fetching their own campaigns
curl -X GET http://localhost:3001/api/campaigns/user/me \
  -H "Cookie: session_token=..." \
  -H "Authorization: Bearer ..."

# Fetching specific campaign
curl -X GET http://localhost:3001/api/campaigns/{campaign-id} \
  -H "Cookie: session_token=..." \
  -H "Authorization: Bearer ..."
```

### Expected Behavior
| User Role | Request | Expected Response |
|-----------|---------|-------------------|
| ADMIN | `/user/all` | 200 with all campaigns |
| CREATOR | `/user/all` | 200 with empty array |
| CREATOR | `/user/me` | 200 with user's campaigns |
| CREATOR | `/user/{otherId}` | 200 with campaigns if authorized |
| Any | `/{validId}` | 200 if authorized, 403 if not |
| Any | `/{invalidId}` | 404 |

---

## Changelog

### December 24, 2025
- **Fixed:** Route ordering bug causing 403 errors
- **Added:** Comprehensive logging for debugging
- **Added:** Graceful degradation for non-admin "all" requests
- **Improved:** Error handling to prevent dashboard crashes
- **Documented:** All routes, middleware, and access control rules
