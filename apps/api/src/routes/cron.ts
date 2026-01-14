import { Router, type Request, type Response } from "express";
import { syncAllUsers } from '../services/gmail/backgroundSync.js';
import { renewExpiringWebhooks } from '../services/gmail/webhookService.js';

const router = Router();

// Simple auth token for cron jobs (should match CRON_SECRET env var)
const CRON_SECRET = process.env.CRON_SECRET || "change-me-in-production";

function verifyCronAuth(req: Request, res: Response): boolean {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace("Bearer ", "");
  
  if (token !== CRON_SECRET) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  
  return true;
}

/**
 * POST /api/cron/gmail-sync
 * Background sync all users' Gmail inboxes
 * Should be called by cron job every 15-30 minutes
 */
router.post("/gmail-sync", async (req: Request, res: Response) => {
  if (!verifyCronAuth(req, res)) return;

  try {
    console.log("[CRON] Starting Gmail background sync...");
    const results = await syncAllUsers();
    
    const successful = results.filter(r => r.success).length;
    const totalImported = results.reduce((sum, r) => sum + r.imported, 0);
    
    res.json({
      success: true,
      message: "Gmail sync completed",
      stats: {
        totalUsers: results.length,
        successful,
        failed: results.length - successful,
        totalImported,
        results
      }
    });
  } catch (error) {
    console.error("[CRON] Gmail sync error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Sync failed"
    });
  }
});

/**
 * POST /api/cron/gmail-webhook-renewal
 * Renew expiring Gmail webhooks
 * Should be called by cron job daily
 */
router.post("/gmail-webhook-renewal", async (req: Request, res: Response) => {
  if (!verifyCronAuth(req, res)) return;

  try {
    console.log("[CRON] Starting Gmail webhook renewal...");
    await renewExpiringWebhooks();
    
    res.json({
      success: true,
      message: "Webhook renewal completed"
    });
  } catch (error) {
    console.error("[CRON] Webhook renewal error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Renewal failed"
    });
  }
});

export default router;
