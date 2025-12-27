# 🎯 Social Analytics - Official API Implementation Plan

**Date:** December 26, 2025  
**Approach:** Option 1 - Official API Integrations  
**Timeline:** 8-12 weeks (2-3 weeks per platform)  
**Status:** Foundation ready, OAuth flows needed

---

## 📋 Executive Summary

This document outlines the compliant, production-ready implementation of social analytics using official APIs from Instagram, TikTok, and YouTube. This approach is:

✅ **Legal** - Complies with all platform Terms of Service  
✅ **Reliable** - Officially supported, stable APIs  
✅ **Scalable** - Designed for production use  
✅ **Future-proof** - Won't break with platform UI changes

**Current State:**
- Database schema exists (`SocialAccountConnection` model)
- Frontend UI exists but shows empty states
- Truth layer components ready for integration
- No OAuth flows implemented yet

**What We're Building:**
1. OAuth 2.0 flows for Instagram, TikTok, YouTube
2. Token management and refresh logic
3. Data sync services with rate limit handling
4. Analytics storage and aggregation
5. UI integration with real-time data

---

## 🏗️ Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                          │
├─────────────────────────────────────────────────────────────┤
│ • Connect Account Buttons (OAuth initiation)                │
│ • Social Analytics Panels (data display)                    │
│ • Sync Status Indicators (loading/syncing/error states)     │
│ • Truth Layer Integration (DataState components)            │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                   API Routes (Express)                       │
├─────────────────────────────────────────────────────────────┤
│ • /api/auth/instagram/connect                               │
│ • /api/auth/instagram/callback                              │
│ • /api/auth/tiktok/connect                                  │
│ • /api/auth/tiktok/callback                                 │
│ • /api/auth/youtube/connect                                 │
│ • /api/auth/youtube/callback                                │
│ • /api/analytics/socials (aggregated data)                  │
│ • /api/analytics/socials/:platform (platform-specific)      │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│              Social Sync Services (Background)               │
├─────────────────────────────────────────────────────────────┤
│ • InstagramSyncService (daily profile + posts sync)         │
│ • TikTokSyncService (daily profile + videos sync)           │
│ • YouTubeSyncService (daily channel + videos sync)          │
│ • Rate Limit Manager (respect API quotas)                   │
│ • Token Refresh Service (auto-refresh expired tokens)       │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                 Database (PostgreSQL/Prisma)                 │
├─────────────────────────────────────────────────────────────┤
│ • SocialAccountConnection (OAuth tokens, status)            │
│ • SocialProfile (follower counts, bio, metrics)             │
│ • SocialPost (posts/videos with performance data)           │
│ • SocialMetric (historical analytics snapshots)             │
│ • SocialSyncLog (sync history, errors, rate limits)         │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│              External APIs (Platform SDKs)                   │
├─────────────────────────────────────────────────────────────┤
│ • Instagram Graph API (Meta/Facebook)                       │
│ • TikTok for Developers API (ByteDance)                     │
│ • YouTube Data API v3 (Google)                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Database Schema Extensions

### Existing Schema (Already in place)

```prisma
model SocialAccountConnection {
  id           String    @id
  creatorId    String
  platform     String    // "instagram" | "tiktok" | "youtube"
  handle       String
  connected    Boolean   @default(false)
  accessToken  String?
  refreshToken String?
  expiresAt    DateTime?
  lastSyncedAt DateTime?
  metadata     Json?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime
  Talent       Talent    @relation(fields: [creatorId], references: [id], onDelete: Cascade)

  @@unique([creatorId, platform])
  @@index([creatorId, connected])
  @@index([platform])
}
```

### New Schema Additions (Required)

