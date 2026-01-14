import { Router, type Request, type Response } from "express";
import { requireAuth } from '../middleware/auth';
import prisma from '../lib/prisma';

const router = Router();

// GET /api/dashboard/creators/active - Get count of onboarded creators (public endpoint for homepage)
router.get("/creators/active", async (req: Request, res: Response) => {
  try {
    // Count all users with creator roles, regardless of onboarding status
    // This includes: CREATOR, EXCLUSIVE_TALENT, UGC
    const count = await prisma.user.count({
      where: {
        role: {
          in: ["CREATOR", "EXCLUSIVE_TALENT", "UGC"]
        }
      }
    });
    
    res.json({ count });
  } catch (error) {
    console.error("[ACTIVE_CREATORS] Error:", error);
    res.status(500).json({ error: "Failed to fetch active creators count" });
  }
});

// GET /api/dashboard/campaigns/live - Get count of live campaigns
router.get("/campaigns/live", requireAuth, async (req: Request, res: Response) => {
  try {
    const count = await prisma.deal.count({
      where: {
        campaignLiveAt: {
          not: null
        }
      }
    });
    
    res.json({ count });
  } catch (error) {
    console.error("[LIVE_CAMPAIGNS] Error:", error);
    res.status(500).json({ error: "Failed to fetch live campaigns count" });
  }
});

// GET /api/dashboard/briefs/pending - Get count of deliverables awaiting approval
router.get("/briefs/pending", requireAuth, async (req: Request, res: Response) => {
  try {
    const count = await prisma.deliverable.count({
      where: {
        approvedAt: null,
        dueAt: {
          not: null
        }
      }
    });
    
    res.json({ count });
  } catch (error) {
    console.error("[PENDING_BRIEFS] Error:", error);
    res.status(500).json({ error: "Failed to fetch pending briefs count" });
  }
});

// Tasks will be fetched from database once Task model is implemented

router.get("/stats", requireAuth, async (req: Request, res: Response) => {
  try {
    // TODO: Implement real task counting once Task model is added to schema
    const userTasksDue = 0;
    const userDueTomorrow = 0;

    // Count pending user approvals (users awaiting onboarding approval)
    const pendingApprovals = await prisma.user.count({
      where: {
        onboarding_status: "pending_review"
      }
    });

    // Count all deliverables not yet approved as "content due"
    const contentDue = await prisma.deliverable.count({
      where: {
        approvedAt: null
      }
    });

    // Count deals in contract sent stage as "briefs needing review"
    const briefsReview = await prisma.deal.count({
      where: {
        stage: "CONTRACT_SENT"
      }
    });

    // Calculate pending payouts
    const pendingPayments = await prisma.payment.findMany({
      where: {
        status: "PENDING"
      },
      select: {
        amount: true,
        Deal: {
          select: {
            currency: true
          }
        }
      }
    });

    const payoutTotals = {
      pending: {
        amount: pendingPayments.reduce((sum, p) => sum + p.amount, 0),
        count: pendingPayments.length,
        currency: "usd",
        mixedCurrencies: new Set(pendingPayments.map(p => p.Deal.currency.toLowerCase())).size > 1
      }
    };

    res.json({
      tasksDue: userTasksDue,
      dueTomorrow: userDueTomorrow,
      pendingApprovals,
      contentDue,
      briefsReview,
      payoutTotals,
      nextSteps: [
        "Review overdue deliverables and follow up with creators",
        "Check pending user approvals in the admin panel",
        "Monitor deals approaching proposal stage"
      ]
    });
  } catch (error) {
    console.error("[DASHBOARD_STATS] Error:", error);
    res.status(500).json({
      ok: false,
      error: "Failed to fetch dashboard stats"
    });
  }
});

export default router;
