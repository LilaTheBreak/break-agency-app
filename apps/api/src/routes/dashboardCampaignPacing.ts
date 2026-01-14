import { Router, type Request, type Response } from "express";
import { requireAuth } from '../middleware/auth';
import prisma from '../lib/prisma';

const router = Router();

/**
 * GET /api/dashboard/campaign-pacing
 *
 * Returns campaign pacing data for active brand campaigns.
 * Used in admin dashboards for monitoring delivery progress.
 */
router.get("/campaign-pacing", requireAuth, async (req: Request, res: Response) => {
  try {
    const campaigns = await prisma.brandCampaign.findMany({
      where: {
        stage: "PLANNING",
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Placeholder response - BrandCampaign doesn't have deliverables relation
    const pacing = campaigns.map(c => ({
      id: c.id,
      title: c.title,
      totalDeliverables: 0,
      completedDeliverables: 0,
      progressPct: 0,
    }));

    res.json({ ok: true, data: pacing });
  } catch (err) {
    console.error("CAMPAIGN PACING ERROR:", err);
    res.status(500).json({ ok: false, error: "Failed to load campaign pacing" });
  }
});

export default router;
