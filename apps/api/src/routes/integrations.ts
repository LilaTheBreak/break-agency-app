import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import prisma from "../lib/prisma.js";
import { logError } from "../lib/logger.js";
import { sendSlackNotification, notifyDealUpdate, notifyInvoiceCreated, notifyApprovalRequired } from "../services/integrations/slackService.js";
import { syncBrandToNotion, syncDealToNotion } from "../services/integrations/notionService.js";
import { linkDriveFileToRecord, listDriveFiles } from "../services/integrations/googleDriveService.js";

const router = Router();

// All routes require authentication
router.use(requireAuth);

// ============================================
// SLACK INTEGRATION
// ============================================

/**
 * POST /api/integrations/slack/connect
 * Connect Slack via webhook URL
 */
router.post("/slack/connect", async (req: Request, res: Response) => {
  const enabled = process.env.SLACK_INTEGRATION_ENABLED === "true";
  if (!enabled) {
    return res.status(503).json({
      success: false,
      error: "Slack integration is disabled",
      message: "This feature is currently disabled. Contact an administrator to enable it.",
      code: "FEATURE_DISABLED"
    });
  }

  try {
    const userId = (req as any).user?.id;
    const { webhookUrl } = req.body;

    if (!webhookUrl) {
      return res.status(400).json({
        success: false,
        error: "Webhook URL required"
      });
    }

    // Validate webhook URL
    if (!webhookUrl.startsWith("https://hooks.slack.com/")) {
      return res.status(400).json({
        success: false,
        error: "Invalid Slack webhook URL"
      });
    }

    // Test webhook
    const testResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: "Test connection from Break Agency"
      })
    });

    if (!testResponse.ok) {
      return res.status(400).json({
        success: false,
        error: "Webhook URL test failed"
      });
    }

    // Save connection
    const connection = await prisma.integrationConnection.upsert({
      where: {
        userId_platform: {
          userId,
          platform: "slack"
        }
      },
      create: {
        userId,
        platform: "slack",
        connected: true,
        webhookUrl,
        lastSyncedAt: new Date()
      },
      update: {
        connected: true,
        webhookUrl,
        lastSyncedAt: new Date()
      }
    });

    res.json({
      success: true,
      connection: {
        id: connection.id,
        platform: connection.platform,
        connected: connection.connected
      }
    });
  } catch (error) {
    logError("Slack connect error", error);
    res.status(500).json({
      success: false,
      error: "Failed to connect Slack",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * POST /api/integrations/slack/disconnect
 * Disconnect Slack
 */
router.post("/slack/disconnect", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    await prisma.integrationConnection.updateMany({
      where: {
        userId,
        platform: "slack"
      },
      data: {
        connected: false,
        webhookUrl: null
      }
    });

    res.json({ success: true });
  } catch (error) {
    logError("Slack disconnect error", error);
    res.status(500).json({
      success: false,
      error: "Failed to disconnect Slack"
    });
  }
});

/**
 * GET /api/integrations/slack/status
 * Get Slack connection status
 */
router.get("/slack/status", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    const connection = await prisma.integrationConnection.findUnique({
      where: {
        userId_platform: {
          userId,
          platform: "slack"
        }
      }
    });

    res.json({
      success: true,
      connected: connection?.connected || false,
      lastSyncedAt: connection?.lastSyncedAt
    });
  } catch (error) {
    logError("Slack status error", error);
    res.status(500).json({
      success: false,
      error: "Failed to get Slack status"
    });
  }
});

// ============================================
// NOTION INTEGRATION
// ============================================

/**
 * POST /api/integrations/notion/connect
 * Connect Notion via OAuth (simplified - stores access token)
 */
router.post("/notion/connect", async (req: Request, res: Response) => {
  const enabled = process.env.NOTION_INTEGRATION_ENABLED === "true";
  if (!enabled) {
    return res.status(503).json({
      success: false,
      error: "Notion integration is disabled",
      message: "This feature is currently disabled. Contact an administrator to enable it.",
      code: "FEATURE_DISABLED"
    });
  }

  try {
    const userId = (req as any).user?.id;
    const { accessToken, workspaceId, workspaceName } = req.body;

    if (!accessToken) {
      return res.status(400).json({
        success: false,
        error: "Access token required"
      });
    }

    // Test connection
    try {
      try {
        // @ts-ignore - Optional module
        const notionClient = await import("@notionhq/client").then(m => m.Client);
        const client = new notionClient({ auth: accessToken });
        await client.users.me();
      } catch (importError) {
        // Notion client not installed, skip validation
        console.warn("Notion client not installed");
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: "Invalid Notion access token"
      });
    }

    // Save connection
    const connection = await prisma.integrationConnection.upsert({
      where: {
        userId_platform: {
          userId,
          platform: "notion"
        }
      },
      create: {
        userId,
        platform: "notion",
        connected: true,
        accessToken,
        workspaceId,
        workspaceName,
        lastSyncedAt: new Date()
      },
      update: {
        connected: true,
        accessToken,
        workspaceId,
        workspaceName,
        lastSyncedAt: new Date()
      }
    });

    res.json({
      success: true,
      connection: {
        id: connection.id,
        platform: connection.platform,
        connected: connection.connected,
        workspaceName: connection.workspaceName
      }
    });
  } catch (error) {
    logError("Notion connect error", error);
    res.status(500).json({
      success: false,
      error: "Failed to connect Notion",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * POST /api/integrations/notion/disconnect
 * Disconnect Notion
 */
router.post("/notion/disconnect", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    await prisma.integrationConnection.updateMany({
      where: {
        userId,
        platform: "notion"
      },
      data: {
        connected: false,
        accessToken: null,
        refreshToken: null,
        workspaceId: null,
        workspaceName: null
      }
    });

    res.json({ success: true });
  } catch (error) {
    logError("Notion disconnect error", error);
    res.status(500).json({
      success: false,
      error: "Failed to disconnect Notion"
    });
  }
});

/**
 * POST /api/integrations/notion/sync/brand/:brandId
 * Sync brand to Notion
 */
router.post("/notion/sync/brand/:brandId", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { brandId } = req.params;

    const result = await syncBrandToNotion(userId, brandId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    logError("Notion sync error", error);
    res.status(500).json({
      success: false,
      error: "Failed to sync to Notion"
    });
  }
});

/**
 * POST /api/integrations/notion/sync/deal/:dealId
 * Sync deal to Notion
 */
router.post("/notion/sync/deal/:dealId", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { dealId } = req.params;

    const result = await syncDealToNotion(userId, dealId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    logError("Notion sync error", error);
    res.status(500).json({
      success: false,
      error: "Failed to sync to Notion"
    });
  }
});

