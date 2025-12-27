# 🚀 Instagram Integration - Phase 1 Implementation Complete

**Date:** December 26, 2025  
**Status:** ✅ Ready for Testing  
**Estimated Completion:** Week 1 (Instagram OAuth + Sync)

---

## ✅ What Was Implemented

### 1. Database Schema (/apps/api/prisma/schema.prisma)
Added 4 new models for social analytics:

- **SocialProfile** - Profile snapshots with follower counts, bio, metrics
- **SocialPost** - Individual posts with engagement data  
- **SocialMetric** - Historical metrics over time
- **SocialSyncLog** - Sync history, errors, rate limits
- Extended **SocialAccountConnection** with relations

### 2. Backend Services

**InstagramAuthService** (`/apps/api/src/services/instagram/InstagramAuthService.js`)
- Generate OAuth authorization URL
- Exchange authorization code for token
- Get long-lived token (60 days)
- Refresh token automatically
- Get user profile data
- Validate tokens

**InstagramSyncService** (`/apps/api/src/services/instagram/InstagramSyncService.js`)
- Sync profile data (followers, bio, etc.)
- Sync posts with engagement metrics
- Fetch Instagram Graph API data
- Calculate engagement rates
- Log all sync operations
- Handle rate limits gracefully

### 3. API Routes

**Instagram OAuth** (`/apps/api/src/routes/auth/instagram.js`)
- `GET /api/auth/instagram/connect` - Initiate OAuth
- `GET /api/auth/instagram/callback` - Handle callback
- `DELETE /api/auth/instagram/disconnect` - Disconnect account
- `POST /api/auth/instagram/sync` - Manual sync trigger

**Social Analytics** (`/apps/api/src/routes/analytics/socials.js`)
- `GET /api/analytics/socials/connections` - Get all connections
- `GET /api/analytics/socials` - Aggregated analytics
- `GET /api/analytics/socials/:platform` - Platform-specific data

### 4. Frontend Components

**ConnectInstagramButton** (`/apps/web/src/components/ConnectInstagramButton.jsx`)
- OAuth popup handling
- Loading states
- Success/error feedback
- Auto-refresh on connection

**DisconnectInstagramButton** (same file)
- Confirmation prompt
- Disconnect handling
- Success feedback

### 5. Configuration

**Environment Variables** (`/apps/api/.env.example`)
```bash
INSTAGRAM_CLIENT_ID=
INSTAGRAM_CLIENT_SECRET=
INSTAGRAM_REDIRECT_URI=http://localhost:5001/api/auth/instagram/callback
```

---

## 🎯 Next Steps - BEFORE TESTING

### Step 1: Run Database Migration (REQUIRED)

```bash
cd apps/api
npx prisma migrate dev --name add_social_analytics_models
npx prisma generate
```

This will:
- Create the 4 new database tables
- Add relations to SocialAccountConnection
- Generate Prisma client types

### Step 2: Register Instagram App

1. Go to https://developers.facebook.com/
2. Click "My Apps" → "Create App"
3. Choose "Consumer" type
4. Add "Instagram Basic Display" product
5. Configure OAuth settings:
   - **Valid OAuth Redirect URIs:**
     - Production: `https://yourdomain.com/api/auth/instagram/callback`
     - Development: `http://localhost:5001/api/auth/instagram/callback`
   - **Deauthorize Callback URL:** `https://yourdomain.com/api/webhooks/instagram/deauthorize`
   - **Data Deletion Request URL:** `https://yourdomain.com/api/webhooks/instagram/delete`
6. Save your Client ID and Client Secret

### Step 3: Add Environment Variables

Create `/apps/api/.env` (copy from `.env.example`):

```bash
# Add these lines:
INSTAGRAM_CLIENT_ID=your_app_id_from_meta
INSTAGRAM_CLIENT_SECRET=your_app_secret_from_meta
INSTAGRAM_REDIRECT_URI=http://localhost:5001/api/auth/instagram/callback
```

### Step 4: Restart API Server