```prisma
// Social profile snapshots (followers, bio, metrics)
model SocialProfile {
  id                String    @id @default(cuid())
  connectionId      String    @unique
  platform          String    // "instagram" | "tiktok" | "youtube"
  handle            String
  displayName       String?
  bio               String?
  profileImageUrl   String?
  followerCount     Int       @default(0)
  followingCount    Int?
  postCount         Int?
  averageViews      Float?
  averageEngagement Float?
  engagementRate    Float?
  isVerified        Boolean   @default(false)
  externalId        String?   // Platform-specific user ID
  lastSyncedAt      DateTime?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime
  
  connection        SocialAccountConnection @relation(fields: [connectionId], references: [id], onDelete: Cascade)
  posts             SocialPost[]
  metrics           SocialMetric[]

  @@index([platform, handle])
  @@index([connectionId])
}

// Individual posts/videos
model SocialPost {
  id              String    @id @default(cuid())
  profileId       String
  platform        String
  externalId      String    // Platform-specific post ID
  caption         String?
  mediaType       String    // "photo" | "video" | "carousel" | "reel" | "short"
  mediaUrl        String?
  thumbnailUrl    String?
  permalink       String?
  viewCount       Int?
  likeCount       Int?
  commentCount    Int?
  shareCount      Int?
  saveCount       Int?
  engagementRate  Float?
  postedAt        DateTime
  lastSyncedAt    DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime
  
  profile         SocialProfile @relation(fields: [profileId], references: [id], onDelete: Cascade)

  @@unique([platform, externalId])
  @@index([profileId, postedAt])
  @@index([platform, postedAt])
}

// Historical metrics (snapshots over time)
model SocialMetric {
  id              String    @id @default(cuid())
  profileId       String
  platform        String
  metricType      String    // "follower_count" | "engagement_rate" | "avg_views"
  value           Float
  snapshotDate    DateTime  @default(now())
  metadata        Json?
  createdAt       DateTime  @default(now())
  
  profile         SocialProfile @relation(fields: [profileId], references: [id], onDelete: Cascade)

  @@index([profileId, snapshotDate])
  @@index([metricType, snapshotDate])
}

// Sync logs (track sync history, errors, rate limits)
model SocialSyncLog {
  id              String    @id @default(cuid())
  connectionId    String
  platform        String
  syncType        String    // "profile" | "posts" | "metrics"
  status          String    // "success" | "partial" | "failed"
  itemsSynced     Int       @default(0)
  errorMessage    String?
  errorCode       String?
  rateLimitHit    Boolean   @default(false)
  rateLimitReset  DateTime?
  startedAt       DateTime
  completedAt     DateTime?
  duration        Int?      // milliseconds
  createdAt       DateTime  @default(now())

  @@index([connectionId, createdAt])
  @@index([platform, status])
  @@index([rateLimitHit])
}
```

### Migration Command

```bash
# Add to schema.prisma, then run:
npx prisma migrate dev --name add_social_analytics_models
npx prisma generate
```

---

## 🔐 Phase 1: Instagram Graph API (Weeks 1-3)

### 1.1 App Registration (Day 1)

**Steps:**
1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create new app → "Consumer" type
3. Add "Instagram Basic Display" product
4. Configure OAuth settings:
   - **Valid OAuth Redirect URIs:**
     - `https://yourdomain.com/api/auth/instagram/callback`
     - `http://localhost:5050/api/auth/instagram/callback` (dev)
   - **Deauthorize Callback URL:** `https://yourdomain.com/api/webhooks/instagram/deauthorize`
   - **Data Deletion Request URL:** `https://yourdomain.com/api/webhooks/instagram/delete`

**Environment Variables:**

```bash
# apps/api/.env
INSTAGRAM_CLIENT_ID=your_app_id
INSTAGRAM_CLIENT_SECRET=your_app_secret
INSTAGRAM_REDIRECT_URI=https://yourdomain.com/api/auth/instagram/callback
```

### 1.2 OAuth Flow Implementation (Days 2-3)

**File:** `/apps/api/src/services/instagram/InstagramAuthService.js`

