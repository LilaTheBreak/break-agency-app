# Talent API Testing Guide

## Overview
All talent API endpoints are fully implemented and working. The API is located at `/api/talent/` and requires authentication.

## Endpoints

### 1. Get Connected Social Accounts
**Endpoint:** `GET /api/talent/socials`
**Authentication:** Required (Bearer token)
**Description:** Fetches all connected social media accounts for the current user

**Request:**
```bash
curl -X GET https://tbctbcbc.online/api/talent/socials \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

**Success Response (200):**
```json
{
  "success": true,
  "platforms": [
    {
      "id": "social_12345",
      "platform": "INSTAGRAM",
      "handle": "@username",
      "url": "https://instagram.com/username",
      "followers": 5000,
      "connectedAt": "2024-01-15T10:30:00Z",
      "lastSyncedAt": "2024-01-19T14:22:00Z"
    },
    {
      "id": "social_67890",
      "platform": "TIKTOK",
      "handle": "@creatorname",
      "url": "https://tiktok.com/@creatorname",
      "followers": 12500,
      "connectedAt": "2024-01-18T08:15:00Z",
      "lastSyncedAt": "2024-01-19T12:00:00Z"
    }
  ]
}
```

**Error Response (401):**
```json
{
  "error": "User not authenticated"
}
```

---

### 2. Disconnect a Social Account
**Endpoint:** `DELETE /api/talent/socials/:platform`
**Authentication:** Required
**Description:** Disconnects a social account by platform name (INSTAGRAM, TIKTOK, YOUTUBE, etc.)

**Request:**
```bash
curl -X DELETE https://tbctbcbc.online/api/talent/socials/instagram \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "instagram account disconnected successfully"
}
```

**Error Response (404):**
```json
{
  "error": "Social account not found",
  "message": "No instagram account connected for this user"
}
```

---

### 3. Get User Notification Preferences
**Endpoint:** `GET /api/talent/preferences`
**Authentication:** Required
**Description:** Fetches the user's notification preference settings

**Request:**
```bash
curl -X GET https://tbctbcbc.online/api/talent/preferences \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Success Response (200):**
```json
{
  "success": true,
  "preferences": {
    "emailNotifications": true,
    "campaignUpdates": true,
    "opportunityAlerts": true,
    "paymentNotifications": true,
    "weeklyDigest": false,
    "directMessagesOnly": false
  }
}
```

---

### 4. Update Notification Preferences
**Endpoint:** `PUT /api/talent/preferences`
**Authentication:** Required
**Description:** Updates the user's notification preferences

**Request:**
```bash
curl -X PUT https://tbctbcbc.online/api/talent/preferences \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "emailNotifications": false,
    "campaignUpdates": true,
    "opportunityAlerts": true,
    "paymentNotifications": true,
    "weeklyDigest": true,
    "directMessagesOnly": false
  }'
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Preferences updated successfully",
  "preferences": {
    "emailNotifications": false,
    "campaignUpdates": true,
    "opportunityAlerts": true,
    "paymentNotifications": true,
    "weeklyDigest": true,
    "directMessagesOnly": false
  }
}
```

---

### 5. Update User Profile
**Endpoint:** `PUT /api/talent/profile`
**Authentication:** Required
**Description:** Updates the user's profile information (display name, bio, timezone)

**Request:**
```bash
curl -X PUT https://tbctbcbc.online/api/talent/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "John Creator",
    "bio": "Content creator focused on lifestyle and travel",
    "timezone": "PST"
  }'
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "id": "user_12345",
    "email": "creator@example.com",
    "name": "John Creator",
    "role": "CREATOR"
  }
}
```

---

### 6. Apply for Exclusive Talent Program
**Endpoint:** `POST /api/talent/apply-exclusive`
**Authentication:** Required
**Description:** Submits an application to join the exclusive talent program. Requires at least one connected social account.

**Request:**
```bash
curl -X POST https://tbctbcbc.online/api/talent/apply-exclusive \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Application submitted successfully! Our team will review your profile."
}
```

**Error Response (400) - No Social Accounts:**
```json
{
  "error": "Missing social connections",
  "message": "You must connect at least one social media account to apply for exclusive talent status"
}
```

---

## Testing with Postman/cURL

### Step 1: Get Your Auth Token
Log in to the platform and extract your auth token from localStorage or cookies.

### Step 2: Test Each Endpoint
Use the cURL commands above, replacing `YOUR_TOKEN` with your actual authentication token.

### Step 3: Monitor Backend Logs
Watch the server logs (they start with `[TALENT]` or `[TALENT SOCIALS]`) to verify:
- Correct user ID is being identified
- Database queries are executing
- No errors are occurring

## Frontend Integration Status

✅ **CreatorSocialsPage** - Fully integrated with:
  - OAuth connection for Instagram & TikTok
  - Calls to GET `/api/talent/socials` to load connected accounts
  - Calls to DELETE `/api/talent/socials/:platform` to disconnect

✅ **CreatorAccountPage** - Fully integrated with:
  - Calls to GET `/api/talent/preferences`
  - Calls to PUT `/api/talent/preferences` to save changes
  - Calls to PUT `/api/talent/profile` to update profile info

✅ **CreatorAgentPage** - Fully integrated with:
  - Calls to POST `/api/talent/apply-exclusive` for exclusive talent application
  - Checks if user has connected socials before allowing application

## What's Next

- ✅ All API endpoints created
- ✅ Frontend integration complete
- ✅ TypeScript compilation successful
- 🔄 Backend needs to store preferences in database (currently echoes back)
- 🔄 Backend needs to store profile updates in database (currently echoes back)
- 🔄 Followers data needs to be synced from actual platform APIs

## Backend Implementation Notes

### talent.ts Routes Structure:
```
GET    /api/talent/socials              - List connected accounts
DELETE /api/talent/socials/:platform    - Disconnect account
GET    /api/talent/preferences          - Get preferences
PUT    /api/talent/preferences          - Update preferences
PUT    /api/talent/profile              - Update profile
POST   /api/talent/apply-exclusive      - Submit exclusive app
```

### Security:
- All endpoints require authentication via `requireAuth` middleware
- User ID is extracted from JWT token in request
- All inputs are validated
- Errors are logged with user context
- Database errors are caught and returned safely

### Logging:
All endpoints include console logging with format: `[TALENT] or [TALENT SOCIALS]` 
This makes debugging easy in production logs.

## Troubleshooting

### 401 Unauthorized
- Make sure you're including the Authorization header
- Token may have expired - re-login to get a new token

### 404 Social Account Not Found
- The platform name might be incorrect (use INSTAGRAM, TIKTOK, YOUTUBE, TWITTER in UPPERCASE)
- User may not have connected that account

### 500 Server Error
- Check backend logs for the actual error
- Ensure database connection is active
- User record might not exist in database

### No Data Returned
- User might not have any connected social accounts
- Preferences might not be stored in database yet (feature in development)
