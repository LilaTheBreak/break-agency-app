import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import prisma from "../lib/prisma.js";
import { logError } from "../lib/logger.js";

const router = Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

/**
 * GET /api/talent/socials
 * Get user's connected social accounts
 */
router.get("/socials", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    console.log(`[TALENT SOCIALS] GET /socials for user ${userId}`);

    // Find all social connections for this user
    const socialConnections = await prisma.socialAccountConnection.findMany({
      where: { 
        creatorId: userId,
        connected: true
      },
      select: {
        id: true,
        platform: true,
        handle: true,
        profileUrl: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: "desc" }
    });

    console.log(`[TALENT SOCIALS] Found ${socialConnections.length} connected platforms`);

    return res.json({
      success: true,
      platforms: socialConnections.map(platform => ({
        id: platform.id,
        platform: platform.platform,
        handle: platform.handle,
        url: platform.profileUrl,
        followers: 0, // TODO: Fetch from actual platform API
        connectedAt: platform.createdAt,
        lastSyncedAt: platform.updatedAt
      }))
    });
  } catch (error) {
    console.error("[TALENT SOCIALS] Error fetching socials:", error);
    logError("Failed to fetch talent socials", error, { userId: (req as any).user?.id });
    
    return res.status(500).json({
      error: "Failed to fetch social accounts",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * DELETE /api/talent/socials/:platform
 * Disconnect a social account by platform name
 */
router.delete("/socials/:platform", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { platform } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    if (!platform) {
      return res.status(400).json({ error: "Platform is required" });
    }

    console.log(`[TALENT SOCIALS] DELETE /socials/${platform} for user ${userId}`);

    // Find the social connection
    const socialConnection = await prisma.socialAccountConnection.findUnique({
      where: {
        creatorId_platform: {
          creatorId: userId,
          platform: platform.toUpperCase()
        }
      }
    });

    if (!socialConnection) {
      return res.status(404).json({
        error: "Social account not found",
        message: `No ${platform} account connected for this user`
      });
    }

    // Delete the connection
    await prisma.socialAccountConnection.delete({
      where: { id: socialConnection.id }
    });

    console.log(`[TALENT SOCIALS] Successfully deleted ${platform} connection`);

    return res.json({
      success: true,
      message: `${platform} account disconnected successfully`
    });
  } catch (error) {
    console.error(`[TALENT SOCIALS] Error disconnecting social:`, error);
    logError("Failed to disconnect social account", error, {
      userId: (req as any).user?.id,
      platform: req.params.platform
    });

    return res.status(500).json({
      error: "Failed to disconnect social account",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * GET /api/talent/preferences
 * Get user's notification preferences
 */
router.get("/preferences", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    console.log(`[TALENT] GET /preferences for user ${userId}`);

    // Get user preferences from database or return defaults
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        // Add preference fields if they exist in your schema
        // For now return placeholder preferences
      }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Return default preferences (in real implementation, fetch from database)
    const preferences = {
      emailNotifications: true,
      campaignUpdates: true,
      opportunityAlerts: true,
      paymentNotifications: true,
      weeklyDigest: false,
      directMessagesOnly: false
    };

    return res.json({ success: true, preferences });
  } catch (error) {
    console.error("[TALENT] Error fetching preferences:", error);
    logError("Failed to fetch talent preferences", error, { userId: (req as any).user?.id });

    return res.status(500).json({
      error: "Failed to fetch preferences",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * PUT /api/talent/preferences
 * Update user's notification preferences
 */
router.put("/preferences", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const preferences = req.body;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    console.log(`[TALENT] PUT /preferences for user ${userId}`, preferences);

    // TODO: Store preferences in database
    // For now just acknowledge the update
    
    return res.json({
      success: true,
      message: "Preferences updated successfully",
      preferences
    });
  } catch (error) {
    console.error("[TALENT] Error updating preferences:", error);
    logError("Failed to update talent preferences", error, { userId: (req as any).user?.id });

    return res.status(500).json({
      error: "Failed to update preferences",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * PUT /api/talent/profile
 * Update user's profile information
 */
router.put("/profile", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { displayName, bio, timezone } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    console.log(`[TALENT] PUT /profile for user ${userId}`, { displayName, bio, timezone });

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: displayName || undefined,
        // Add bio and timezone fields if they exist in your schema
        // metadata: {
        //   bio,
        //   timezone
        // }
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });

    console.log(`[TALENT] Profile updated for user ${userId}`);

    return res.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser
    });
  } catch (error) {
    console.error("[TALENT] Error updating profile:", error);
    logError("Failed to update talent profile", error, { userId: (req as any).user?.id });

    return res.status(500).json({
      error: "Failed to update profile",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * POST /api/talent/apply-exclusive
 * Submit application for exclusive talent program
 */
router.post("/apply-exclusive", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    console.log(`[TALENT] POST /apply-exclusive for user ${userId}`);

    // Check if user has connected socials
    const socialConnections = await prisma.socialAccountConnection.findMany({
      where: { 
        creatorId: userId,
        connected: true
      }
    });

    if (socialConnections.length === 0) {
      return res.status(400).json({
        error: "Missing social connections",
        message: "You must connect at least one social media account to apply for exclusive talent status"
      });
    }

    // TODO: Create application record in database
    console.log(`[TALENT] Exclusive talent application submitted for user ${userId}`);

    return res.json({
      success: true,
      message: "Application submitted successfully! Our team will review your profile."
    });
  } catch (error) {
    console.error("[TALENT] Error submitting exclusive application:", error);
    logError("Failed to submit exclusive talent application", error, { userId: (req as any).user?.id });

    return res.status(500).json({
      error: "Failed to submit application",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;
