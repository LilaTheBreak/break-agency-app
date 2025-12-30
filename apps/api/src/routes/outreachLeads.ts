import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// REMOVED: Outreach Leads feature not implemented
router.get("/", requireAuth, async (_req, res) => {
  res.status(410).json({ 
    error: "Outreach Leads feature removed",
    message: "This feature is not yet implemented and has been removed.",
    alternative: "Use /api/outreach/records for outreach management"
  });
});

export default router;