```bash
cd apps/api
npm run dev
```

---

## 🧪 Testing Checklist

### Manual Testing

**OAuth Flow:**
- [ ] Navigate to dashboard
- [ ] Click "Connect Instagram" button
- [ ] OAuth popup opens correctly
- [ ] Login to Instagram and authorize
- [ ] Popup closes automatically
- [ ] Success toast appears
- [ ] Connection shows as "Connected"

**Data Sync:**
- [ ] Profile data appears (followers, bio, profile image)
- [ ] Posts sync and display correctly
- [ ] Engagement metrics show (likes, comments, views)
- [ ] Last synced timestamp is accurate

**Error Handling:**
- [ ] Cancel OAuth flow → Shows "Connection cancelled" message
- [ ] Invalid credentials → Shows error message
- [ ] Network error → Shows error message
- [ ] Rate limit → Shows "syncing" state

**Disconnect:**
- [ ] Click "Disconnect" button
- [ ] Confirmation prompt appears
- [ ] After confirming, connection status updates
- [ ] Data is preserved (doesn't delete historical data)

### API Testing (Postman/curl)

```bash
# 1. Test OAuth initiation
curl http://localhost:5001/api/auth/instagram/connect \
  -H "Cookie: your-auth-cookie"

# 2. Test connections endpoint
curl http://localhost:5001/api/analytics/socials/connections \
  -H "Cookie: your-auth-cookie"

# 3. Test aggregated analytics
curl http://localhost:5001/api/analytics/socials \
  -H "Cookie: your-auth-cookie"

# 4. Test Instagram-specific analytics
curl http://localhost:5001/api/analytics/socials/instagram \
  -H "Cookie: your-auth-cookie"

# 5. Test manual sync
curl -X POST http://localhost:5001/api/auth/instagram/sync \
  -H "Cookie: your-auth-cookie"
```

---

## 📊 Database Structure

### Tables Created

```sql
-- Social profiles (one per platform per user)
SocialProfile {
  id, connectionId, platform, handle, displayName,
  bio, profileImageUrl, followerCount, followingCount,
  postCount, engagementRate, isVerified, externalId,
  lastSyncedAt, createdAt, updatedAt
}

-- Individual posts/videos
SocialPost {
  id, profileId, platform, externalId, caption,
  mediaType, mediaUrl, thumbnailUrl, permalink,
  viewCount, likeCount, commentCount, shareCount,
  saveCount, engagementRate, postedAt, lastSyncedAt,
  createdAt, updatedAt
}

-- Historical metrics snapshots
SocialMetric {
  id, profileId, platform, metricType, value,
  snapshotDate, metadata, createdAt
}

-- Sync operation logs
SocialSyncLog {
  id, connectionId, platform, syncType, status,
  itemsSynced, errorMessage, errorCode,
  rateLimitHit, rateLimitReset, startedAt,
  completedAt, duration, createdAt
}
```

---

## 🔧 Integration with Existing Code

### Update ExclusiveTalentDashboard

Add the Instagram connection UI to `/apps/web/src/pages/ExclusiveTalentDashboard.jsx`:

```jsx
import { ConnectInstagramButton, DisconnectInstagramButton } from '../components/ConnectInstagramButton';
import { DataState } from '../components/DataState';
import { useEffect, useState } from 'react';

function SocialPlatformsSection() {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConnections();
  }, []);

  async function fetchConnections() {
    try {
      const res = await fetch('/api/analytics/socials/connections', {
        credentials: 'include'
      });
      const data = await res.json();
      setConnections(data.data?.connections || []);
    } catch (error) {
      console.error('Failed to fetch connections:', error);
    } finally {
      setLoading(false);
    }
  }

  const instagramConnection = connections.find(c => c.platform === 'instagram');

  if (loading) {
    return <DataState state="loading" resource="social connections" />;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Social Accounts</h3>

      {/* Instagram */}
      <div className="flex items-center justify-between rounded-xl border border-brand-black/10 bg-brand-white p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-pink-600">
            <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </div>
          <div>
            <p className="font-medium">Instagram</p>
            {instagramConnection?.connected && (
              <div className="flex items-center gap-2 text-sm text-brand-black/50">
                <span>@{instagramConnection.handle}</span>
                <span>•</span>
                <span>{instagramConnection.followerCount?.toLocaleString()} followers</span>
              </div>
            )}
          </div>
        </div>
        
        {instagramConnection?.connected ? (
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-xs text-green-600">
              <span className="h-2 w-2 rounded-full bg-green-600"></span>
              Connected
            </span>
            <DisconnectInstagramButton onDisconnect={fetchConnections} />
          </div>
        ) : (
          <ConnectInstagramButton onConnect={fetchConnections} />
        )}
      </div>

      {/* Placeholder for TikTok */}
      <div className="flex items-center justify-between rounded-xl border border-brand-black/10 bg-brand-linen/30 p-4 opacity-50">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-black">
            <span className="text-xs font-bold text-brand-white">TT</span>
          </div>
          <div>
            <p className="font-medium">TikTok</p>
            <p className="text-xs text-brand-black/50">Coming in Phase 2</p>
          </div>
        </div>
        <span className="text-xs text-brand-black/30">Not available</span>
      </div>

      {/* Placeholder for YouTube */}
      <div className="flex items-center justify-between rounded-xl border border-brand-black/10 bg-brand-linen/30 p-4 opacity-50">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600">
            <span className="text-xs font-bold text-white">YT</span>
          </div>
          <div>
            <p className="font-medium">YouTube</p>
            <p className="text-xs text-brand-black/50">Coming in Phase 3</p>
          </div>
        </div>
        <span className="text-xs text-brand-black/30">Not available</span>
      </div>
    </div>
  );
}
```

---

## 🚨 Known Limitations & Notes

### Instagram API Limitations

1. **Insights only for Business/Creator accounts**
   - Personal accounts can't access engagement metrics
   - Users need to convert to Business/Creator in Instagram settings

2. **Rate Limits**
   - 200 requests/hour per user
   - Solution: Daily sync via cron job (built into sync service)

3. **Token Expiration**
   - Long-lived tokens expire after 60 days
   - Solution: Refresh tokens automatically (within 7 days of expiry)

4. **Media Types**
   - Supports: Photos, Videos, Carousels, Reels
   - Stories: Not supported (24-hour expiry)

### What's Next

**Phase 1 Complete When:**
- ✅ OAuth flow works end-to-end
- ✅ Profile + posts sync successfully
- ✅ Data displays in dashboard
- ✅ Rate limits respected
- ✅ Errors logged properly
- ✅ Token refresh tested

**Phase 2: TikTok (Weeks 4-6)**
- Similar implementation pattern
- Different API endpoints and scopes
- Token refresh daily (TikTok tokens expire in 24 hours)

**Phase 3: YouTube (Weeks 7-9)**
- Google OAuth (similar to Gmail)
- YouTube Data API v3
- Video analytics and channel stats

---

## 📚 Documentation References

- [Instagram Graph API](https://developers.facebook.com/docs/instagram-api)
- [Instagram Basic Display API](https://developers.facebook.com/docs/instagram-basic-display-api)
- [OAuth 2.0 Guide](https://www.oauth.com/)
- [Rate Limiting](https://developers.facebook.com/docs/graph-api/overview/rate-limiting)

---

## ✅ Success Criteria

Phase 1 is complete when:

- [ ] Database migration runs successfully
- [ ] Instagram app registered and configured
- [ ] Environment variables set
- [ ] OAuth flow completes without errors
- [ ] Profile data syncs and displays
- [ ] Posts sync with engagement metrics
- [ ] Manual sync button works
- [ ] Disconnect functionality works
- [ ] Error states display correctly
- [ ] Rate limit handling tested
- [ ] Token stored securely in database
- [ ] Ready for production deployment

---

**🎉 You're ready to test! Run the migration, register your Instagram app, and start connecting accounts.**
