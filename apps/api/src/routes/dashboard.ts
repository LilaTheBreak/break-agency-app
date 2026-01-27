import { Router, type Request, type Response } from "express";
import { requireAuth } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';
import { generateNextSteps } from '../services/ai/aiNextStepsService.js';

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
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // 1. COUNT TASKS DUE: All open/in_progress CrmTasks across all queues
    // Task statuses that are "open" or "in_progress"
    const userTasksDue = await prisma.crmTask.count({
      where: {
        status: {
          in: ["Pending", "In Progress", "Open", "Todo"]
        }
      }
    });
    console.log("[DASHBOARD] Tasks Due (open/in_progress):", userTasksDue);

    // 2. COUNT DUE TOMORROW: Tasks with dueDate within next 24 hours
    const userDueTomorrow = await prisma.crmTask.count({
      where: {
        dueDate: {
          gte: now,
          lte: tomorrow
        },
        status: {
          in: ["Pending", "In Progress", "Open", "Todo"]
        }
      }
    });
    console.log("[DASHBOARD] Due Tomorrow (24h window):", userDueTomorrow);

    // 3. COUNT PENDING APPROVALS: User signups + content approvals + campaign approvals
    const pendingUserApprovals = await prisma.user.count({
      where: {
        onboarding_status: "pending_review"
      }
    });

    const pendingContentApprovals = await prisma.approval.count({
      where: {
        status: "PENDING"
      }
    });

    const pendingApprovals = pendingUserApprovals + pendingContentApprovals;
    console.log("[DASHBOARD] Pending Approvals (users + content):", pendingApprovals, `(users: ${pendingUserApprovals}, content: ${pendingContentApprovals})`);

    // 4. COUNT CONTENT DUE: All unapproved deliverables
    const contentDue = await prisma.deliverable.count({
      where: {
        approvedAt: null
      }
    });
    console.log("[DASHBOARD] Content Due (unapproved deliverables):", contentDue);

    // 5. COUNT BRIEFS NEEDING REVIEW: Deals in CONTRACT_SENT stage
    const briefsReview = await prisma.deal.count({
      where: {
        stage: "CONTRACT_SENT"
      }
    });
    console.log("[DASHBOARD] Briefs Needing Review (stage=CONTRACT_SENT):", briefsReview);

    // 6. CALCULATE PAYOUTS PENDING: All payments with PENDING or AWAITING_RELEASE status
    const pendingPayments = await prisma.payment.findMany({
      where: {
        status: {
          in: ["PENDING", "AWAITING_RELEASE"]
        }
      },
      select: {
        amount: true,
        currency: true,
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
        currency: pendingPayments.length > 0 ? (pendingPayments[0].currency || pendingPayments[0].Deal?.currency || "usd") : "usd",
        mixedCurrencies: new Set(pendingPayments.map(p => (p.currency || p.Deal?.currency || "usd").toLowerCase())).size > 1
      }
    };
    console.log("[DASHBOARD] Payouts Pending:", payoutTotals.pending.amount, payoutTotals.pending.currency, `(count: ${payoutTotals.pending.count})`);

    // Count total active deals
    const totalDeals = await prisma.deal.count();

    // Generate AI-powered next steps based on current system state
    const nextSteps = await generateNextSteps({
      tasksDue: userTasksDue,
      dueTomorrow: userDueTomorrow,
      pendingApprovals,
      contentDue,
      briefsReview,
      totalDeals,
    });

    res.json({
      tasksDue: userTasksDue,
      dueTomorrow: userDueTomorrow,
      pendingApprovals,
      contentDue,
      briefsReview,
      payoutTotals,
      nextSteps,
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