```javascript
import axios from 'axios';

export class InstagramAuthService {
  constructor() {
    this.clientId = process.env.INSTAGRAM_CLIENT_ID;
    this.clientSecret = process.env.INSTAGRAM_CLIENT_SECRET;
    this.redirectUri = process.env.INSTAGRAM_REDIRECT_URI;
  }

  /**
   * Generate Instagram OAuth URL
   * @param {string} userId - User ID to track in state
   * @returns {string} OAuth authorization URL
   */
  getAuthorizationUrl(userId) {
    const state = Buffer.from(JSON.stringify({ userId, timestamp: Date.now() })).toString('base64');
    const scope = 'user_profile,user_media';
    
    return `https://api.instagram.com/oauth/authorize?client_id=${this.clientId}&redirect_uri=${this.redirectUri}&scope=${scope}&response_type=code&state=${state}`;
  }

  /**
   * Exchange authorization code for access token
   * @param {string} code - Authorization code from callback
   * @returns {Promise<Object>} Token response with accessToken, userId
   */
  async exchangeCodeForToken(code) {
    try {
      const response = await axios.post('https://api.instagram.com/oauth/access_token', {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'authorization_code',
        redirect_uri: this.redirectUri,
        code
      }, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      // Short-lived token (1 hour), need to exchange for long-lived
      return response.data; // { access_token, user_id }
    } catch (error) {
      console.error('Instagram token exchange failed:', error.response?.data);
      throw new Error('Failed to authenticate with Instagram');
    }
  }

  /**
   * Exchange short-lived token for long-lived token (60 days)
   * @param {string} shortLivedToken - Short-lived access token
   * @returns {Promise<Object>} Long-lived token response
   */
  async getLongLivedToken(shortLivedToken) {
    try {
      const response = await axios.get('https://graph.instagram.com/access_token', {
        params: {
          grant_type: 'ig_exchange_token',
          client_secret: this.clientSecret,
          access_token: shortLivedToken
        }
      });

      return response.data; // { access_token, token_type, expires_in }
    } catch (error) {
      console.error('Instagram long-lived token exchange failed:', error.response?.data);
      throw new Error('Failed to get long-lived Instagram token');
    }
  }

  /**
   * Refresh long-lived token (extends expiration by 60 days)
   * @param {string} accessToken - Current access token
   * @returns {Promise<Object>} Refreshed token response
   */
  async refreshToken(accessToken) {
    try {
      const response = await axios.get('https://graph.instagram.com/refresh_access_token', {
        params: {
          grant_type: 'ig_refresh_token',
          access_token: accessToken
        }
      });

      return response.data; // { access_token, token_type, expires_in }
    } catch (error) {
      console.error('Instagram token refresh failed:', error.response?.data);
      throw new Error('Failed to refresh Instagram token');
    }
  }

  /**
   * Get user profile data
   * @param {string} accessToken - Instagram access token
   * @returns {Promise<Object>} User profile data
   */
  async getUserProfile(accessToken) {
    try {
      const response = await axios.get('https://graph.instagram.com/me', {
        params: {
          fields: 'id,username,account_type,media_count',
          access_token: accessToken
        }
      });

      return response.data;
    } catch (error) {
      console.error('Instagram profile fetch failed:', error.response?.data);
      throw new Error('Failed to fetch Instagram profile');
    }
  }
}
```

**File:** `/apps/api/src/routes/auth/instagram.js`

```javascript
import express from 'express';
import { InstagramAuthService } from '../../services/instagram/InstagramAuthService.js';
import { requireAuth } from '../../middleware/auth.js';
import { db } from '../../db.js';

const router = express.Router();
const instagramAuth = new InstagramAuthService();

/**
 * GET /api/auth/instagram/connect
 * Initiate Instagram OAuth flow
 */
router.get('/connect', requireAuth, (req, res) => {
  const authUrl = instagramAuth.getAuthorizationUrl(req.userId);
  res.json({ url: authUrl });
});

/**
 * GET /api/auth/instagram/callback
 * Handle Instagram OAuth callback
 */
router.get('/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    
    if (!code || !state) {
      return res.redirect('/dashboard?error=instagram_auth_failed');
    }

    // Decode state to get userId
    const { userId } = JSON.parse(Buffer.from(state, 'base64').toString());

    // Exchange code for short-lived token
    const shortLivedToken = await instagramAuth.exchangeCodeForToken(code);
    
    // Exchange for long-lived token (60 days)
    const longLivedToken = await instagramAuth.getLongLivedToken(shortLivedToken.access_token);
    
    // Get user profile
    const profile = await instagramAuth.getUserProfile(longLivedToken.access_token);

    // Save to database
    const expiresAt = new Date(Date.now() + longLivedToken.expires_in * 1000);
    
    await db.socialAccountConnection.upsert({
      where: {
        creatorId_platform: {
          creatorId: userId,
          platform: 'instagram'
        }
      },
      create: {
        id: `instagram_${userId}_${Date.now()}`,
        creatorId: userId,
        platform: 'instagram',
        handle: profile.username,
        connected: true,
        accessToken: longLivedToken.access_token,
        expiresAt,
        metadata: {
          accountType: profile.account_type,
          externalId: profile.id
        }
      },
      update: {
        connected: true,
        accessToken: longLivedToken.access_token,
        expiresAt,
        handle: profile.username,
        metadata: {
          accountType: profile.account_type,
          externalId: profile.id
        }
      }
    });

    // Trigger initial sync (background job)
    // await syncInstagramData(userId);

    res.redirect('/dashboard?success=instagram_connected');
  } catch (error) {
    console.error('Instagram callback error:', error);
    res.redirect('/dashboard?error=instagram_auth_failed');
  }
});

/**
 * DELETE /api/auth/instagram/disconnect
 * Disconnect Instagram account
 */
