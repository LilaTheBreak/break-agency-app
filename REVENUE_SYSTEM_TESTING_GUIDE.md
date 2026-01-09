# Revenue System API Testing Guide

## Overview

Complete testing guide for the multi-platform revenue system endpoints. Includes sample requests, expected responses, and edge cases.

## Base URL
```
http://localhost:3001/api
```

## Authentication
All endpoints require session authentication. Include credentials in requests.

---

## 1. Revenue Source Endpoints

### 1.1 Create Revenue Source
**Endpoint**: `POST /api/revenue/sources`

**Request**:
```bash
curl -X POST http://localhost:3001/api/revenue/sources \
  -H "Content-Type: application/json" \
  -d '{
    "talentId": "talent_123abc",
    "platform": "SHOPIFY",
    "displayName": "Patricia Bright Beauty Store",
    "externalAccountId": "shop_abc123def456",
    "metadata": {
      "storeUrl": "patriciabright.myshopify.com",
      "currency": "GBP"
    }
  }'
```

**Expected Response (201)**:
```json
{
  "success": true,
  "data": {
    "source": {
      "id": "src_507f1f77bcf86cd799439011",
      "talentId": "talent_123abc",
      "platform": "SHOPIFY",
      "displayName": "Patricia Bright Beauty Store",
      "externalAccountId": "shop_abc123def456",
      "status": "ACTIVE",
      "metadata": {
        "storeUrl": "patriciabright.myshopify.com",
        "currency": "GBP"
      },
      "createdAt": "2025-01-09T10:30:00Z"
    }
  }
}
```

**Error Cases**:
- 400 Bad Request: Missing required fields
- 403 Forbidden: User is not exclusive talent or admin
- 409 Conflict: Duplicate source for same platform/account

---

### 1.2 Get All Revenue Sources for Talent
**Endpoint**: `GET /api/revenue/sources/:talentId`

**Request**:
```bash
curl http://localhost:3001/api/revenue/sources/talent_123abc \
  -H "Authorization: Bearer [token]"
```

