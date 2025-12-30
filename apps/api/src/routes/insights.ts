import { Router } from "express";
import prisma from "../lib/prisma.js";
import { generateCreatorInsights } from "../services/insightService.js";
import { requireAuth } from "../middleware/auth.js";
import { logError } from "../lib/logger.js";

const router = Router();

router.get("/:userId", async (req, res) => {
  // Use existing CreatorInsight model (singular, not plural)
  const data = await prisma.creatorInsight.findMany({
    where: { creatorId: req.params.userId },
    orderBy: { createdAt: "desc" },
    take: 20
  });
  res.json(data);
});

router.post("/:userId/generate", async (req, res) => {
  const data = await generateCreatorInsights(req.params.userId);
  res.json(data);
});

/**
 * GET /api/insights/:userId/weekly
 * Phase 5: Weekly reports re-enabled with CreatorWeeklyReport model
 */
router.get("/:userId/weekly", requireAuth, async (req, res) => {
  try {
    const enabled = process.env.WEEKLY_REPORTS_ENABLED === "true";
    if (!enabled) {
      return res.status(503).json({
        error: "Weekly reports feature is disabled",
        message: "This feature is currently disabled. Contact an administrator to enable it.",
        code: "FEATURE_DISABLED"
      });
    }

    const { userId } = req.params;
    const { weekStartDate } = req.query;

    // If weekStartDate provided, get specific week
    // Otherwise, get most recent week
    if (weekStartDate) {
      const startDate = new Date(weekStartDate as string);
      const report = await prisma.creatorWeeklyReport.findUnique({
        where: {
          creatorId_weekStartDate: {
            creatorId: userId,
            weekStartDate: startDate
          }
        }
      });

      if (!report) {
        return res.status(404).json({ 
          error: "Weekly report not found for this week" 
        });
      }

      return res.json({ report });
    }

    // Get most recent report
    const report = await prisma.creatorWeeklyReport.findFirst({
      where: { creatorId: userId },
      orderBy: { weekStartDate: "desc" }
    });

    if (!report) {
      return res.json({ 
        report: null,
        message: "No weekly reports available yet"
      });
    }

    res.json({ report });
  } catch (error) {
    logError("Failed to fetch weekly report", error, { userId: req.params.userId });
    res.status(500).json({ 
      error: "Failed to fetch weekly report",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;