router.delete('/disconnect', requireAuth, async (req, res) => {
  try {
    await db.socialAccountConnection.update({
      where: {
        creatorId_platform: {
          creatorId: req.userId,
          platform: 'instagram'
        }
      },
      data: {
        connected: false,
        accessToken: null,
        refreshToken: null,
        expiresAt: null
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Instagram disconnect error:', error);
    res.status(500).json({ error: 'Failed to disconnect Instagram' });
  }
});

export default router;
```

### 1.3 Data Sync Service (Days 4-7)

**File:** `/apps/api/src/services/instagram/InstagramSyncService.js`

```javascript
import axios from 'axios';
import { db } from '../../db.js';

export class InstagramSyncService {
  /**
   * Sync Instagram profile data
   * @param {string} connectionId - SocialAccountConnection ID
   */
  async syncProfile(connectionId) {
    const startedAt = new Date();
    
    try {
      // Get connection
      const connection = await db.socialAccountConnection.findUnique({
        where: { id: connectionId }
      });

      if (!connection || !connection.connected) {
        throw new Error('Instagram connection not found or not connected');
      }

      // Fetch profile from Instagram API
      const profile = await this.fetchProfile(connection.accessToken);

      // Upsert profile
      await db.socialProfile.upsert({
        where: { connectionId },
        create: {
          id: `profile_${connectionId}`,
          connectionId,
          platform: 'instagram',
          handle: profile.username,
          displayName: profile.name,
          bio: profile.biography,
          profileImageUrl: profile.profile_picture_url,
          followerCount: profile.followers_count,
          followingCount: profile.follows_count,
          postCount: profile.media_count,
          isVerified: profile.is_verified,
          externalId: profile.id,
          lastSyncedAt: new Date()
        },
        update: {
          handle: profile.username,
          displayName: profile.name,
          bio: profile.biography,
          profileImageUrl: profile.profile_picture_url,
          followerCount: profile.followers_count,
          followingCount: profile.follows_count,
          postCount: profile.media_count,
          isVerified: profile.is_verified,
          lastSyncedAt: new Date()
        }
      });

      // Save historical metric snapshot
      await db.socialMetric.create({
        data: {
          id: `metric_${connectionId}_${Date.now()}`,
          profileId: `profile_${connectionId}`,
          platform: 'instagram',
          metricType: 'follower_count',
          value: profile.followers_count,
          snapshotDate: new Date()
        }
      });

      // Log success
      await this.logSync(connectionId, 'profile', 'success', 1, startedAt);

      return profile;
    } catch (error) {
      console.error('Instagram profile sync failed:', error);
      await this.logSync(connectionId, 'profile', 'failed', 0, startedAt, error.message);
      throw error;
    }
  }

  /**
   * Sync Instagram posts
   * @param {string} connectionId - SocialAccountConnection ID
   * @param {number} limit - Max posts to fetch (default 25)
   */
  async syncPosts(connectionId, limit = 25) {
    const startedAt = new Date();
    
    try {
      const connection = await db.socialAccountConnection.findUnique({
        where: { id: connectionId }
      });

      if (!connection || !connection.connected) {
        throw new Error('Instagram connection not found');
      }

      // Fetch recent posts from Instagram API
      const posts = await this.fetchPosts(connection.accessToken, limit);

      let synced = 0;

      for (const post of posts) {
        // Fetch detailed insights for each post
        const insights = await this.fetchPostInsights(connection.accessToken, post.id);

        await db.socialPost.upsert({
          where: {
            platform_externalId: {
              platform: 'instagram',
              externalId: post.id
            }
          },
          create: {
            id: `post_${post.id}`,
            profileId: `profile_${connectionId}`,
            platform: 'instagram',
            externalId: post.id,
            caption: post.caption,
            mediaType: post.media_type.toLowerCase(),
            mediaUrl: post.media_url,
            thumbnailUrl: post.thumbnail_url,
            permalink: post.permalink,
            likeCount: insights.like_count || 0,
            commentCount: insights.comments_count || 0,
            saveCount: insights.saved || 0,
            viewCount: post.media_type === 'VIDEO' ? insights.video_views : insights.impressions,
            engagementRate: this.calculateEngagementRate(insights),
            postedAt: new Date(post.timestamp),
            lastSyncedAt: new Date()
          },
          update: {
            likeCount: insights.like_count || 0,
            commentCount: insights.comments_count || 0,
            saveCount: insights.saved || 0,
            viewCount: post.media_type === 'VIDEO' ? insights.video_views : insights.impressions,
            engagementRate: this.calculateEngagementRate(insights),
            lastSyncedAt: new Date()
          }
        });

        synced++;
      }

      await this.logSync(connectionId, 'posts', 'success', synced, startedAt);

      return { synced, total: posts.length };
    } catch (error) {
      console.error('Instagram posts sync failed:', error);
      await this.logSync(connectionId, 'posts', 'failed', 0, startedAt, error.message);
      throw error;
    }
  }

  /**
   * Fetch profile from Instagram Graph API
   */
  async fetchProfile(accessToken) {
    try {
      const response = await axios.get('https://graph.instagram.com/me', {
        params: {
          fields: 'id,username,name,biography,profile_picture_url,followers_count,follows_count,media_count,is_verified',
          access_token: accessToken
        }
      });

      return response.data;
    } catch (error) {
      if (error.response?.status === 429) {
        throw new Error('RATE_LIMIT_HIT');
      }
      throw error;
    }
  }

  /**
   * Fetch posts from Instagram Graph API
   */
  async fetchPosts(accessToken, limit = 25) {
    try {
      const response = await axios.get('https://graph.instagram.com/me/media', {
        params: {
          fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp',
          limit,
          access_token: accessToken
        }
      });

      return response.data.data || [];
    } catch (error) {
      if (error.response?.status === 429) {
        throw new Error('RATE_LIMIT_HIT');
      }
      throw error;
    }
  }

  /**
   * Fetch post insights (engagement metrics)
   */
  async fetchPostInsights(accessToken, postId) {
    try {
      const response = await axios.get(`https://graph.instagram.com/${postId}/insights`, {
        params: {
          metric: 'impressions,reach,engagement,saved,video_views,likes,comments',
          access_token: accessToken
        }
      });

      // Convert array of metrics to object
      const insights = {};
      response.data.data.forEach(metric => {
        insights[metric.name] = metric.values[0].value;
      });

      return insights;
    } catch (error) {
      // Some posts may not have insights available
      console.warn('Instagram insights not available for post:', postId);
      return {};
    }
  }

  /**
   * Calculate engagement rate
   */
  calculateEngagementRate(insights) {
    const engagement = (insights.likes || 0) + (insights.comments || 0) + (insights.saved || 0);
    const reach = insights.reach || insights.impressions || 1;
    return (engagement / reach) * 100;
  }

  /**
   * Log sync operation
   */
  async logSync(connectionId, syncType, status, itemsSynced, startedAt, errorMessage = null) {
    const completedAt = new Date();
    const duration = completedAt - startedAt;

    await db.socialSyncLog.create({
      data: {
        id: `log_${connectionId}_${Date.now()}`,
        connectionId,
        platform: 'instagram',
        syncType,
        status,
        itemsSynced,
        errorMessage,
        errorCode: errorMessage === 'RATE_LIMIT_HIT' ? 'RATE_LIMIT' : null,
        rateLimitHit: errorMessage === 'RATE_LIMIT_HIT',
        startedAt,
        completedAt,
        duration
      }
    });
  }
}
```

### 1.4 Frontend Integration (Days 8-10)

**File:** `/apps/web/src/components/ConnectInstagramButton.jsx`

```jsx
import { useState } from 'react';
import { toast } from 'sonner';

export function ConnectInstagramButton({ onConnect }) {
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/instagram/connect', {
        credentials: 'include'
      });
      const data = await response.json();
      
      // Open OAuth popup
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      const popup = window.open(
        data.url,
        'Instagram Connect',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Listen for callback completion
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          setLoading(false);
          onConnect?.();
          toast.success('Instagram connected successfully!');
        }
      }, 500);
    } catch (error) {
      console.error('Instagram connect failed:', error);
      toast.error('Failed to connect Instagram');
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleConnect}
      disabled={loading}
      className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
    >
      {loading ? (
        <>
          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Connecting...
        </>
      ) : (
        <>
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
          Connect Instagram
        </>
      )}
    </button>
  );
}
```

### 1.5 Cron Job (Day 11)

**File:** `/apps/api/src/jobs/syncSocialAnalytics.js`

```javascript
import { db } from '../db.js';
import { InstagramSyncService } from '../services/instagram/InstagramSyncService.js';