**Expected Response (200)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "src_507f1f77bcf86cd799439011",
      "talentId": "talent_123abc",
      "platform": "SHOPIFY",
      "displayName": "Patricia Bright Beauty Store",
      "externalAccountId": "shop_abc123def456",
      "status": "ACTIVE",
      "createdAt": "2025-01-09T10:30:00Z"
    },
    {
      "id": "src_507f1f77bcf86cd799439012",
      "talentId": "talent_123abc",
      "platform": "TIKTOK_SHOP",
      "displayName": "Patricia's TikTok Shop",
      "externalAccountId": "shop_tiktok_123",
      "status": "ACTIVE",
      "createdAt": "2025-01-08T14:15:00Z"
    }
  ]
}
```

---

### 1.3 Get Source Details with Recent Events
**Endpoint**: `GET /api/revenue/sources/:sourceId/details`

**Request**:
```bash
curl http://localhost:3001/api/revenue/sources/src_507f1f77bcf86cd799439011/details
```

**Expected Response (200)**:
```json
{
  "success": true,
  "data": {
    "source": {
      "id": "src_507f1f77bcf86cd799439011",
      "platform": "SHOPIFY",
      "displayName": "Patricia Bright Beauty Store",
      "status": "ACTIVE",
      "createdAt": "2025-01-09T10:30:00Z"
    },
    "recentEvents": [
      {
        "id": "evt_507f1f77bcf86cd799439001",
        "date": "2025-01-09T14:22:00Z",
        "grossAmount": 149.99,
        "netAmount": 145.49,
        "currency": "GBP",
        "type": "SALE",
        "sourceReference": "shopify_order_12345"
      }
    ],
    "aggregates": {
      "totalGross": 2450.50,
      "totalNet": 2380.23,
      "eventCount": 12,
      "lastSyncedAt": "2025-01-09T14:30:00Z"
    }
  }
}
```

---

### 1.4 Delete Revenue Source
**Endpoint**: `DELETE /api/revenue/sources/:sourceId`

**Request**:
```bash
curl -X DELETE http://localhost:3001/api/revenue/sources/src_507f1f77bcf86cd799439011
```

**Expected Response (200)**:
```json
{
  "success": true,
  "message": "Revenue source deleted successfully"
}
```

---

## 2. Revenue Aggregation Endpoints

### 2.1 Get Revenue Summary
**Endpoint**: `GET /api/revenue/summary/:talentId`

**Request**:
```bash
curl "http://localhost:3001/api/revenue/summary/talent_123abc?startDate=2025-01-01&endDate=2025-01-31"
```

**Expected Response (200)**:
```json
{
  "success": true,
  "data": {
    "totalGross": 8945.75,
    "totalNet": 8230.42,
    "currency": "GBP",
    "sourceCount": 4,
    "eventCount": 156,
    "dateRange": {
      "startDate": "2025-01-01T00:00:00Z",
      "endDate": "2025-01-31T23:59:59Z"
    }
  }
}
```

---

### 2.2 Get Revenue by Platform
**Endpoint**: `GET /api/revenue/by-platform/:talentId`

**Request**:
```bash
curl "http://localhost:3001/api/revenue/by-platform/talent_123abc?startDate=2025-01-01&endDate=2025-01-31"
```

**Expected Response (200)**:
```json
{
  "success": true,
  "data": [
    {
      "platform": "SHOPIFY",
      "totalGross": 4500.00,
      "totalNet": 4350.00,
      "sourceCount": 2,
      "eventCount": 67,
      "averagePerEvent": 64.93
    },
    {
      "platform": "TIKTOK_SHOP",
      "totalGross": 2200.00,
      "totalNet": 1980.00,
      "sourceCount": 1,
      "eventCount": 34,
      "averagePerEvent": 58.24
    },
    {
      "platform": "LTK",
      "totalGross": 1800.00,
      "totalNet": 1560.00,
      "sourceCount": 1,
      "eventCount": 45,
      "averagePerEvent": 34.67
    },
    {
      "platform": "AMAZON",
      "totalGross": 445.75,
      "totalNet": 340.42,
      "sourceCount": 1,
      "eventCount": 10,
      "averagePerEvent": 34.04
    }
  ]
}
```

---

### 2.3 Get Revenue by Source
**Endpoint**: `GET /api/revenue/by-source/:talentId`

**Request**:
```bash
curl "http://localhost:3001/api/revenue/by-source/talent_123abc?startDate=2025-01-01&endDate=2025-01-31"
```

**Expected Response (200)**:
```json
{
  "success": true,
  "data": [
    {
      "sourceId": "src_507f1f77bcf86cd799439011",
      "platform": "SHOPIFY",
      "displayName": "Patricia Bright Beauty Store",
      "totalGross": 2800.00,
      "totalNet": 2716.00,
      "eventCount": 42,
      "averagePerEvent": 64.67
    },
    {
      "sourceId": "src_507f1f77bcf86cd799439012",
      "platform": "SHOPIFY",
      "displayName": "Patricia's Fashion Shop",
      "totalGross": 1700.00,
      "totalNet": 1634.00,
      "eventCount": 25,
      "averagePerEvent": 65.36
    },
    {
      "sourceId": "src_507f1f77bcf86cd799439013",
      "platform": "TIKTOK_SHOP",
      "displayName": "Patricia's TikTok Shop",
      "totalGross": 2200.00,
      "totalNet": 1980.00,
      "eventCount": 34,
      "averagePerEvent": 58.24
    }
  ]
}
```

---

## 3. Revenue Goal Endpoints

### 3.1 Create Revenue Goal
**Endpoint**: `POST /api/revenue/goals`

**Request**:
```bash
curl -X POST http://localhost:3001/api/revenue/goals \
  -H "Content-Type: application/json" \
  -d '{
    "talentId": "talent_123abc",
    "goalType": "MONTHLY_TOTAL",
    "targetAmount": 5000,
    "currency": "GBP",
    "startDate": "2025-01-01T00:00:00Z",
    "endDate": "2025-01-31T23:59:59Z",
    "notes": "Q1 revenue target for January"
  }'
