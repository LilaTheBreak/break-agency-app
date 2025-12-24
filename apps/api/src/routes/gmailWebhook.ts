import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { syncUser, syncAllUsers } from "../services/gmail/backgroundSync.js";
import { 
  registerWebhook, 
  stopWebhook, 
  renewWebhook,
  processWebhookNotification 
} from "../services/gmail/webhookService.js";

const router = Router();

/**
 * POST /api/gmail/webhook/notification
 * Receives push notifications from Gmail via Google Cloud Pub/Sub
 * Public endpoint - verified via Pub/Sub token
 */
router.post("/notification", async (req: Request, res: Response) => {
  try {
    const { userId, historyId } = await processWebhookNotification(req.body);
    
    if (userId) {
      // Trigger sync in background (don't wait for completion)
      syncUser(userId).catch(error => {
        console.error(`[GMAIL WEBHOOK] Background sync failed for user ${userId}:`, error);
      });
    }

    // Acknowledge receipt immediately
    res.status(204).send();
  } catch (error) {
    console.error("[GMAIL WEBHOOK] Error processing notification:", error);
    // Still return 204 to acknowledge receipt and prevent retries
    res.status(204).send();
  }
});

/**
 * POST /api/gmail/webhook/register
 * Register Gmail push notifications for current user
 */
router.post("/register", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const result = await registerWebhook(userId);
    
    res.json({
      success: true,
      message: "Gmail webhook registered",
      historyId: result.historyId,
      expiration: result.expiration
    });
  } catch (error) {
    console.error("[GMAIL WEBHOOK] Registration failed:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to register webhook"
    });
  }
});

/**
 * POST /api/gmail/webhook/unregister
 * Stop Gmail push notifications for current user
 */
router.post("/unregister", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    await stopWebhook(userId);
    
    res.json({
      success: true,
      message: "Gmail webhook unregistered"
    });
  } catch (error) {
    console.error("[GMAIL WEBHOOK] Unregistration failed:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to unregister webhook"
    });
  }
});

/**
 * POST /api/gmail/webhook/renew
 * Renew Gmail push notifications for current user
 */
router.post("/renew", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const result = await renewWebhook(userId);
    
    res.json({
      success: true,
      message: "Gmail webhook renewed",
      historyId: result.historyId,
      expiration: result.expiration
    });
  } catch (error) {
    console.error("[GMAIL WEBHOOK] Renewal failed:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to renew webhook"
    });
  }
});

export default router;
