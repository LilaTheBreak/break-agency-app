/**
 * Social Connections API Routes
 * 
 * Production-grade social profile connection system supporting:
 * - Manual URL-based linking (admin)
 * - OAuth-based connections (talent)
 * - State management (Connected, Syncing, Error)
 * - Background data ingestion
 */

import { Router, Request, Response } from "express";
import { prisma } from "../../db/prisma.js";
import { redis } from "../../services/redis.js";
import { verifyAuth } from "../../middleware/auth.js";
import { sendError, sendSuccess } from "../../utils/response.js";
import { logAdminActivity } from "../../services/adminActivityLogger.js";
import { validateAdminRole } from "../../middleware/adminAuth.js";
import { queueSocialDataIngest } from "../../jobs/socialDataIngestQueue.js";

const router = Router();

/**
 * ADMIN FLOW: Manual URL Connection
 * 
 * POST /api/admin/socials/connect-manual
 * Body: {
 *   talentId: string,
 *   platform: "INSTAGRAM" | "TIKTOK" | "YOUTUBE" | "TWITTER" | "LINKEDIN",
 *   handle: string (with or without @),
 *   profileUrl: string (optional for validation)
 * }
 * 
 * Response: {
 *   connectionId: string,
 *   handle: string,
 *   platform: string,
 *   connectionType: "MANUAL",
 *   connected: true,
 *   syncStatus: "PENDING" | "SYNCING"
 * }
 */
router.post("/admin/socials/connect-manual", verifyAuth, validateAdminRole, async (req: Request, res: Response) => {
  try {
    const { talentId, platform, handle, profileUrl } = req.body;

    // Validation
    if (!talentId || !platform || !handle) {
      return sendError(res, "INVALID_INPUT", "talentId, platform, and handle are required", 400);
    }

    // Validate talent exists
    const talent = await prisma.talent.findUnique({ where: { id: talentId } });
    if (!talent) {
      return sendError(res, "NOT_FOUND", "Talent not found", 404);
    }

    // Validate platform
    const validPlatforms = ["INSTAGRAM", "TIKTOK", "YOUTUBE", "TWITTER", "LINKEDIN"];
    if (!validPlatforms.includes(platform)) {
      return sendError(res, "INVALID_INPUT", `Invalid platform: ${platform}`, 400);
    }

    // Normalize handle (remove @ if present)
    const normalizedHandle = handle.startsWith("@") ? handle.slice(1) : handle;

    // Validate handle format (basic alphanumeric + underscore/dot)
    const handleRegex = /^[a-zA-Z0-9._-]+$/;
    if (!handleRegex.test(normalizedHandle)) {
      return sendError(res, "INVALID_INPUT", "Invalid handle format. Use only letters, numbers, dots, underscores, and dashes", 400);
    }

    // Create or update SocialAccountConnection
    const connection = await prisma.socialAccountConnection.upsert({
      where: {
        creatorId_platform: {
          creatorId: talentId,
          platform,
        },
      },
      update: {
        handle: normalizedHandle,
        profileUrl: profileUrl || null,
        connected: true,
        connectionType: "MANUAL",
        syncStatus: "PENDING", // Will be updated to SYNCING when job starts
        syncError: null, // Clear previous errors
        updatedAt: new Date(),
      },
      create: {
        id: `conn_${talentId}_${platform}_${Date.now()}`,
        creatorId: talentId,
        platform,
        handle: normalizedHandle,
        profileUrl: profileUrl || null,
        connected: true,
        connectionType: "MANUAL",
        syncStatus: "PENDING",
        updatedAt: new Date(),
      },
    });

    // Clear Social Intelligence cache
    await redis.del(`social_intel:${talentId}`).catch(console.warn);

    // Queue background job for data ingestion
    try {
      await queueSocialDataIngest({
        connectionId: connection.id,
        talentId,
        platform,
        handle: normalizedHandle,
        connectionType: "MANUAL",
      });
      console.log("[SOCIAL_CONNECT] Queued data ingestion for:", { connectionId: connection.id, platform });
    } catch (queueError) {
      console.warn("[SOCIAL_CONNECT] Failed to queue sync job:", queueError);
      // Don't block response - sync will be retried
    }

    // Log admin activity
    await logAdminActivity(req, {
      action: "SOCIAL_PROFILE_CONNECTED",
      entityType: "SocialAccountConnection",
      entityId: connection.id,
      metadata: {
        talentId,
        platform,
        handle: normalizedHandle,
        connectionType: "MANUAL",
      },
    }).catch(console.warn);

    return sendSuccess(res, {
      connectionId: connection.id,
      handle: normalizedHandle,
      platform,
      profileUrl: connection.profileUrl,
      connectionType: "MANUAL",
      connected: true,
      syncStatus: "PENDING",
      message: "Profile connected. Data sync will begin shortly.",
    }, 201);
  } catch (error) {
    console.error("[SOCIAL_CONNECT] Error:", error);
    return sendError(res, "INTERNAL_ERROR", "Failed to connect social profile", 500);
  }
});

