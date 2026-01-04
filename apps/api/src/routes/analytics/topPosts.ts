import { Router, Request, Response } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import prisma from '../../lib/prisma.js';

const router = Router();

/**
 * GET /api/analytics/top-posts
 * Get top performing posts across all platforms
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
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
    const limit = parseInt(req.query.limit as string) || 5;

    // Get all connected social profiles for user
    const connections = await prisma.socialAccountConnection.findMany({
      where: {
        creatorId: userId,
        connected: true
      },
      include: {
        SocialProfile: {
          include: {
            posts: {
              where: {
                engagementRate: { not: null }
              },
              orderBy: { engagementRate: 'desc' },
              take: limit
            }
          }
        }
      }
    });

    // Collect all posts from all platforms
    const allPosts: any[] = [];
    connections.forEach(connection => {
      if (connection.SocialProfile?.posts) {
        connection.SocialProfile.posts.forEach(post => {
          allPosts.push({
            id: post.id,
            platform: post.platform,
            caption: post.caption,
            mediaType: post.mediaType,
            mediaUrl: post.mediaUrl,
            thumbnailUrl: post.thumbnailUrl,
            viewCount: post.viewCount,
            likeCount: post.likeCount,
            commentCount: post.commentCount,
            shareCount: post.shareCount,
            engagementRate: post.engagementRate,
            postedAt: post.postedAt,
            permalink: post.permalink,
            profileHandle: connection.SocialProfile?.handle
          });
        });
      }
    });

    // Sort by engagement rate and take top N
    allPosts.sort((a, b) => (b.engagementRate || 0) - (a.engagementRate || 0));
    const topPosts = allPosts.slice(0, limit);

    res.json({
      success: true,
      data: {
        posts: topPosts,
        total: topPosts.length
      },
      meta: {
        limit,
        platforms: [...new Set(topPosts.map(p => p.platform))]
      }
    });
  } catch (error: any) {
    console.error('Top posts fetch failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load top posts',
      message: error.message
    });
  }
});

export default router;

