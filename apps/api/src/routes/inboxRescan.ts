import { Router, type Request } from "express";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

/**
 * Inbox Re-scan Endpoint
 * Supports manual re-trigger of inbox AI classification.
 */
router.post("/api/inbox/rescan", requireAuth, async (_req: Request, res) => {
  try {
    res.json({
      ok: true,
      message: "Inbox re-scan triggered (placeholder).",
    });
  } catch (err) {
    console.error("INBOX RESCAN ERROR:", err);
    res.status(500).json({ ok: false, error: "Inbox rescan failed" });
  }
});

export default router;