/**
 * TALENT FLOW: OAuth Connection Callback
 * 
 * POST /api/socials/oauth/callback
 * Body: {
 *   platform: "INSTAGRAM" | "TIKTOK" | "YOUTUBE",
 *   accessToken: string (encrypted by client),
 *   refreshToken: string? (encrypted by client),
 *   expiresAt: ISO datetime,
 *   handle: string,
 *   profileUrl: string
 * }
 * 
 * Response: {
 *   connectionId: string,
 *   connected: true,
 *   syncStatus: "SYNCING"
 * }
 */
router.post("/socials/oauth/callback", verifyAuth, async (req: Request, res: Response) => {
  try {
    const { platform, accessToken, refreshToken, expiresAt, handle, profileUrl } = req.body;
    const talentId = (req as any).user?.id;

    if (!talentId) {
      return sendError(res, "UNAUTHORIZED", "User not authenticated", 401);
    }

    if (!platform || !accessToken || !handle) {
      return sendError(res, "INVALID_INPUT", "platform, accessToken, and handle are required", 400);
    }

    // Validate talent exists
    const talent = await prisma.talent.findUnique({ where: { id: talentId } });
    if (!talent) {
      return sendError(res, "NOT_FOUND", "Talent profile not found", 404);
    }

    // Create or update connection with OAuth tokens
    const connection = await prisma.socialAccountConnection.upsert({
      where: {
        creatorId_platform: {
          creatorId: talentId,
          platform,
        },
      },
      update: {
        handle,
        profileUrl,
        connected: true,
        connectionType: "OAUTH",
        accessToken, // Should be encrypted by client/middleware
        refreshToken: refreshToken || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        syncStatus: "PENDING",
        syncError: null,
        updatedAt: new Date(),
      },
      create: {
        id: `conn_${talentId}_${platform}_${Date.now()}`,
        creatorId: talentId,
        platform,
        handle,
        profileUrl,
        connected: true,
        connectionType: "OAUTH",
        accessToken,
        refreshToken: refreshToken || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        syncStatus: "PENDING",
        updatedAt: new Date(),
      },
    });

    // Clear cache
    await redis.del(`social_intel:${talentId}`).catch(console.warn);

    // Queue background job for data ingestion
    try {
      await queueSocialDataIngest({
        connectionId: connection.id,
        talentId,
        platform,
        handle,
        connectionType: "OAUTH",
      });
      console.log("[SOCIAL_OAUTH] Queued data ingestion for:", { connectionId: connection.id, platform });
    } catch (queueError) {
      console.warn("[SOCIAL_OAUTH] Failed to queue sync job:", queueError);
    }

    return sendSuccess(res, {
      connectionId: connection.id,
      handle,
      platform,
      connectionType: "OAUTH",
      connected: true,
      syncStatus: "PENDING",
      message: "Successfully connected via OAuth. Data sync will begin immediately.",
    }, 201);
  } catch (error) {
    console.error("[SOCIAL_OAUTH] Error:", error);
    return sendError(res, "INTERNAL_ERROR", "Failed to complete OAuth connection", 500);
  }
});

/**
 * GET /api/admin/talent/:talentId/social-connections
 * Get all social connections for a talent with current status
 */
