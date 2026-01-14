import { Router, Request, Response } from "express";
import { requireAuth } from '../middleware/auth';
import { getTikTokInboxAuthUrl, exchangeTikTokInboxCode } from '../services/tiktok/tiktokInboxAuth';
import { syncTikTokInboxForUser } from '../services/tiktok/tiktokInboxSync';
import prisma from '../lib/prisma';
import { getFrontendUrl } from '../config/frontendUrl';

const router = Router();

// Feature flag check
const checkTikTokInboxEnabled = (req: Request, res: Response, next: Function) => {
  const enabled = process.env.TIKTOK_INBOX_ENABLED === "true";
  if (!enabled) {
    return res.status(503).json({
      error: "TikTok inbox feature is disabled",
      message: "This feature is currently disabled. Contact an administrator to enable it.",
      code: "FEATURE_DISABLED"
    });
  }
  next();
};

router.use(requireAuth, checkTikTokInboxEnabled);

/**
 * GET /api/tiktok-inbox/status
 * Check TikTok inbox connection status
 */
router.get("/status", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    
    const connection = await prisma.socialAccountConnection.findFirst({
      where: {
        creatorId: userId,
        platform: "tiktok",
        connected: true
      },
      select: {
        handle: true,
        connected: true,
        expiresAt: true,
        lastSyncedAt: true
      }
    });

    if (!connection) {
      return res.json({
        connected: false,
        status: "disconnected",
        message: "TikTok account not connected. Please authenticate to continue."
      });
    }

    // Count TikTok messages
    const messageCount = await prisma.inboundEmail.count({
      where: {
        userId,
        platform: "tiktok"
      }
    });

    res.json({
      connected: true,
      status: "connected",
      message: "TikTok inbox connected",
      handle: connection.handle,
      expiresAt: connection.expiresAt,
      lastSyncedAt: connection.lastSyncedAt,
      stats: {
        messagesImported: messageCount
      }
    });
  } catch (error: any) {
    console.error("[TIKTOK INBOX] Status check error:", error);
    return res.status(500).json({
      error: "Failed to check TikTok inbox status",
      message: error.message
    });
  }
});

/**
 * GET /api/tiktok-inbox/connect
 * Get TikTok OAuth URL for inbox access
 */
router.get("/connect", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const authUrl = getTikTokInboxAuthUrl(userId);
    return res.json({ success: true, url: authUrl });
  } catch (error: any) {
    console.error("[TIKTOK INBOX] Connect error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to initiate TikTok inbox connection",
      message: error.message
    });
  }
});

/**
 * GET /api/tiktok-inbox/callback
 * Handle TikTok OAuth callback for inbox
 */
router.get("/callback", async (req: Request, res: Response) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      return res.redirect(`${getFrontendUrl()}/admin/inbox?error=tiktok_inbox_auth_denied`);
    }

    if (!code || !state || typeof code !== "string" || typeof state !== "string") {
      return res.redirect(`${getFrontendUrl()}/admin/inbox?error=tiktok_inbox_auth_failed`);
    }

    // Decode state
    const { userId, purpose } = JSON.parse(Buffer.from(state, "base64").toString());
    if (purpose !== "inbox") {
      return res.redirect(`${getFrontendUrl()}/admin/inbox?error=tiktok_inbox_invalid_state`);
    }

    // Exchange code for token
    const { accessToken, refreshToken, expiresIn, openId } = await exchangeTikTokInboxCode(code);

    // Get user profile
    const profileResponse = await (await import("axios")).default.get("https://open.tiktokapis.com/v2/user/info/", {
      params: {
        fields: "open_id,union_id,avatar_url,display_name,profile_deep_link"
      },
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    const profile = profileResponse.data.data.user;
    const handle = profile.profile_deep_link 
      ? profile.profile_deep_link.match(/@([^?/]+)/)?.[1] 
      : profile.display_name;
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    // Save connection (reuse SocialAccountConnection model)
    await prisma.socialAccountConnection.upsert({
      where: {
        creatorId_platform: {
          creatorId: userId,
          platform: "tiktok"
        }
      },
      create: {
        id: `tt_inbox_${userId}_${Date.now()}`,
        creatorId: userId,
        platform: "tiktok",
        handle: handle || profile.display_name,
        connected: true,
        accessToken,
        refreshToken,
        expiresAt,
        updatedAt: new Date(),
        metadata: {
          openId,
          externalId: profile.open_id,
          purpose: "inbox"
        }
      },
      update: {
        connected: true,
        accessToken,
        refreshToken,
        expiresAt,
        handle: handle || profile.display_name,
        metadata: {
          openId,
          externalId: profile.open_id,
          purpose: "inbox"
        }
      }
    });

    res.redirect(`${getFrontendUrl()}/admin/inbox?success=tiktok_inbox_connected`);
  } catch (error: any) {
    console.error("[TIKTOK INBOX] Callback error:", error);
    res.redirect(`${getFrontendUrl()}/admin/inbox?error=tiktok_inbox_auth_failed`);
  }
});

/**
 * POST /api/tiktok-inbox/sync
 * Manually trigger TikTok inbox sync
 */
router.post("/sync", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const stats = await syncTikTokInboxForUser(userId);
    
    return res.json({
      success: true,
      message: "TikTok inbox sync completed",
      stats
    });
  } catch (error: any) {
    console.error("[TIKTOK INBOX] Sync error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to sync TikTok inbox",
      message: error.message
    });
  }
});

export default router;

