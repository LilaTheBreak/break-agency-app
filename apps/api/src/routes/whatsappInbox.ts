import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { whatsappInboxProvider } from "../services/whatsapp/whatsappInboxProvider.js";

const router = Router();

// Feature flag check
const checkWhatsAppInboxEnabled = (req: Request, res: Response, next: Function) => {
  const enabled = process.env.WHATSAPP_INBOX_ENABLED === "true";
  if (!enabled) {
    return res.status(503).json({
      error: "WhatsApp inbox feature is disabled",
      message: "This feature is currently disabled. Contact an administrator to enable it.",
      code: "FEATURE_DISABLED"
    });
  }
  next();
};

router.use(requireAuth, checkWhatsAppInboxEnabled);

/**
 * GET /api/whatsapp-inbox/status
 * Check WhatsApp inbox connection status (placeholder)
 */
router.get("/status", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const status = await whatsappInboxProvider.getConnectionStatus(userId);
    
    res.json({
      connected: status.connected,
      status: status.connected ? "connected" : "disconnected",
      message: status.message,
      stats: {
        messagesImported: 0
      }
    });
  } catch (error: any) {
    console.error("[WHATSAPP INBOX] Status check error:", error);
    res.status(500).json({
      error: "Failed to check WhatsApp inbox status",
      message: error.message
    });
  }
});

/**
 * POST /api/whatsapp-inbox/sync
 * Manually trigger WhatsApp inbox sync (placeholder)
 */
router.post("/sync", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const stats = await whatsappInboxProvider.syncInboxForUser(userId);
    
    res.json({
      success: true,
      message: "WhatsApp inbox sync completed (placeholder - no messages available)",
      stats
    });
  } catch (error: any) {
    console.error("[WHATSAPP INBOX] Sync error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to sync WhatsApp inbox",
      message: error.message
    });
  }
});

export default router;