const instagramSync = new InstagramSyncService();

/**
 * Daily job to sync all connected Instagram accounts
 */
export async function syncAllInstagramAccounts() {
  console.log('[CRON] Starting Instagram sync job...');

  try {
    // Get all connected Instagram accounts
    const connections = await db.socialAccountConnection.findMany({
      where: {
        platform: 'instagram',
        connected: true
      }
    });

    console.log(`[CRON] Found ${connections.length} Instagram accounts to sync`);

    for (const connection of connections) {
      try {
        // Check if token needs refresh (within 7 days of expiration)
        if (connection.expiresAt && connection.expiresAt < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) {
          console.log(`[CRON] Refreshing token for ${connection.handle}`);
          // Token refresh logic here
        }

        // Sync profile
        await instagramSync.syncProfile(connection.id);
        console.log(`[CRON] Synced profile for ${connection.handle}`);

        // Sync posts
        await instagramSync.syncPosts(connection.id, 10); // Last 10 posts
        console.log(`[CRON] Synced posts for ${connection.handle}`);

        // Wait 2 seconds between accounts (rate limit protection)
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`[CRON] Failed to sync ${connection.handle}:`, error.message);
        // Continue with next account
      }
    }

    console.log('[CRON] Instagram sync job complete');
  } catch (error) {
    console.error('[CRON] Instagram sync job failed:', error);
  }
}

