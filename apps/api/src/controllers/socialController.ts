import { Request, Response } from "express";
import { requireAuth } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';
import { logError } from '../lib/logger.js';

// Phase 5: Feature flag check
const checkSocialEnabled = (req: Request, res: Response, next: Function) => {
  const enabled = process.env.SOCIAL_ANALYTICS_ENABLED === "true";
  if (!enabled) {
    return res.status(503).json({
      error: "Social analytics feature is disabled",
      message: "This feature is currently disabled. Contact an administrator to enable it.",
      code: "FEATURE_DISABLED"
    });
  }
  next();
};

/**
 * GET /api/social
 * Get all connected social accounts for user
 */
export async function getAccounts(req: Request, res: Response) {
  try {
    checkSocialEnabled(req, res, () => {});
    
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const connections = await prisma.socialAccountConnection.findMany({
      where: {
        creatorId: userId,
        connected: true
      },
      include: {
        SocialProfile: {
          select: {
            id: true,
            platform: true,
            handle: true,
            followerCount: true,
            engagementRate: true,
            lastSyncedAt: true
          }
        }
      }
    });

    res.json({ accounts: connections });
  } catch (error) {
    logError("Failed to fetch social accounts", error, { userId: (req as any).user?.id });
    res.status(500).json({ 
      error: "Failed to fetch social accounts",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

/**
 * POST /api/social/connect
 * Connect a social account (redirects to OAuth)
 */
export async function connect(req: Request, res: Response) {
  try {
    checkSocialEnabled(req, res, () => {});
    
    const { platform } = req.body;
    const userId = (req as any).user?.id;

    if (!platform || !userId) {
      return res.status(400).json({ 
        error: "platform and userId are required" 
      });
    }

    // Route to platform-specific OAuth
    const platformRoutes: Record<string, string> = {
      instagram: "/api/auth/instagram/connect",
      tiktok: "/api/auth/tiktok/connect",
      youtube: "/api/auth/youtube/connect"
    };

    const route = platformRoutes[platform.toLowerCase()];
    if (!route) {
      return res.status(400).json({ 
        error: "Unsupported platform",
        supported: Object.keys(platformRoutes)
      });
    }

    res.json({ 
      redirectUrl: route,
      message: `Redirect to ${route} to complete OAuth flow`
    });
  } catch (error) {
    logError("Failed to initiate social connection", error, { userId: (req as any).user?.id });
    res.status(500).json({ 
      error: "Failed to initiate connection",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

/**
 * POST /api/social/disconnect
 * Disconnect a social account
 */
export async function disconnect(req: Request, res: Response) {
  try {
    checkSocialEnabled(req, res, () => {});
    
    const { platform, connectionId } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const where: any = {
      creatorId: userId
    };

    if (connectionId) {
      where.id = connectionId;
    } else if (platform) {
      where.platform = platform.toLowerCase();
    } else {
      return res.status(400).json({ 
        error: "platform or connectionId is required" 
      });
    }

    await prisma.socialAccountConnection.updateMany({
      where,
      data: {
        connected: false,
        accessToken: null,
        refreshToken: null,
        expiresAt: null
      }
    });

    res.json({ success: true, message: "Account disconnected" });
  } catch (error) {
    logError("Failed to disconnect social account", error, { userId: (req as any).user?.id });
    res.status(500).json({ 
      error: "Failed to disconnect account",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

/**
 * POST /api/social/refresh
 * Refresh social account data
 */
export async function refresh(req: Request, res: Response) {
  try {
    checkSocialEnabled(req, res, () => {});
    
    const { connectionId } = req.body;
    const userId = (req as any).user?.id;

    if (!connectionId) {
      return res.status(400).json({ 
        error: "connectionId is required" 
      });
    }

    // Queue refresh job
    const { socialQueue } = await import("../worker/queues.js");
    await socialQueue.add("refresh", {
      connectionId,
      userId
    });

    res.json({ 
      success: true, 
      message: "Refresh job queued" 
    });
  } catch (error) {
    logError("Failed to queue social refresh", error, { userId: (req as any).user?.id });
    res.status(500).json({ 
      error: "Failed to queue refresh",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

/**
 * GET /api/social/metrics/:platform
 * Get metrics for a platform
 */
export async function metrics(req: Request, res: Response) {
  try {
    checkSocialEnabled(req, res, () => {});
    
    const { platform } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

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
              orderBy: { snapshotDate: "desc" },
              take: 30
            },
            posts: {
              orderBy: { postedAt: "desc" },
              take: 10
            }
          }
        }
      }
    });

    if (!connection || !connection.SocialProfile) {
      return res.status(404).json({ 
        error: "No connected account found for this platform" 
      });
    }

    res.json({ 
      platform,
      profile: connection.SocialProfile,
      metrics: connection.SocialProfile.metrics,
      recentPosts: connection.SocialProfile.posts
    });
  } catch (error) {
    logError("Failed to fetch social metrics", error, { userId: (req as any).user?.id, platform: req.params.platform });
    res.status(500).json({ 
      error: "Failed to fetch metrics",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
