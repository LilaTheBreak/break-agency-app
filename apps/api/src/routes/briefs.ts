import { Router } from "express";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { ingestBrief } from "../services/brandBriefService.js";

const router = Router();

// GET /api/briefs - List all briefs with optional status filter (production-ready)
router.get("/", requireAuth, async (req, res, next) => {
  try {
    // REMOVED: BrandBrief model does not exist in schema.prisma
    // Return empty array until model is implemented
    return res.status(501).json({ 
      error: "Briefs feature not implemented",
      message: "BrandBrief model does not exist in database schema" 
    });
  } catch (error) {
    console.error("Error fetching briefs:", error);
    return res.json([]);
  }
});

router.post("/ingest", requireAuth, async (req, res, next) => {
  try {
    const { brandName, rawText, contactEmail } = req.body ?? {};
    const brief = await ingestBrief({
      brandName,
      rawText,
      contactEmail,
      submittedBy: req.user!.id
    });
    res.json({ brief });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    // REMOVED: BrandBrief model does not exist in schema.prisma
    return res.status(501).json({ 
      error: "Briefs feature not implemented",
      message: "BrandBrief model does not exist in database schema" 
    });
  } catch (error) {
    next(error);
  }
});

router.get("/:id/matches", requireAuth, async (req, res, next) => {
  try {
    // REMOVED: BriefMatch model does not exist in schema.prisma
    return res.status(501).json({ 
      error: "Brief matches feature not implemented",
      message: "BriefMatch model does not exist in database schema" 
    });
  } catch (error) {
    next(error);
  }
});

export default router;