// Run daily at 3 AM
// cron.schedule('0 3 * * *', syncAllInstagramAccounts);
```

---

## 📱 Phase 2: TikTok API (Weeks 4-6)

### 2.1 App Registration

1. Go to [TikTok for Developers](https://developers.tiktok.com/)
2. Create new app → "Login Kit" + "Display API"
3. Configure OAuth redirect:
   - `https://yourdomain.com/api/auth/tiktok/callback`

**Environment Variables:**

```bash
TIKTOK_CLIENT_KEY=your_client_key
TIKTOK_CLIENT_SECRET=your_client_secret
TIKTOK_REDIRECT_URI=https://yourdomain.com/api/auth/tiktok/callback
```

### 2.2 Implementation Files

Similar structure to Instagram:
- `TikTokAuthService.js` - OAuth flow
- `TikTokSyncService.js` - Data sync
- `/api/auth/tiktok/*` routes
- `ConnectTikTokButton.jsx` component

**Key Differences:**
- TikTok uses "open_id" instead of user_id
- Scopes: `user.info.basic`, `video.list`
- Rate limit: 1000 requests/day per app
- Token expiry: 24 hours (needs daily refresh)

---

## 🎥 Phase 3: YouTube Data API (Weeks 7-9)

### 3.1 App Registration

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project
3. Enable "YouTube Data API v3"
4. Create OAuth 2.0 credentials
5. Configure redirect URIs

**Environment Variables:**

```bash
YOUTUBE_CLIENT_ID=your_client_id
YOUTUBE_CLIENT_SECRET=your_client_secret
YOUTUBE_REDIRECT_URI=https://yourdomain.com/api/auth/youtube/callback
```

### 3.2 Implementation Files

Similar structure:
- `YouTubeAuthService.js`
- `YouTubeSyncService.js`
- `/api/auth/youtube/*` routes
- `ConnectYouTubeButton.jsx` component

**Key Differences:**
- YouTube uses Google OAuth (similar to Gmail)
- Scopes: `youtube.readonly`
- Rate limit: 10,000 quota units/day
- Token expiry: 1 hour (auto-refresh with refresh_token)

---

## 🔄 Phase 4: UI Integration & Testing (Weeks 10-12)

### 4.1 Update ExclusiveTalentDashboard

**File:** `/apps/web/src/pages/ExclusiveTalentDashboard.jsx`

Replace social platforms section with:

```jsx
import { DataState } from '../components/DataState';
import { ConnectInstagramButton } from '../components/ConnectInstagramButton';
import { ConnectTikTokButton } from '../components/ConnectTikTokButton';
import { ConnectYouTubeButton } from '../components/ConnectYouTubeButton';

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
      setConnections(data.connections || []);
    } catch (error) {
      console.error('Failed to fetch connections:', error);
    } finally {
      setLoading(false);
    }
  }

  const instagramConnected = connections.find(c => c.platform === 'instagram' && c.connected);
  const tiktokConnected = connections.find(c => c.platform === 'tiktok' && c.connected);
  const youtubeConnected = connections.find(c => c.platform === 'youtube' && c.connected);

  if (loading) {
    return <DataState state="loading" resource="social connections" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Social Accounts</h3>
        <span className="text-sm text-brand-black/50">
          {connections.filter(c => c.connected).length} connected
        </span>
      </div>

      <div className="grid gap-3">
        {/* Instagram */}
        <div className="flex items-center justify-between rounded-xl border border-brand-black/10 bg-brand-white p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-gradient-to-r from-purple-600 to-pink-600 p-2">
              {/* Instagram icon */}
            </div>
            <div>
              <p className="font-medium">Instagram</p>
              {instagramConnected && (
                <p className="text-sm text-brand-black/50">@{instagramConnected.handle}</p>
              )}
            </div>
          </div>
          {instagramConnected ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-green-600">● Connected</span>
              <button className="text-sm text-brand-red">Disconnect</button>
            </div>
          ) : (
            <ConnectInstagramButton onConnect={fetchConnections} />
          )}
        </div>

        {/* TikTok */}
        <div className="flex items-center justify-between rounded-xl border border-brand-black/10 bg-brand-white p-4">
          {/* Similar structure */}
        </div>

        {/* YouTube */}
        <div className="flex items-center justify-between rounded-xl border border-brand-black/10 bg-brand-white p-4">
          {/* Similar structure */}
        </div>
      </div>

      {connections.length === 0 && (
        <DataState
          state="no-data"
          resource="social accounts"
          message="Connect your social media accounts to track performance and analytics."
          variant="compact"
        />
      )}
    </div>
  );
}
```