```

**Expected Response (201)**:
```json
{
  "success": true,
  "data": {
    "goal": {
      "id": "goal_507f1f77bcf86cd799439001",
      "talentId": "talent_123abc",
      "goalType": "MONTHLY_TOTAL",
      "platform": null,
      "targetAmount": 5000,
      "currency": "GBP",
      "notes": "Q1 revenue target for January",
      "createdAt": "2025-01-09T10:35:00Z",
      "updatedAt": "2025-01-09T10:35:00Z"
    }
  }
}
```

---

### 3.2 Get Goals with Progress
**Endpoint**: `GET /api/revenue/goals/:talentId`

**Request**:
```bash
curl "http://localhost:3001/api/revenue/goals/talent_123abc"
```

**Expected Response (200)**:
```json
{
  "success": true,
  "data": [
    {
      "goal": {
        "id": "goal_507f1f77bcf86cd799439001",
        "talentId": "talent_123abc",
        "goalType": "MONTHLY_TOTAL",
        "platform": null,
        "targetAmount": 5000,
        "currency": "GBP",
        "notes": "January target"
      },
      "actualAmount": 3500.75,
      "percentageOfTarget": 70,
      "isOnTrack": true,
      "daysRemaining": 15
    },
    {
      "goal": {
        "id": "goal_507f1f77bcf86cd799439002",
        "talentId": "talent_123abc",
        "goalType": "PLATFORM_SPECIFIC",
        "platform": "SHOPIFY",
        "targetAmount": 3000,
        "currency": "GBP",
        "notes": "Shopify-only target"
      },
      "actualAmount": 2800.00,
      "percentageOfTarget": 93,
      "isOnTrack": true,
      "daysRemaining": 15
    }
  ]
}
```

---

### 3.3 Delete Goal
**Endpoint**: `DELETE /api/revenue/goals/:goalId`

**Request**:
```bash
curl -X DELETE http://localhost:3001/api/revenue/goals/goal_507f1f77bcf86cd799439001
```

**Expected Response (200)**:
```json
{
  "success": true,
  "message": "Goal deleted successfully"
}
```

---

## Test Scenarios

### Scenario 1: New Talent Setup
1. Create Shopify source
2. Create TikTok Shop source
3. Create LTK source
4. Create monthly revenue goal (£5000)
5. Verify aggregations show all 3 sources
6. Verify goal shows 0% progress

### Scenario 2: Revenue Recording
1. Create revenue source
2. Record 5 revenue events with different amounts
3. Query summary - verify total matches
4. Query by-platform - verify breakdown correct
5. Query by-source - verify per-source totals
6. Verify goals show updated progress

### Scenario 3: Deduplication
1. Create revenue source
2. Record event with sourceReference = "order_123"
3. Try to record same event again
4. Verify only 1 event recorded in database
5. Verify aggregations only count once

### Scenario 4: Access Control
1. Create source as admin for talent_A
2. Try to fetch as talent_B
3. Verify 403 error returned
4. Fetch as admin
5. Verify success

### Scenario 5: Date Range Filtering
1. Create source and record events on multiple days
2. Query with startDate = "2025-01-01", endDate = "2025-01-15"
3. Verify only events within range returned
4. Query with different date range
5. Verify different results

---

## Manual Testing with Curl

### Setup Test Data
```bash
# Create test talent
TALENT_ID="talent_test_$(date +%s)"

# Create Shopify source
curl -X POST http://localhost:3001/api/revenue/sources \
  -H "Content-Type: application/json" \
  -d '{
    "talentId": "'$TALENT_ID'",
    "platform": "SHOPIFY",
    "displayName": "Test Shopify Store",
    "externalAccountId": "shop_test_123"
  }'

# Create TikTok Shop source
curl -X POST http://localhost:3001/api/revenue/sources \
  -H "Content-Type: application/json" \
  -d '{
    "talentId": "'$TALENT_ID'",
    "platform": "TIKTOK_SHOP",
    "displayName": "Test TikTok Shop",
    "externalAccountId": "tiktok_test_123"
  }'

# Create monthly goal
curl -X POST http://localhost:3001/api/revenue/goals \
  -H "Content-Type: application/json" \
  -d '{
    "talentId": "'$TALENT_ID'",
    "goalType": "MONTHLY_TOTAL",
    "targetAmount": 5000,
    "currency": "GBP"
  }'

# View summary
curl http://localhost:3001/api/revenue/summary/$TALENT_ID

# View by platform
curl http://localhost:3001/api/revenue/by-platform/$TALENT_ID

# View goals
curl http://localhost:3001/api/revenue/goals/$TALENT_ID
```

---

## Common Issues

### Issue 1: 403 Forbidden on Create Source
**Cause**: User is not EXCLUSIVE talent or ADMIN
**Solution**: Ensure user role is ADMIN or talentId matches user's id and role is EXCLUSIVE

### Issue 2: Aggregation shows 0 events
**Cause**: No revenue events recorded for date range
**Solution**: Verify dates with startDate/endDate, check event.date field

### Issue 3: Duplicate sources not prevented
**Cause**: Unique constraint on (talentId, platform, externalAccountId) not applied
**Solution**: Run Prisma migration: `npx prisma migrate deploy`

### Issue 4: Goals always show 0% progress
**Cause**: Goal created but no revenue events exist
**Solution**: Record revenue events first, then create goal, then query

---

## Performance Benchmarks

Expected query response times on fresh database:

| Endpoint | Time | Note |
|----------|------|------|
| GET /api/revenue/summary | <50ms | Single aggregation |
| GET /api/revenue/by-platform | <100ms | Groups by platform |
| GET /api/revenue/by-source | <150ms | Groups by source |
| GET /api/revenue/goals | <50ms | Simple query |
| POST /api/revenue/sources | <20ms | Insert operation |

---

## Success Criteria

✅ All 10 endpoints respond without errors
✅ Revenue aggregations match manual calculations
✅ Deduplication prevents duplicate events
✅ Access control enforces permissions
✅ Date range filtering works correctly
✅ Goal progress calculations accurate
✅ Create/Read/Delete operations work for all resources
✅ Error responses have appropriate status codes and messages

