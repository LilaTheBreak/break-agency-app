import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/adminAuth.js";
import { calculateOutreachMetrics, calculatePipelineData } from "../services/outreach/metricsService.js";

const router = Router();

// GET /api/outreach/metrics/pipeline - Get outreach grouped by stage (Admin only)
router.get("/pipeline", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { owner, startDate, endDate } = req.query;
    
    const filter: any = {};
    if (owner) filter.owner = owner as string;
    if (startDate) filter.startDate = new Date(startDate as string);
    if (endDate) filter.endDate = new Date(endDate as string);

    const pipelineData = await calculatePipelineData(filter);
    
    return res.json(pipelineData);
  } catch (error) {
    console.error("[OUTREACH_PIPELINE] Error:", error);
    // Return safe defaults on error
    res.json({
      pipeline: [],
      summary: { total: 0, conversions: [] }
    });
  }
});

// GET /api/outreach/metrics - Get overall outreach metrics (Admin only)
router.get("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { owner, startDate, endDate } = req.query;
    
    const filter: any = {};
    if (owner) filter.owner = owner as string;
    if (startDate) filter.startDate = new Date(startDate as string);
    if (endDate) filter.endDate = new Date(endDate as string);

    const metrics = await calculateOutreachMetrics(filter);
    
    return res.json(metrics);
  } catch (error) {
    console.error("[OUTREACH_METRICS] Error:", error);
    // Return safe defaults on error
    res.json({
      totalOutreach: 0,
      withReplies: 0,
      responseRate: 0,
      opportunities: 0,
      deals: 0,
      conversionToOpportunity: 0,
      conversionToDeal: 0,
      emailStats: {
        totalSent: 0,
        totalReplies: 0,
        avgSentPerOutreach: 0,
        avgRepliesPerOutreach: 0
      }
    });
  }
});

export default router;
