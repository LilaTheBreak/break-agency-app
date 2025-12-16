import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

/**
 * Placeholder Calendar Intelligence Route
 * (Server boots cleanly. You may implement logic later.)
 */
router.get("/api/calendar/intelligence", requireAuth, async (_req: Request, res: Response) => {
  res.json({
    ok: true,
    message: "Calendar intelligence endpoint active (placeholder).",
  });
});

export default router;
