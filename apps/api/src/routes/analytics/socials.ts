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
  try {
    const userId = (req as any).userId;
    
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
  try {
    const userId = (req as any).userId;
    
    const connections = await prisma.socialAccountConnection.findMany({
      where: {
        creatorId: userId,
        connected: true
      },
      select: {
        id: true,
        platform: true,
        handle: true,
        connected: true,
        lastSyncedAt: true
      }
    });

    if (connections.length === 0) {
      return res.json({
        success: true,
        data: {
          totalFollowers: 0,
          totalPosts: 0,
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

    // Return basic connection info
    // Full analytics implementation requires additional schema
    res.json({
      success: true,
      data: {
        totalConnections: connections.length,
        platforms: connections.map(c => ({
          platform: c.platform,
          handle: c.handle,
          connected: c.connected,
          lastSynced: c.lastSyncedAt
        }))
      },
      meta: {
        source: 'database',
        lastSync: connections[0]?.lastSyncedAt
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
  try {
    const userId = (req as any).userId;
    const { platform } = req.params;
    
    const connection = await prisma.socialAccountConnection.findFirst({
      where: {
        creatorId: userId,
        platform,
        connected: true
      },
      select: {
        id: true,
        platform: true,
        handle: true,
        connected: true,
        lastSyncedAt: true,
        metadata: true
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

    res.json({
      success: true,
      data: {
        platform: connection.platform,
        handle: connection.handle,
        connected: connection.connected,
        lastSynced: connection.lastSyncedAt,
        metadata: connection.metadata
      },
      meta: {
        source: 'database',
        lastSync: connection.lastSyncedAt
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

export default router;
