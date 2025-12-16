import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import prisma from "../lib/prisma.js";

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
        status: "ACTIVE",
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        deliverables: {
          select: {
            id: true,
            status: true,
            // Removed invalid dueDate
            // Add any REAL fields from your schema later
          },
        },
      },
    });

    const pacing = campaigns.map(c => ({
      id: c.id,
      title: c.title,
      totalDeliverables: c.deliverables.length,
      completedDeliverables: c.deliverables.filter(d => d.status === "COMPLETED").length,
      progressPct:
        c.deliverables.length === 0
          ? 0
          : Math.round(
              (c.deliverables.filter(d => d.status === "COMPLETED").length /
                c.deliverables.length) *
                100
            ),
    }));

    res.json({ ok: true, data: pacing });
  } catch (err) {
    console.error("CAMPAIGN PACING ERROR:", err);
    res.status(500).json({ ok: false, error: "Failed to load campaign pacing" });
  }
});

export default router;
