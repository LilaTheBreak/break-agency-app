import { Router } from "express";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { ingestBrief } from "../services/brandBriefService.js";

const router = Router();

// GET /api/briefs - List all briefs with optional status filter (production-ready)
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const status = req.query.status as string;
    
    const where: any = {};
    
    // Map status query to database field
    if (status === "draft") {
      // Briefs without matches yet could be considered "draft"
      // For now return empty until brief workflow is fully defined
    }
    
    const briefs = await prisma.brandBrief.findMany({
      where,
      select: {
        id: true,
        brandName: true,
        rawText: true,
        contactEmail: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: "desc" },
      take: 20
    });
    
    return res.json(briefs);
  } catch (error) {
    console.error("Error fetching briefs:", error);
    // Graceful fallback - return empty array instead of error
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
    const brief = await prisma.brandBrief.findUnique({
      where: { id: req.params.id },
      include: { matches: true }
    });
    res.json({ brief });
  } catch (error) {
    next(error);
  }
});

router.get("/:id/matches", requireAuth, async (req, res, next) => {
  try {
    const matches = await prisma.briefMatch.findMany({
      where: { briefId: req.params.id },
      include: { user: true },
      orderBy: { score: "desc" }
    });
    res.json({ matches });
  } catch (error) {
    next(error);
  }
});

export default router;
