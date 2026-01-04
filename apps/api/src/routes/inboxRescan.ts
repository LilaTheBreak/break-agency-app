import { Router, type Request } from "express";
import { requireAuth } from "../middleware/auth.js";
import { createRateLimiter } from "../middleware/rateLimit.js";

const router = Router();

// Rate limiter for inbox rescan (conservative: 3 per 10 minutes)
const inboxRescanLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000, // 10 minutes
  maxRequests: 3, // 3 rescans per 10 minutes
  message: "Too many inbox rescan requests. Please wait before rescanning again.",
  keyGenerator: (req) => (req as any).user?.id || req.ip || "unknown",
});

/**
 * Inbox Re-scan Endpoint
 * Supports manual re-trigger of inbox AI classification.
 */
router.post("/api/inbox/rescan", requireAuth, inboxRescanLimiter, async (_req: Request, res) => {
          try {
            res.json({
              ok: true,
              message: "Inbox re-scan triggered (placeholder).",
            });
          } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            logError("Inbox rescan failed", error, { userId: (req as any).user?.id });
            res.status(500).json({ 
              ok: false, 
              error: "Inbox rescan failed",
              message: error.message 
            });
          }
});

export default router;