router.get("/admin/talent/:talentId/social-connections", verifyAuth, validateAdminRole, async (req: Request, res: Response) => {
  try {
    const { talentId } = req.params;

    const connections = await prisma.socialAccountConnection.findMany({
      where: { creatorId: talentId },
      select: {
        id: true,
        platform: true,
        handle: true,
        profileUrl: true,
        connected: true,
        connectionType: true,
        syncStatus: true,
        syncError: true,
        lastSyncedAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return sendSuccess(res, {
      connections,
      total: connections.length,
    });
  } catch (error) {
    console.error("[SOCIAL_CONNECTIONS_GET] Error:", error);
    return sendError(res, "INTERNAL_ERROR", "Failed to fetch connections", 500);
  }
});

/**
 * POST /api/admin/socials/:connectionId/sync
 * Manually trigger a data sync for a connection
 */
router.post("/admin/socials/:connectionId/sync", verifyAuth, validateAdminRole, async (req: Request, res: Response) => {
  try {
    const { connectionId } = req.params;

    const connection = await prisma.socialAccountConnection.findUnique({
      where: { id: connectionId },
    });

    if (!connection) {
      return sendError(res, "NOT_FOUND", "Connection not found", 404);
    }

    if (!connection.connected) {
      return sendError(res, "INVALID_STATE", "Cannot sync a disconnected profile", 400);
    }

    // Update sync status
    const updated = await prisma.socialAccountConnection.update({
      where: { id: connectionId },
      data: {
        syncStatus: "SYNCING",
        syncError: null,
        updatedAt: new Date(),
      },
    });

    // Queue sync job
    try {
      await queueSocialDataIngest({
        connectionId,
        talentId: connection.creatorId,
        platform: connection.platform,
        handle: connection.handle,
        connectionType: connection.connectionType as "MANUAL" | "OAUTH",
      });
      console.log("[SOCIAL_SYNC_MANUAL] Queued sync for:", { connectionId });
    } catch (queueError) {
      console.warn("[SOCIAL_SYNC_MANUAL] Queue error:", queueError);
      return sendError(res, "INTERNAL_ERROR", "Failed to queue sync", 500);
    }

    // Clear cache
    await redis.del(`social_intel:${connection.creatorId}`).catch(console.warn);

    return sendSuccess(res, {
      connectionId: updated.id,
      syncStatus: "SYNCING",
      message: "Sync triggered. Data will refresh shortly.",
    });
  } catch (error) {
    console.error("[SOCIAL_SYNC_MANUAL] Error:", error);
    return sendError(res, "INTERNAL_ERROR", "Failed to trigger sync", 500);
  }
});

/**
 * DELETE /api/admin/socials/:connectionId
 * Disconnect and remove a social account connection
 */
router.delete("/admin/socials/:connectionId", verifyAuth, validateAdminRole, async (req: Request, res: Response) => {
  try {
    const { connectionId } = req.params;

    const connection = await prisma.socialAccountConnection.findUnique({
      where: { id: connectionId },
      include: {
        SocialProfile: true,
      },
    });

    if (!connection) {
      return sendError(res, "NOT_FOUND", "Connection not found", 404);
    }

    const talentId = connection.creatorId;

    // Delete associated profile if exists
    if (connection.SocialProfile) {
      await prisma.socialProfile.delete({
        where: { id: connection.SocialProfile.id },
      }).catch(console.warn);
    }

    // Delete connection
    await prisma.socialAccountConnection.delete({
      where: { id: connectionId },
    });

    // Clear cache
    await redis.del(`social_intel:${talentId}`).catch(console.warn);

    // Log activity
    await logAdminActivity(req, {
      action: "SOCIAL_PROFILE_DISCONNECTED",
      entityType: "SocialAccountConnection",
      entityId: connectionId,
      metadata: {
        talentId,
        platform: connection.platform,
        handle: connection.handle,
      },
    }).catch(console.warn);

    return sendSuccess(res, {
      message: "Social connection removed",
    });
  } catch (error) {
    console.error("[SOCIAL_DELETE] Error:", error);
    return sendError(res, "INTERNAL_ERROR", "Failed to delete connection", 500);
  }
});

export default router;
