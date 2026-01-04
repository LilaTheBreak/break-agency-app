import { Router, Request, Response } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import prisma from '../../lib/prisma.js';

const router = Router();

// Environment validation
const isConfigured = Boolean(
  process.env.INSTAGRAM_CLIENT_ID || 
  process.env.TIKTOK_CLIENT_KEY
);

if (!isConfigured) {
  console.warn('⚠️  Social analytics requires at least one social provider configured');
}

/**
 * GET /api/analytics/socials/connections
 * Get all social account connections for current user
 */
router.get('/connections', requireAuth, async (req: Request, res: Response) => {
  const enabled = process.env.SOCIAL_ANALYTICS_ENABLED === "true";
  if (!enabled) {
    return res.status(503).json({
      success: false,
      error: "Social analytics is disabled",
      code: "FEATURE_DISABLED"
    });
  }

  try {
    const userId = (req as any).user?.id || (req as any).userId;
    
    const connections = await prisma.socialAccountConnection.findMany({
      where: {
        creatorId: userId
      },
      select: {
        id: true,
        platform: true,
        handle: true,
        connected: true,
        lastSyncedAt: true,
        expiresAt: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({ 
      success: true,
      connections: connections.map(c => ({
        id: c.id,
        platform: c.platform,
        handle: c.handle,
        connected: c.connected,
        lastSynced: c.lastSyncedAt,
        expiresAt: c.expiresAt
      }))
    });
  } catch (error: any) {
    console.error('Failed to fetch connections:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to load social connections',
      message: error.message
    });
  }
});

/**
 * GET /api/analytics/socials
 * Get aggregated social analytics across all platforms
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  const enabled = process.env.SOCIAL_ANALYTICS_ENABLED === "true";
  if (!enabled) {
    return res.status(503).json({
      success: false,
      error: "Social analytics is disabled",
      message: "This feature is currently disabled. Contact an administrator to enable it.",
      code: "FEATURE_DISABLED"
    });
  }

  try {
    const userId = (req as any).user?.id || (req as any).userId;
    
    const connections = await prisma.socialAccountConnection.findMany({
      where: {
        creatorId: userId,
        connected: true
      },
      include: {
        SocialProfile: {
          include: {
            posts: {
              orderBy: { postedAt: 'desc' },
              take: 5
            }
          }
        }
      }
    });

    if (connections.length === 0) {
      return res.json({
        success: true,
        data: {
          totalFollowers: 0,
          totalPosts: 0,
          totalEngagement: 0,
          platforms: [],
          recentPosts: []
        },
        meta: {
          message: 'No social accounts connected',
          action: {
            label: 'Connect Account',
            endpoint: '/api/auth/instagram/connect'
          }
        }
      });
    }

    // Aggregate metrics from all profiles
    let totalFollowers = 0;
    let totalPosts = 0;
    let totalEngagement = 0;
    const platforms: any[] = [];
    const recentPosts: any[] = [];

    for (const connection of connections) {
      if (connection.SocialProfile) {
        const profile = connection.SocialProfile;
        totalFollowers += profile.followerCount || 0;
        totalPosts += profile.postCount || 0;
        
        // Calculate total engagement from recent posts
        const postEngagement = (profile.posts || []).reduce((sum, post) => {
          return sum + (post.likeCount || 0) + (post.commentCount || 0) + (post.shareCount || 0);
        }, 0);
        totalEngagement += postEngagement;

        platforms.push({
          platform: profile.platform,
          handle: profile.handle,
          displayName: profile.displayName,
          followerCount: profile.followerCount,
          postCount: profile.postCount,
          engagementRate: profile.engagementRate,
          isVerified: profile.isVerified,
          profileImageUrl: profile.profileImageUrl,
          lastSynced: profile.lastSyncedAt
        });

        // Add recent posts
        (profile.posts || []).forEach(post => {
          recentPosts.push({
            id: post.id,
            platform: post.platform,
            caption: post.caption,
            mediaUrl: post.mediaUrl,
            thumbnailUrl: post.thumbnailUrl,
            viewCount: post.viewCount,
            likeCount: post.likeCount,
            commentCount: post.commentCount,
            shareCount: post.shareCount,
            engagementRate: post.engagementRate,
            postedAt: post.postedAt,
            permalink: post.permalink
          });
        });
      }
    }

    // Sort recent posts by postedAt
    recentPosts.sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
    recentPosts.splice(10); // Keep top 10

    res.json({
      success: true,
      data: {
        totalFollowers,
        totalPosts,
        totalEngagement,
        platforms,
        recentPosts
      },
      meta: {
        source: 'database',
        lastSync: connections[0]?.lastSyncedAt,
        totalConnections: connections.length
      }
    });
  } catch (error: any) {
    console.error('Social analytics fetch failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load social analytics',
      message: error.message
    });
  }
});

/**
 * GET /api/analytics/socials/:platform
 * Get analytics for specific platform
 */
router.get('/:platform', requireAuth, async (req: Request, res: Response) => {
  const enabled = process.env.SOCIAL_ANALYTICS_ENABLED === "true";
  if (!enabled) {
    return res.status(503).json({
      success: false,
      error: "Social analytics is disabled",
      message: "This feature is currently disabled. Contact an administrator to enable it.",
      code: "FEATURE_DISABLED"
    });
  }

  try {
    const userId = (req as any).user?.id || (req as any).userId;
    const { platform } = req.params;
    
    const connection = await prisma.socialAccountConnection.findFirst({
      where: {
        creatorId: userId,
        platform: platform.toLowerCase(),
        connected: true
      },
      include: {
        SocialProfile: {
          include: {
            posts: {
              orderBy: { postedAt: 'desc' },
              take: 20
            },
            metrics: {
              orderBy: { snapshotDate: 'desc' },
              take: 30
            }
          }
        }
      }
    });

    if (!connection) {
      return res.status(404).json({
        success: false,
        error: `No ${platform} account connected`,
        meta: {
          action: {
            label: `Connect ${platform.charAt(0).toUpperCase() + platform.slice(1)}`,
            endpoint: `/api/auth/${platform}/connect`
          }
        }
      });
    }

    const profile = connection.SocialProfile;
    if (!profile) {
      return res.json({
        success: true,
        data: {
          platform: connection.platform,
          handle: connection.handle,
          connected: connection.connected,
          lastSynced: connection.lastSyncedAt,
          message: "Profile data not yet synced"
        }
      });
    }

    // Calculate engagement metrics from posts
    const posts = profile.posts || [];
    const totalViews = posts.reduce((sum, p) => sum + (p.viewCount || 0), 0);
    const totalLikes = posts.reduce((sum, p) => sum + (p.likeCount || 0), 0);
    const totalComments = posts.reduce((sum, p) => sum + (p.commentCount || 0), 0);
    const totalShares = posts.reduce((sum, p) => sum + (p.shareCount || 0), 0);
    const avgEngagementRate = posts.length > 0
      ? posts.reduce((sum, p) => sum + (p.engagementRate || 0), 0) / posts.length
      : 0;

    res.json({
      success: true,
      data: {
        platform: profile.platform,
        handle: profile.handle,
        displayName: profile.displayName,
        bio: profile.bio,
        profileImageUrl: profile.profileImageUrl,
        followerCount: profile.followerCount,
        followingCount: profile.followingCount,
        postCount: profile.postCount,
        isVerified: profile.isVerified,
        engagementRate: profile.engagementRate,
        averageViews: profile.averageViews,
        averageEngagement: profile.averageEngagement,
        metrics: {
          totalViews,
          totalLikes,
          totalComments,
          totalShares,
          avgEngagementRate
        },
        posts: posts.map(p => ({
          id: p.id,
          caption: p.caption,
          mediaType: p.mediaType,
          mediaUrl: p.mediaUrl,
          thumbnailUrl: p.thumbnailUrl,
          viewCount: p.viewCount,
          likeCount: p.likeCount,
          commentCount: p.commentCount,
          shareCount: p.shareCount,
          engagementRate: p.engagementRate,
          postedAt: p.postedAt,
          permalink: p.permalink
        })),
        timeSeriesMetrics: profile.metrics?.map(m => ({
          metricType: m.metricType,
          value: m.value,
          snapshotDate: m.snapshotDate,
          metadata: m.metadata
        })) || [],
        lastSynced: profile.lastSyncedAt
      },
      meta: {
        source: 'database',
        lastSync: connection.lastSyncedAt,
        postsCount: posts.length,
        metricsCount: profile.metrics?.length || 0
      }
    });
  } catch (error: any) {
    console.error(`${req.params.platform} analytics fetch failed:`, error);
    res.status(500).json({
      success: false,
      error: `Failed to load ${req.params.platform} analytics`,
      message: error.message
    });
  }
});

/**
 * GET /api/analytics/socials/:platform/metrics
 * Get time-series metrics for a platform
 */
router.get('/:platform/metrics', requireAuth, async (req: Request, res: Response) => {
  const enabled = process.env.SOCIAL_ANALYTICS_ENABLED === "true";
  if (!enabled) {
    return res.status(503).json({
      success: false,
      error: "Social analytics is disabled",
      code: "FEATURE_DISABLED"
    });
  }

  try {
    const userId = (req as any).user?.id || (req as any).userId;
    const { platform } = req.params;
    const { metricType, days = 30 } = req.query;

    const connection = await prisma.socialAccountConnection.findFirst({
      where: {
        creatorId: userId,
        platform: platform.toLowerCase(),
        connected: true
      },
      include: {
        SocialProfile: {
          include: {
            metrics: {
              where: {
                ...(metricType ? { metricType: metricType as string } : {}),
                snapshotDate: {
                  gte: new Date(Date.now() - parseInt(days as string) * 24 * 60 * 60 * 1000)
                }
              },
              orderBy: { snapshotDate: 'asc' }
            }
          }
        }
      }
    });

    if (!connection?.SocialProfile) {
      return res.status(404).json({
        success: false,
        error: `No ${platform} profile found`
      });
    }

    res.json({
      success: true,
      data: {
        platform: platform.toLowerCase(),
        metrics: connection.SocialProfile.metrics.map(m => ({
          metricType: m.metricType,
          value: m.value,
          snapshotDate: m.snapshotDate,
          metadata: m.metadata
        }))
      },
      meta: {
        days: parseInt(days as string),
        metricType: metricType || 'all',
        count: connection.SocialProfile.metrics.length
      }
    });
  } catch (error: any) {
    console.error(`Time-series metrics fetch failed:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to load time-series metrics',
      message: error.message
    });
  }
});

export default router;
