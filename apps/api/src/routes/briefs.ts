import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// REMOVED: Briefs feature not implemented - BrandBrief and BriefMatch models do not exist
// All endpoints return 410 Gone to indicate feature was removed
// Use /api/opportunities instead for opportunity/brief management

router.get("/", requireAuth, async (_req, res) => {
  res.status(410).json({ 
    error: "Briefs feature removed",
    message: "This feature is not available. Use /api/opportunities instead.",
    alternative: "/api/opportunities"
  });
});

router.post("/ingest", requireAuth, async (_req, res) => {
  res.status(410).json({ 
    error: "Briefs feature removed",
    message: "This feature is not available. Use /api/opportunities instead.",
    alternative: "/api/opportunities"
  });
});

router.get("/:id", requireAuth, async (_req, res) => {
  res.status(410).json({ 
    error: "Briefs feature removed",
    message: "This feature is not available. Use /api/opportunities instead.",
    alternative: "/api/opportunities"
  });
});

router.get("/:id/matches", requireAuth, async (_req, res) => {
  res.status(410).json({ 
    error: "Briefs feature removed",
    message: "This feature is not available. Use /api/opportunities instead.",
    alternative: "/api/opportunities"
  });
});

export default router;