### 4.2 Aggregated Analytics Endpoint

**File:** `/apps/api/src/routes/analytics/socials.js`

```javascript
import express from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { db } from '../../db.js';
import { apiResponse, emptyResponse, syncingResponse } from '../../utils/apiTruthLayer.js';

const router = express.Router();

/**
 * GET /api/analytics/socials
 * Get aggregated social analytics across all platforms
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    // Get user's social connections
    const connections = await db.socialAccountConnection.findMany({
      where: {
        creatorId: req.userId,
        connected: true
      },
      include: {
        SocialProfile: {
          include: {
            posts: {
              orderBy: { postedAt: 'desc' },
              take: 10
            }
          }
        }
      }
    });

    if (connections.length === 0) {
      return req.emptyResponse('social accounts', 'no-data', {
        action: {
          label: 'Connect Account',
          endpoint: 'GET /api/auth/instagram/connect'
        }
      });
    }

    // Check if any account is currently syncing
    const recentSync = await db.socialSyncLog.findFirst({
      where: {
        connectionId: { in: connections.map(c => c.id) },
        status: 'in_progress',
        startedAt: { gte: new Date(Date.now() - 5 * 60 * 1000) } // Last 5 minutes
      }
    });

    if (recentSync) {
      return req.syncingResponse('social analytics', {
        lastSync: connections[0].lastSyncedAt,
        estimatedCompletion: '1-2 minutes'
      });
    }

    // Aggregate data
    const analytics = {
      totalFollowers: connections.reduce((sum, c) => sum + (c.SocialProfile?.followerCount || 0), 0),
      totalPosts: connections.reduce((sum, c) => sum + (c.SocialProfile?.postCount || 0), 0),
      platforms: connections.map(c => ({
        platform: c.platform,
        handle: c.handle,
        followers: c.SocialProfile?.followerCount || 0,
        posts: c.SocialProfile?.postCount || 0,
        engagementRate: c.SocialProfile?.engagementRate || 0,
        lastSynced: c.lastSyncedAt
      })),
      recentPosts: connections
        .flatMap(c => c.SocialProfile?.posts || [])
        .sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt))
        .slice(0, 10)
    };

    return req.apiResponse(analytics, {
      source: 'database',
      syncStatus: {
        lastSync: connections[0].lastSyncedAt,
        nextSync: new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
      }
    });
  } catch (error) {
    console.error('Social analytics fetch failed:', error);
    return req.errorResponse('Failed to load social analytics', {
      code: 'FETCH_FAILED'
    });
  }
});

export default router;
```

### 4.3 Testing Checklist

**Manual Testing:**
- [ ] Instagram OAuth flow completes successfully
- [ ] Token is saved to database correctly
- [ ] Profile data syncs and displays in UI
- [ ] Posts sync with accurate metrics
- [ ] Disconnect works and clears tokens
- [ ] Error states show user-friendly messages
- [ ] Rate limit handling prevents API abuse
- [ ] Token refresh runs automatically
- [ ] Repeat for TikTok and YouTube

**Automated Tests:**
```javascript
// apps/api/tests/instagram.test.js
describe('Instagram Integration', () => {
  it('should generate valid OAuth URL', () => {
    // Test authorization URL generation
  });

  it('should exchange code for token', async () => {
    // Mock Instagram API response
    // Test token exchange
  });

  it('should sync profile data', async () => {
    // Mock profile API response
    // Test profile sync
  });

  it('should handle rate limits gracefully', async () => {
    // Mock 429 response
    // Test rate limit handling
  });
});
```

---

## 📈 Success Metrics

### Phase 1 Complete (Instagram) When:
- ✅ OAuth flow works end-to-end
- ✅ Profile + posts sync daily
- ✅ Data displays in dashboard
- ✅ Rate limits respected
- ✅ Errors logged and handled
- ✅ Token refresh works automatically

### Phase 2 Complete (TikTok) When:
- ✅ Same criteria as Instagram

### Phase 3 Complete (YouTube) When:
- ✅ Same criteria as Instagram

### Production Ready When:
- ✅ All 3 platforms integrated
- ✅ 95%+ uptime on syncs
- ✅ <5 second dashboard load time
- ✅ Zero ToS violations
- ✅ Full error monitoring (Sentry)
- ✅ Admin dashboard shows sync health

---

