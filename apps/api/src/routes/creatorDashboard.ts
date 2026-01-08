import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import prisma from "../lib/prisma.js";

const router = Router();

router.get("/api/creator/dashboard", requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id;

  try {
    // These queries are illustrative and depend heavily on your final schema relationships.
    // They will need to be adjusted once the schema is finalized for these features.
    const [activeCampaigns, pendingTasks, revenueYTD] = await prisma.$transaction([
      prisma.brandCampaign.count({
        where: {
          // This requires a many-to-many relation between BrandCampaign and User/Talent
          // which does not currently exist. Placeholder logic:
          userId: userId,
          status: "ACTIVE",
        },
      }),
      prisma.creatorTask.count({
        where: {
          // Assuming CreatorTask model is linked to User
          // userId: userId,
          status: { not: "COMPLETED" },
        },
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          userId: userId,
          status: "completed",
          createdAt: { gte: new Date(new Date().getFullYear(), 0, 1) },
        },
      }),
    ]);

    const stats = {
      activeCampaigns: activeCampaigns || 0,
      pendingTasks: pendingTasks || 0,
      upcomingDeadlines: 0, // Placeholder, requires dueDate on a relevant model
      revenueYTD: revenueYTD._sum.amount || 0,
    };

    res.json({ success: true, data: { stats } });
  } catch (error) {
    console.error("Failed to load creator dashboard data:", error);
    res.status(500).json({ success: false, error: "Could not load creator dashboard data." });
  }
});

export default router;