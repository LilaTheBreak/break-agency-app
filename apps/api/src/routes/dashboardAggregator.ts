import { Router, type Request, type Response } from "express";
import { requireAuth } from '../middleware/auth';
import prisma from '../lib/prisma';
import { logError } from '../lib/logger';

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
          stage: { not: "LOST" } // Deal model uses stage enum, not status
        },
        select: {
          id: true,
          brandName: true, // Deal model uses brandName, not dealName
          stage: true, // Deal model uses stage, not status
          value: true, // Deal model uses value, not estimatedValue
          expectedClose: true // Deal model uses expectedClose, not expectedCloseDate
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
          status: { not: "fully_signed" }
          // Contract model doesn't have userId, filter by Deal.userId if needed
        },
        select: {
          id: true,
          title: true, // Contract model uses title, not contractName
          status: true,
          dealId: true,
          createdAt: true,
          updatedAt: true
        },
        take: 10,
        orderBy: { createdAt: "desc" }
      })
    ]);

    // Transform deals for backward compatibility
    const transformedDeals = deals.map(d => ({
      ...d,
      dealName: d.brandName,
      status: d.stage,
      estimatedValue: d.value,
      expectedCloseDate: d.expectedClose,
    }));

    // Transform contracts for backward compatibility
    const transformedContracts = contracts.map(c => ({
      ...c,
      contractName: c.title,
      startDate: null, // Contract model doesn't have startDate
      endDate: null, // Contract model doesn't have endDate
    }));

    // Calculate summary metrics
    const totalDealValue = transformedDeals.reduce((sum, d) => sum + (d.estimatedValue || 0), 0);
    const activeCampaigns = campaigns.length;
    const pendingTasks = tasks.length;
    const pendingContracts = transformedContracts.length;

    res.json({
      success: true,
      summary: {
        totalDealValue,
        activeCampaigns,
        pendingTasks,
        pendingContracts
      },
      deals: transformedDeals.slice(0, 5),
      campaigns: campaigns.slice(0, 5),
      tasks: tasks.slice(0, 5),
      contracts: transformedContracts.slice(0, 5),
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