## 🚨 Rate Limits & Quotas

### Instagram Graph API
- **Profile requests:** 200/hour per user
- **Media requests:** 200/hour per user
- **Insights:** 200/hour per user
- **Strategy:** Sync once daily, cache aggressively

### TikTok API
- **User info:** 1000 requests/day per app
- **Video list:** 1000 requests/day per app
- **Strategy:** Sync once daily, limit to 10-20 videos per user

### YouTube Data API v3
- **Quota:** 10,000 units/day
- **Channel details:** 1 unit
- **Video list:** 1 unit per request
- **Video details:** 1 unit per video
- **Strategy:** Batch video requests, sync once daily

### Rate Limit Handling

```javascript
// apps/api/src/services/RateLimitManager.js
export class RateLimitManager {
  constructor() {
    this.limits = new Map(); // connectionId -> { count, resetAt }
  }

  async checkLimit(connectionId, platform) {
    const limit = this.limits.get(connectionId);
    const now = Date.now();

    if (limit && limit.resetAt > now) {
      if (limit.count >= this.getMaxRequests(platform)) {
        const waitMs = limit.resetAt - now;
        throw new Error(`RATE_LIMIT_HIT:${Math.ceil(waitMs / 1000)}s`);
      }
      limit.count++;
    } else {
      this.limits.set(connectionId, {
        count: 1,
        resetAt: now + this.getResetInterval(platform)
      });
    }
  }

  getMaxRequests(platform) {
    return {
      instagram: 200,
      tiktok: 100,
      youtube: 100
    }[platform] || 100;
  }

  getResetInterval(platform) {
    return 60 * 60 * 1000; // 1 hour
  }
}
```

---

## 🔒 Security Considerations

### Token Storage
- ✅ Encrypt tokens at rest (use Prisma encryption or AWS KMS)
- ✅ Never expose tokens in API responses
- ✅ Rotate tokens regularly (use refresh tokens)
- ✅ Revoke tokens on disconnect

### OAuth Security
- ✅ Use state parameter to prevent CSRF
- ✅ Validate redirect URI on callback
- ✅ HTTPS only in production
- ✅ Short-lived authorization codes

### Data Privacy
- ✅ Only request necessary scopes
- ✅ Respect user's data deletion requests
- ✅ Implement webhook for deauthorization
- ✅ Clear data on account disconnect

---

## 📚 Resources

### Official Documentation
- [Instagram Graph API](https://developers.facebook.com/docs/instagram-api)
- [TikTok for Developers](https://developers.tiktok.com/doc/overview)
- [YouTube Data API v3](https://developers.google.com/youtube/v3)

### Rate Limits
- [Instagram Rate Limits](https://developers.facebook.com/docs/graph-api/overview/rate-limiting)
- [TikTok Rate Limits](https://developers.tiktok.com/doc/rate-limits)
- [YouTube Quota Calculator](https://developers.google.com/youtube/v3/determine_quota_cost)

### OAuth 2.0
- [OAuth 2.0 Simplified](https://www.oauth.com/)
- [Instagram OAuth Guide](https://developers.facebook.com/docs/instagram-basic-display-api/getting-started)

---

## 🎯 Next Steps

**Immediate (Today):**
1. Create developer accounts on Meta/TikTok/Google
2. Register apps and get API credentials
3. Add environment variables to `.env`
4. Run database migration for new models

**Week 1:**
1. Implement Instagram OAuth flow
2. Test end-to-end connection
3. Implement profile sync service
4. Test with real Instagram account

**Week 2-3:**
1. Implement Instagram posts sync
2. Build UI components
3. Add cron jobs
4. Complete testing

**Week 4-6:**
1. Repeat for TikTok

**Week 7-9:**
1. Repeat for YouTube

**Week 10-12:**
1. UI polish and testing
2. Error monitoring setup
3. Performance optimization
4. Production deployment

---

## ✅ Definition of Done

This implementation is complete when:

- [ ] All 3 platforms (Instagram, TikTok, YouTube) have working OAuth
- [ ] Profile data syncs daily and displays correctly
- [ ] Post/video data syncs with engagement metrics
- [ ] Rate limits are respected with proper error handling
- [ ] Token refresh runs automatically
- [ ] Users can connect/disconnect accounts easily
- [ ] Dashboard shows real-time sync status
- [ ] Error monitoring tracks all failures
- [ ] Admin dashboard shows sync health for all users
- [ ] Zero Terms of Service violations
- [ ] Production deployment successful
- [ ] Documentation complete for future maintenance

---

**Ready to begin Phase 1? Start with Instagram app registration and we'll build from there. This is the proper, legal, sustainable approach to social analytics.**
