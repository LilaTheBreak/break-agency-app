import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import prisma from "../lib/prisma.js";
import { logError } from "../lib/logger.js";

const router = Router();

// Phase 5: Feature flag check
const checkDashboardAggregationEnabled = (req: Request, res: Response, next: Function) => {
  const enabled = process.env.DASHBOARD_AGGREGATION_ENABLED === "true";
  if (!enabled) {
    return res.status(503).json({
      error: "Dashboard aggregation feature is disabled",
      message: "This feature is currently disabled. Contact an administrator to enable it.",
      code: "FEATURE_DISABLED"
    });
  }
  next();
};

router.get("/api/dashboard/aggregate", requireAuth, checkDashboardAggregationEnabled, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Phase 5: Rebuild aggregation using existing entities (no removed models)
    const [deals, campaigns, tasks, contracts] = await Promise.all([
      // Active deals
      prisma.deal.findMany({
        where: {
          ...(userRole !== 'ADMIN' && userRole !== 'SUPERADMIN' ? { userId } : {}),
          status: { not: "Closed Lost" }
        },
        select: {
          id: true,
          dealName: true,
          status: true,
          estimatedValue: true,
          expectedCloseDate: true
        },
        take: 10,
        orderBy: { createdAt: "desc" }
      }),

      // Active campaigns
      prisma.crmCampaign.findMany({
        where: {
          ...(userRole !== 'ADMIN' && userRole !== 'SUPERADMIN' ? { owner: userId } : {}),
          status: { not: "Completed" }
        },
        select: {
          id: true,
          campaignName: true,
          status: true,
          startDate: true,
          endDate: true
        },
        take: 10,
        orderBy: { createdAt: "desc" }
      }),

      // Pending tasks
      prisma.crmTask.findMany({
        where: {
          ...(userRole !== 'ADMIN' && userRole !== 'SUPERADMIN' ? { owner: userId } : {}),
          status: { not: "Completed" }
        },
        select: {
          id: true,
          title: true,
          status: true,
          dueDate: true,
          priority: true
        },
        take: 10,
        orderBy: { dueDate: "asc" }
      }),

      // Pending contracts
      prisma.contract.findMany({
        where: {
          ...(userRole !== 'ADMIN' && userRole !== 'SUPERADMIN' ? { userId } : {}),
          status: { not: "fully_signed" }
        },
        select: {
          id: true,
          contractName: true,
          status: true,
          startDate: true,
          endDate: true
        },
        take: 10,
        orderBy: { createdAt: "desc" }
      })
    ]);

    // Calculate summary metrics
    const totalDealValue = deals.reduce((sum, d) => sum + (d.estimatedValue || 0), 0);
    const activeCampaigns = campaigns.length;
    const pendingTasks = tasks.length;
    const pendingContracts = contracts.length;

    res.json({
      success: true,
      summary: {
        totalDealValue,
        activeCampaigns,
        pendingTasks,
        pendingContracts
      },
      deals: deals.slice(0, 5),
      campaigns: campaigns.slice(0, 5),
      tasks: tasks.slice(0, 5),
      contracts: contracts.slice(0, 5),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logError("Failed to aggregate dashboard data", error, { userId: req.user?.id });
    res.status(500).json({
      success: false,
      error: "Failed to aggregate dashboard data",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;