/**
 * GET /api/integrations/notion/status
 * Get Notion connection status
 */
router.get("/notion/status", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    const connection = await prisma.integrationConnection.findUnique({
      where: {
        userId_platform: {
          userId,
          platform: "notion"
        }
      }
    });

    res.json({
      success: true,
      connected: connection?.connected || false,
      workspaceName: connection?.workspaceName,
      lastSyncedAt: connection?.lastSyncedAt
    });
  } catch (error) {
    logError("Notion status error", error);
    res.status(500).json({
      success: false,
      error: "Failed to get Notion status"
    });
  }
});

// ============================================
// GOOGLE DRIVE INTEGRATION
// ============================================

/**
 * POST /api/integrations/google-drive/connect
 * Connect Google Drive via OAuth (simplified - stores access token)
 */
router.post("/google-drive/connect", async (req: Request, res: Response) => {
  const enabled = process.env.GOOGLE_DRIVE_INTEGRATION_ENABLED === "true";
  if (!enabled) {
    return res.status(503).json({
      success: false,
      error: "Google Drive integration is disabled",
      message: "This feature is currently disabled. Contact an administrator to enable it.",
      code: "FEATURE_DISABLED"
    });
  }

  try {
    const userId = (req as any).user?.id;
    const { accessToken, refreshToken, expiresAt } = req.body;

    if (!accessToken) {
      return res.status(400).json({
        success: false,
        error: "Access token required"
      });
    }

    // Save connection
    const connection = await prisma.integrationConnection.upsert({
      where: {
        userId_platform: {
          userId,
          platform: "google_drive"
        }
      },
      create: {
        userId,
        platform: "google_drive",
        connected: true,
        accessToken,
        refreshToken,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        lastSyncedAt: new Date()
      },
      update: {
        connected: true,
        accessToken,
        refreshToken,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        lastSyncedAt: new Date()
      }
    });

    res.json({
      success: true,
      connection: {
        id: connection.id,
        platform: connection.platform,
        connected: connection.connected
      }
    });
  } catch (error) {
    logError("Google Drive connect error", error);
    res.status(500).json({
      success: false,
      error: "Failed to connect Google Drive",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * POST /api/integrations/google-drive/disconnect
 * Disconnect Google Drive
 */
router.post("/google-drive/disconnect", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    await prisma.integrationConnection.updateMany({
      where: {
        userId,
        platform: "google_drive"
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
    logError("Google Drive disconnect error", error);
    res.status(500).json({
      success: false,
      error: "Failed to disconnect Google Drive"
    });
  }
});

/**
 * POST /api/integrations/google-drive/link
 * Link Google Drive file to CRM record
 */
router.post("/google-drive/link", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { fileId, recordType, recordId } = req.body;

    if (!fileId || !recordType || !recordId) {
      return res.status(400).json({
        success: false,
        error: "fileId, recordType, and recordId required"
      });
    }

    const result = await linkDriveFileToRecord(userId, fileId, recordType, recordId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    logError("Google Drive link error", error);
    res.status(500).json({
      success: false,
      error: "Failed to link file"
    });
  }
});

/**
 * GET /api/integrations/google-drive/files
 * List Google Drive files
 */
router.get("/google-drive/files", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { query } = req.query;

    const result = await listDriveFiles(userId, query as string);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    logError("Google Drive list error", error);
    res.status(500).json({
      success: false,
      error: "Failed to list files"
    });
  }
});

/**
 * GET /api/integrations/google-drive/status
 * Get Google Drive connection status
 */
router.get("/google-drive/status", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    const connection = await prisma.integrationConnection.findUnique({
      where: {
        userId_platform: {
          userId,
          platform: "google_drive"
        }
      }
    });

    res.json({
      success: true,
      connected: connection?.connected || false,
      lastSyncedAt: connection?.lastSyncedAt
    });
  } catch (error) {
    logError("Google Drive status error", error);
    res.status(500).json({
      success: false,
      error: "Failed to get Google Drive status"
    });
  }
});

export default router;

