import express from 'express';
import { requireAuth } from '../../middleware/auth.js';
import prisma from "../../lib/prisma.js";
import { apiResponse, emptyResponse, syncingResponse, withTruthLayer } from '../../utils/apiTruthLayer.js';

const router = express.Router();

/**
 * GET /api/analytics/socials/connections
 * Get all social account connections for current user
 */
router.get('/connections', requireAuth, withTruthLayer(async (req, res) => {
  try {
    const connections = await prisma.socialAccountConnection.findMany({
      where: {
        creatorId: req.userId
      },
      include: {
        SocialProfile: {
          select: {
            followerCount: true,
            postCount: true,
            lastSyncedAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const connectionsData = connections.map(c => ({
      id: c.id,
      platform: c.platform,
      handle: c.handle,
      connected: c.connected,
      followerCount: c.SocialProfile?.followerCount || 0,
      postCount: c.SocialProfile?.postCount || 0,
      lastSynced: c.lastSyncedAt,
      expiresAt: c.expiresAt
    }));

    return req.apiResponse({ connections: connectionsData });
  } catch (error) {
    console.error('Failed to fetch connections:', error);
    return req.errorResponse('Failed to load social connections');
  }
}));

/**
 * GET /api/analytics/socials
 * Get aggregated social analytics across all platforms
 */
router.get('/', requireAuth, withTruthLayer(async (req, res) => {
  try {
    // Get user's social connections
    const connections = await prisma.socialAccountConnection.findMany({
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
    const recentSync = await prisma.socialSyncLog.findFirst({
      where: {
        connectionId: { in: connections.map(c => c.id) },
        completedAt: null,
        startedAt: { gte: new Date(Date.now() - 10 * 60 * 1000) } // Last 10 minutes
      }
    });

    if (recentSync) {
      return req.syncingResponse('social analytics', {
        lastSync: connections[0].lastSyncedAt,
        estimatedCompletion: '1-2 minutes'
      });
    }

    // Aggregate data across platforms
    const analytics = {
      totalFollowers: connections.reduce((sum, c) => 
        sum + (c.SocialProfile?.followerCount || 0), 0
      ),
      totalPosts: connections.reduce((sum, c) => 
        sum + (c.SocialProfile?.postCount || 0), 0
      ),
      platforms: connections.map(c => ({
        platform: c.platform,
        handle: c.handle,
        followers: c.SocialProfile?.followerCount || 0,
        posts: c.SocialProfile?.postCount || 0,
        engagementRate: c.SocialProfile?.engagementRate || 0,
        lastSynced: c.lastSyncedAt,
        profileImage: c.SocialProfile?.profileImageUrl
      })),
      recentPosts: connections
        .flatMap(c => (c.SocialProfile?.posts || []).map(post => ({
          ...post,
          platform: c.platform,
          handle: c.handle
        })))
        .sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt))
        .slice(0, 10)
    };

    return req.apiResponse(analytics, {
      source: 'database',
      syncStatus: {
        lastSync: connections[0]?.lastSyncedAt,
        nextSync: new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
      }
    });
  } catch (error) {
    console.error('Social analytics fetch failed:', error);
    return req.errorResponse('Failed to load social analytics', {
      code: 'FETCH_FAILED'
    });
  }
}));

/**
 * GET /api/analytics/socials/:platform
 * Get analytics for specific platform
 */
router.get('/:platform', requireAuth, withTruthLayer(async (req, res) => {
  try {
    const { platform } = req.params;
    
    const connection = await prisma.socialAccountConnection.findFirst({
      where: {
        creatorId: req.userId,
        platform,
        connected: true
      },
      include: {
        SocialProfile: {
          include: {
            posts: {
              orderBy: { postedAt: 'desc' },
              take: 50
            },
            metrics: {
              orderBy: { snapshotDate: 'desc' },
              take: 30 // Last 30 days
            }
          }
        }
      }
    });

    if (!connection) {
      return req.emptyResponse(`${platform} account`, 'not-connected', {
        action: {
          label: `Connect ${platform.charAt(0).toUpperCase() + platform.slice(1)}`,
          endpoint: `GET /api/auth/${platform}/connect`
        }
      });
    }

    if (!connection.SocialProfile) {
      return req.syncingResponse(`${platform} data`, {
        message: 'Account connected, initial sync in progress'
      });
    }

    const data = {
      platform,
      handle: connection.handle,
      profile: {
        displayName: connection.SocialProfile.displayName,
        bio: connection.SocialProfile.bio,
        profileImageUrl: connection.SocialProfile.profileImageUrl,
        followerCount: connection.SocialProfile.followerCount,
        followingCount: connection.SocialProfile.followingCount,
        postCount: connection.SocialProfile.postCount,
        engagementRate: connection.SocialProfile.engagementRate,
        isVerified: connection.SocialProfile.isVerified
      },
      posts: connection.SocialProfile.posts,
      metrics: connection.SocialProfile.metrics,
      lastSynced: connection.lastSyncedAt
    };

    return req.apiResponse(data, {
      source: 'database',
      syncStatus: {
        lastSync: connection.lastSyncedAt,
        nextSync: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    });
  } catch (error) {
    console.error(`${req.params.platform} analytics fetch failed:`, error);
    return req.errorResponse(`Failed to load ${req.params.platform} analytics`);
  }
}));

export default router;
