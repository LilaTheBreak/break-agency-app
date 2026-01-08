import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { getInstagramInboxAuthUrl, exchangeInstagramInboxCode } from "../services/instagram/instagramInboxAuth.js";
import { syncInstagramInboxForUser } from "../services/instagram/instagramInboxSync.js";
import prisma from "../lib/prisma.js";
import { getFrontendUrl } from "../config/frontendUrl.js";

const router = Router();

// Feature flag check
const checkInstagramInboxEnabled = (req: Request, res: Response, next: Function) => {
  const enabled = process.env.INSTAGRAM_INBOX_ENABLED === "true";
  if (!enabled) {
    return res.status(503).json({
      error: "Instagram inbox feature is disabled",
      message: "This feature is currently disabled. Contact an administrator to enable it.",
      code: "FEATURE_DISABLED"
    });
  }
  next();
};

router.use(requireAuth, checkInstagramInboxEnabled);

/**
 * GET /api/instagram-inbox/status
 * Check Instagram inbox connection status
 */
router.get("/status", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    
    const connection = await prisma.socialAccountConnection.findFirst({
      where: {
        creatorId: userId,
        platform: "instagram",
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
        message: "Instagram account not connected. Please authenticate to continue."
      });
    }

    // Count Instagram messages
    const messageCount = await prisma.inboundEmail.count({
      where: {
        userId,
        platform: "instagram"
      }
    });

    res.json({
      connected: true,
      status: "connected",
      message: "Instagram inbox connected",
      handle: connection.handle,
      expiresAt: connection.expiresAt,
      lastSyncedAt: connection.lastSyncedAt,
      stats: {
        messagesImported: messageCount
      }
    });
  } catch (error: any) {
    console.error("[INSTAGRAM INBOX] Status check error:", error);
    res.status(500).json({
      error: "Failed to check Instagram inbox status",
      message: error.message
    });
  }
});

/**
 * GET /api/instagram-inbox/connect
 * Get Instagram OAuth URL for inbox access
 */
router.get("/connect", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const authUrl = getInstagramInboxAuthUrl(userId);
    res.json({ success: true, url: authUrl });
  } catch (error: any) {
    console.error("[INSTAGRAM INBOX] Connect error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to initiate Instagram inbox connection",
      message: error.message
    });
  }
});

/**
 * GET /api/instagram-inbox/callback
 * Handle Instagram OAuth callback for inbox
 */
router.get("/callback", async (req: Request, res: Response) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      return res.redirect(`${getFrontendUrl()}/admin/inbox?error=instagram_inbox_auth_denied`);
    }

    if (!code || !state || typeof code !== "string" || typeof state !== "string") {
      return res.redirect(`${getFrontendUrl()}/admin/inbox?error=instagram_inbox_auth_failed`);
    }

    // Decode state
    const { userId, purpose } = JSON.parse(Buffer.from(state, "base64").toString());
    if (purpose !== "inbox") {
      return res.redirect(`${getFrontendUrl()}/admin/inbox?error=instagram_inbox_invalid_state`);
    }

    // Exchange code for token
    const { accessToken, expiresIn, userId: instagramUserId } = await exchangeInstagramInboxCode(code);

    // Get user profile
    const profileResponse = await (await import("axios")).default.get("https://graph.instagram.com/me", {
      params: {
        fields: "id,username",
        access_token: accessToken
      }
    });

    const profile = profileResponse.data;
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    // Save connection (reuse SocialAccountConnection model)
    await prisma.socialAccountConnection.upsert({
      where: {
        creatorId_platform: {
          creatorId: userId,
          platform: "instagram"
        }
      },
      create: {
        id: `ig_inbox_${userId}_${Date.now()}`,
        creatorId: userId,
        platform: "instagram",
        handle: profile.username,
        connected: true,
        accessToken,
        expiresAt,
        updatedAt: new Date(),
        metadata: {
          externalId: profile.id,
          purpose: "inbox"
        }
      },
      update: {
        connected: true,
        accessToken,
        expiresAt,
        handle: profile.username,
        metadata: {
          externalId: profile.id,
          purpose: "inbox"
        }
      }
    });

    res.redirect(`${getFrontendUrl()}/admin/inbox?success=instagram_inbox_connected`);
  } catch (error: any) {
    console.error("[INSTAGRAM INBOX] Callback error:", error);
    res.redirect(`${getFrontendUrl()}/admin/inbox?error=instagram_inbox_auth_failed`);
  }
});

/**
 * POST /api/instagram-inbox/sync
 * Manually trigger Instagram inbox sync
 */
router.post("/sync", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const stats = await syncInstagramInboxForUser(userId);
    
    res.json({
      success: true,
      message: "Instagram inbox sync completed",
      stats
    });
  } catch (error: any) {
    console.error("[INSTAGRAM INBOX] Sync error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to sync Instagram inbox",
      message: error.message
    });
  }
});

export default router;

