import { Router } from "express";
import { prisma } from "../utils/prismaClient.js";
import {
  requireCreator,
  attachCreatorProfile,
  formatSafeRevenue,
  sanitizeDealForCreator,
  sanitizeTaskForCreator,
  sanitizeEventForCreator,
} from "../middleware/creatorAuth.js";
import { createGoalVersion } from "../utils/goalUtils.js";

const router = Router();

// Apply creator authentication to all routes
router.use(requireCreator);
router.use(attachCreatorProfile);

// Overview snapshot
router.get("/overview", async (req, res) => {
  try {
    const creator = (req as any).creator;
    const [activeDeals, opportunities, tasks, events, insights, payouts, goals, socialAccounts] = await Promise.allSettled([
      prisma.deal.findMany({ where: { talentId: creator.id, stage: { in: ["CONTRACT_SIGNED", "DELIVERABLES_IN_PROGRESS", "PAYMENT_PENDING"] } }, include: { Brand: true }, take: 10 }),
      prisma.opportunity.findMany({ where: { isActive: true }, orderBy: { createdAt: "desc" }, take: 5 }),
      prisma.creatorTask.findMany({ where: { creatorId: creator.id, status: { in: ["pending", "in_progress"] }, taskType: { in: ["creative", "attendance", "review", "approval"] } }, orderBy: { dueAt: "asc" }, take: 10, include: { Deal: { select: { brandName: true } } } }),
      prisma.creatorEvent.findMany({ where: { creatorId: creator.id, startAt: { gte: new Date() }, status: { in: ["invited", "accepted", "suggested"] } }, orderBy: { startAt: "asc" }, take: 10 }),
      prisma.creatorInsight.findMany({ where: { creatorId: creator.id, OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }] }, orderBy: [{ priority: "desc" }, { createdAt: "desc" }], take: 5 }),
      prisma.payout.findMany({ where: { creatorId: creator.id, status: { in: ["completed", "pending"] } }, select: { amount: true, status: true, paidAt: true } }),
      prisma.creatorGoal.findMany({ where: { creatorId: creator.id, active: true }, orderBy: { createdAt: "desc" }, take: 5 }),
      prisma.socialAccountConnection.findMany({ where: { creatorId: creator.id }, select: { id: true, platform: true, handle: true, connected: true, lastSyncedAt: true } }),
    ]);

    // Phase 1: Removed SAFE_DEFAULTS - return proper error if any query fails
    if (activeDeals.status === "rejected") {
      throw new Error(`Failed to load deals: ${activeDeals.reason}`);
    }
    if (opportunities.status === "rejected") {
      throw new Error(`Failed to load opportunities: ${opportunities.reason}`);
    }
    if (tasks.status === "rejected") {
      throw new Error(`Failed to load tasks: ${tasks.reason}`);
    }
    if (events.status === "rejected") {
      throw new Error(`Failed to load events: ${events.reason}`);
    }
    if (insights.status === "rejected") {
      throw new Error(`Failed to load insights: ${insights.reason}`);
    }
    if (goals.status === "rejected") {
      throw new Error(`Failed to load goals: ${goals.reason}`);
    }
    if (socialAccounts.status === "rejected") {
      throw new Error(`Failed to load social accounts: ${socialAccounts.reason}`);
    }

    const projects = activeDeals.status === "fulfilled" ? activeDeals.value.map(sanitizeDealForCreator) : [];
    const opportunitiesList = opportunities.status === "fulfilled" ? opportunities.value : [];
    const tasksList = tasks.status === "fulfilled" ? tasks.value.map(sanitizeTaskForCreator).filter(Boolean) : [];
    const eventsList = events.status === "fulfilled" ? events.value.map(sanitizeEventForCreator) : [];
    const insightsList = insights.status === "fulfilled" ? insights.value : [];
    const goalsList = goals.status === "fulfilled" ? goals.value : [];
    const socialsList = socialAccounts.status === "fulfilled" ? socialAccounts.value : [];

    let revenueSummary = {
      totalEarned: "£0",
      potentialRevenue: "£0",
      trend: "flat",
      rawTotal: 0,
      rawPotential: 0
    };
    if (payouts.status === "fulfilled") {
      const completed = payouts.value.filter((p) => p.status === "completed");
      const pending = payouts.value.filter((p) => p.status === "pending");
      const totalEarned = completed.reduce((sum, p) => sum + p.amount, 0);
      const potentialRevenue = pending.reduce((sum, p) => sum + p.amount, 0);
      revenueSummary = {
        totalEarned: formatSafeRevenue(totalEarned),
        potentialRevenue: formatSafeRevenue(potentialRevenue),
        trend: totalEarned > 0 ? "up" : "flat",
        rawTotal: totalEarned,
        rawPotential: potentialRevenue,
      };
    }

    const isFirstTime = projects.length === 0 && tasksList.length === 0 && eventsList.length === 0;

    res.json({
      isFirstTime,
      activeProjectsCount: projects.length,
      projects: projects.slice(0, 3),
      opportunities: opportunitiesList.slice(0, 3),
      tasks: tasksList,
      events: eventsList,
      insights: insightsList,
      revenue: revenueSummary,
      goals: goalsList,
      socials: socialsList,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Creator overview error:", error);
    // Phase 1: Return proper error response instead of hiding failures
    res.status(500).json({ 
      error: "Failed to load creator overview",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Onboarding
router.get("/onboarding-status", async (req, res) => {
  try {
    const user = (req as any).user;
    res.json({ completed: user.onboardingComplete === true });
  } catch (error) {
    res.json({ completed: false });
  }
});

router.post("/onboarding-complete", async (req, res) => {
  try {
    const user = (req as any).user;
    await prisma.user.update({ where: { id: user.id }, data: { onboardingComplete: true } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to complete onboarding" });
  }
});

// Projects
router.get("/projects", async (req, res) => {
  try {
    const creator = (req as any).creator;
    const deals = await prisma.deal.findMany({ where: { talentId: creator.id, stage: { notIn: ["LOST", "COMPLETED"] } }, include: { Brand: true }, orderBy: { updatedAt: "desc" } });
    res.json(deals.map(sanitizeDealForCreator));
  } catch (error) {
    console.error("Creator projects error:", error);
    res.status(500).json({ 
      error: "Failed to load projects",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Opportunities
router.get("/opportunities", async (req, res) => {
  try {
    const opportunities = await prisma.opportunity.findMany({ where: { isActive: true }, orderBy: { createdAt: "desc" }, take: 20 });
    res.json(opportunities);
  } catch (error) {
    console.error("Creator opportunities error:", error);
    res.status(500).json({ 
      error: "Failed to load opportunities",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Tasks
router.get("/tasks", async (req, res) => {
  try {
    const creator = (req as any).creator;
    const tasks = await prisma.creatorTask.findMany({ where: { creatorId: creator.id, status: { notIn: ["completed", "cancelled"] }, taskType: { in: ["creative", "attendance", "review", "approval"] } }, include: { Deal: { select: { brandName: true } } }, orderBy: [{ priority: "desc" }, { dueAt: "asc" }] });
    res.json(tasks.map(sanitizeTaskForCreator).filter(Boolean));
  } catch (error) {
    console.error("Creator tasks error:", error);
    res.status(500).json({ 
      error: "Failed to load tasks",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

router.patch("/tasks/:id/complete", async (req, res) => {
  try {
    const creator = (req as any).creator;
    const { id } = req.params;
    const task = await prisma.creatorTask.findFirst({ where: { id, creatorId: creator.id } });
    if (!task) return res.status(404).json({ error: "Task not found" });
    const updated = await prisma.creatorTask.update({ where: { id }, data: { status: "completed", completedAt: new Date() } });
    res.json(sanitizeTaskForCreator(updated));
  } catch (error) {
    res.status(500).json({ error: "Failed to complete task" });
  }
});

// Events
router.get("/events", async (req, res) => {
  try {
    const creator = (req as any).creator;
    const events = await prisma.creatorEvent.findMany({ where: { creatorId: creator.id, startAt: { gte: new Date() } }, orderBy: { startAt: "asc" } });
    res.json(events.map(sanitizeEventForCreator));
  } catch (error) {
    console.error("Creator events error:", error);
    res.status(500).json({ 
      error: "Failed to load events",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

router.post("/events/:id/accept", async (req, res) => {
  try {
    const creator = (req as any).creator;
    const { id } = req.params;
    const event = await prisma.creatorEvent.findFirst({ where: { id, creatorId: creator.id } });
    if (!event) return res.status(404).json({ error: "Event not found" });
    const updated = await prisma.creatorEvent.update({ where: { id }, data: { status: "accepted" } });
    console.log(`✅ Creator accepted event: ${event.eventName}`);
    res.json({ success: true, message: "We've let your agent know you've accepted", event: sanitizeEventForCreator(updated) });
  } catch (error) {
    res.status(500).json({ error: "Failed to accept event" });
  }
});

router.post("/events/:id/decline", async (req, res) => {
  try {
    const creator = (req as any).creator;
    const { id } = req.params;
    const { reason } = req.body;
    const event = await prisma.creatorEvent.findFirst({ where: { id, creatorId: creator.id } });
    if (!event) return res.status(404).json({ error: "Event not found" });
    const updated = await prisma.creatorEvent.update({ where: { id }, data: { status: "declined", declineReason: reason || null } });
    console.log(`❌ Creator declined event: ${event.eventName}`, reason);
    res.json({ success: true, message: "We've let your agent know", event: sanitizeEventForCreator(updated) });
  } catch (error) {
    res.status(500).json({ error: "Failed to decline event" });
  }
});

// Calendar preview
router.get("/calendar/preview", async (req, res) => {
  try {
    const creator = (req as any).creator;
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const events = await prisma.creatorEvent.findMany({ where: { creatorId: creator.id, startAt: { gte: now, lte: nextWeek }, status: { in: ["accepted", "invited"] } }, orderBy: { startAt: "asc" }, take: 7 });
    res.json(events.map(sanitizeEventForCreator));
  } catch (error) {
    console.error("Creator calendar preview error:", error);
    res.status(500).json({ 
      error: "Failed to load calendar preview",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Insights
router.get("/insights", async (req, res) => {
  try {
    const creator = (req as any).creator;
    const limit = Math.min(parseInt((req.query.limit as string) || "10", 10) || 10, 50);
    const sinceRaw = (req.query.since as string) || "";
    const insightType = (req.query.insightType as string) || "";
    const since = sinceRaw ? new Date(sinceRaw) : null;

    const insights = await prisma.creatorInsight.findMany({
      where: {
        creatorId: creator.id,
        ...(insightType ? { insightType } : {}),
        ...(since && !Number.isNaN(since.getTime()) ? { createdAt: { gte: since } } : {}),
        OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }]
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: limit
    });
    res.json(insights);
  } catch (error) {
    console.error("Creator insights error:", error);
    res.status(500).json({ 
      error: "Failed to load insights",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

router.patch("/insights/:id/mark-read", async (req, res) => {
  try {
    const creator = (req as any).creator;
    const { id } = req.params;
    const insight = await prisma.creatorInsight.findFirst({ where: { id, creatorId: creator.id } });
    if (!insight) return res.status(404).json({ error: "Insight not found" });
    const updated = await prisma.creatorInsight.update({ where: { id }, data: { isRead: true } });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Failed to mark insight as read" });
  }
});

// Revenue
router.get("/revenue/summary", async (req, res) => {
  try {
    const creator = (req as any).creator;
    const days = Math.min(parseInt((req.query.days as string) || "30", 10) || 30, 365);
    const payouts = await prisma.payout.findMany({ where: { creatorId: creator.id }, select: { amount: true, status: true, paidAt: true, createdAt: true } });
    const completed = payouts.filter((p) => p.status === "completed");
    const pending = payouts.filter((p) => p.status === "pending");
    const totalEarned = completed.reduce((sum, p) => sum + p.amount, 0);
    const potentialRevenue = pending.reduce((sum, p) => sum + p.amount, 0);
    const now = new Date();
    const recentStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const previousStart = new Date(now.getTime() - days * 2 * 24 * 60 * 60 * 1000);
    const recent = completed.filter((p) => p.paidAt && new Date(p.paidAt) >= recentStart);
    const previous = completed.filter((p) => p.paidAt && new Date(p.paidAt) >= previousStart && new Date(p.paidAt) < recentStart);
    const recentTotal = recent.reduce((sum, p) => sum + p.amount, 0);
    const previousTotal = previous.reduce((sum, p) => sum + p.amount, 0);
    let trend = "flat";
    if (recentTotal > previousTotal * 1.1) trend = "up";
    else if (recentTotal < previousTotal * 0.9) trend = "down";
    res.json({ totalEarned: formatSafeRevenue(totalEarned), potentialRevenue: formatSafeRevenue(potentialRevenue), trend, rawTotal: totalEarned, rawPotential: potentialRevenue, agentMessage: "Managed by your agent. Questions? Just ask." });
  } catch (error) {
    console.error("Creator revenue summary error:", error);
    res.status(500).json({ 
      error: "Failed to load revenue summary",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Goals
router.get("/goals", async (req, res) => {
  try {
    const creator = (req as any).creator;
    const goals = await prisma.creatorGoal.findMany({ where: { creatorId: creator.id, active: true }, orderBy: { createdAt: "desc" } });
    res.json(goals);
  } catch (error) {
    console.error("Creator goals error:", error);
    res.status(500).json({ 
      error: "Failed to load goals",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

router.post("/goals", async (req, res) => {
  try {
    const creator = (req as any).creator;
    const { goalType, goalCategory, title, targetValue, targetUnit, timeframe } = req.body;
    if (!goalType || !title) return res.status(400).json({ error: "Goal type and title required" });
    
    const goal = await prisma.creatorGoal.create({ 
      data: { 
        id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        creatorId: creator.id, 
        goalCategory: goalCategory || "growth",
        goalType, 
        title, 
        targetValue: targetValue || null, 
        targetUnit: targetUnit || null,
        timeframe: timeframe || null, 
        active: true, 
        progress: 0,
        updatedAt: new Date()
      } 
    });

    // Create version snapshot
    await createGoalVersion(goal.id, goal as any, "created", "creator");

    res.json(goal);
  } catch (error) {
    res.status(500).json({ error: "Failed to create goal" });
  }
});

router.patch("/goals/:id", async (req, res) => {
  try {
    const creator = (req as any).creator;
    const { id } = req.params;
    const { goalCategory, title, targetValue, targetUnit, timeframe, progress, active } = req.body;
    const goal = await prisma.creatorGoal.findFirst({ where: { id, creatorId: creator.id } });
    if (!goal) return res.status(404).json({ error: "Goal not found" });

    const updated = await prisma.creatorGoal.update({ 
      where: { id }, 
      data: { 
        ...(goalCategory !== undefined && { goalCategory }),
        ...(title !== undefined && { title }), 
        ...(targetValue !== undefined && { targetValue }), 
        ...(targetUnit !== undefined && { targetUnit }),
        ...(timeframe !== undefined && { timeframe }), 
        ...(progress !== undefined && { progress }), 
        ...(active !== undefined && { active }) 
      } 
    });

    // Create version snapshot
    await createGoalVersion(updated.id, updated as any, "updated", "creator");

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Failed to update goal" });
  }
});

router.delete("/goals/:id", async (req, res) => {
  try {
    const creator = (req as any).creator;
    const { id } = req.params;
    const goal = await prisma.creatorGoal.findFirst({ where: { id, creatorId: creator.id } });
    if (!goal) return res.status(404).json({ error: "Goal not found" });
    
    const updated = await prisma.creatorGoal.update({ where: { id }, data: { active: false } });
    
    // Create version snapshot
    await createGoalVersion(updated.id, updated as any, "archived", "creator");

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete goal" });
  }
});

// Explicit archive endpoint (clearer UX than DELETE)
router.post("/goals/:id/archive", async (req, res) => {
  try {
    const creator = (req as any).creator;
    const { id } = req.params;
    const { reason } = req.body;
    
    const goal = await prisma.creatorGoal.findFirst({ where: { id, creatorId: creator.id } });
    if (!goal) return res.status(404).json({ error: "Goal not found" });
    
    const updated = await prisma.creatorGoal.update({ 
      where: { id }, 
      data: { active: false } 
    });

    // Create version snapshot with optional reason
    const snapshot = { ...updated, archiveReason: reason || null } as any;
    await createGoalVersion(updated.id, snapshot, "archived", "creator");

    res.json({ 
      success: true, 
      goal: updated,
      message: "Goal archived successfully" 
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to archive goal" });
  }
});

// Social accounts
router.get("/socials", async (req, res) => {
  try {
    const creator = (req as any).creator;
    const socials = await prisma.socialAccountConnection.findMany({ where: { creatorId: creator.id }, select: { id: true, platform: true, handle: true, connected: true, lastSyncedAt: true, createdAt: true } });
    res.json(socials);
  } catch (error) {
    console.error("Creator socials error:", error);
    res.status(500).json({ 
      error: "Failed to load social accounts",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

router.post("/socials/connect", async (req, res) => {
  try {
    const creator = (req as any).creator;
    const { platform, handle } = req.body;
    if (!platform || !handle) return res.status(400).json({ error: "Platform and handle required" });
    const existing = await prisma.socialAccountConnection.findUnique({ where: { creatorId_platform: { creatorId: creator.id, platform } } });
    if (existing) {
      const updated = await prisma.socialAccountConnection.update({ where: { id: existing.id }, data: { handle, connected: true } });
      return res.json(updated);
    }
    const social = await prisma.socialAccountConnection.create({ 
      data: { 
        id: `social_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        creatorId: creator.id, 
        platform, 
        handle, 
        connected: true,
        updatedAt: new Date()
      } 
    });
    res.json(social);
  } catch (error) {
    res.status(500).json({ error: "Failed to connect social account" });
  }
});

router.post("/socials/disconnect", async (req, res) => {
  try {
    const creator = (req as any).creator;
    const { platform } = req.body;
    if (!platform) return res.status(400).json({ error: "Platform required" });
    const social = await prisma.socialAccountConnection.findUnique({ where: { creatorId_platform: { creatorId: creator.id, platform } } });
    if (!social) return res.status(404).json({ error: "Social account not found" });
    await prisma.socialAccountConnection.update({ where: { id: social.id }, data: { connected: false } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to disconnect social account" });
  }
});

// Wellness
router.post("/wellness-checkin", async (req, res) => {
  try {
    const creator = (req as any).creator;
    const { energyLevel, workload, notes } = req.body;
    if (!energyLevel || !workload) return res.status(400).json({ error: "Energy level and workload required" });
    const checkin = await prisma.wellnessCheckin.create({ 
      data: { 
        id: `checkin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        creatorId: creator.id, 
        energyLevel: parseInt(energyLevel), 
        workload, 
        notes: notes || null 
      } 
    });
    res.json(checkin);
  } catch (error) {
    res.status(500).json({ error: "Failed to save check-in" });
  }
});

router.get("/wellness-history", async (req, res) => {
  try {
    const creator = (req as any).creator;
    const limit = parseInt(req.query.limit as string) || 10;
    const history = await prisma.wellnessCheckin.findMany({ where: { creatorId: creator.id }, orderBy: { createdAt: "desc" }, take: limit });
    res.json(history);
  } catch (error) {
    // Phase 4: Fail loudly - no empty arrays on error
    console.error("Error fetching wellness history:", error);
    res.status(500).json({ 
      error: "Failed to fetch wellness history",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// AI assistant
router.post("/ai/ask", async (req, res) => {
  try {
    const creator = (req as any).creator;
    const { prompt, category } = req.body;
    if (!prompt) return res.status(400).json({ error: "Prompt required" });
    const response = "I'm your creative assistant. This feature will be available soon!";
    const history = await prisma.aIPromptHistory.create({ 
      data: { 
        id: `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        creatorId: creator.id, 
        prompt, 
        response, 
        category: category || "general" 
      } 
    });
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: "Failed to process AI request" });
  }
});

router.get("/ai/history", async (req, res) => {
  try {
    const creator = (req as any).creator;
    const limit = parseInt(req.query.limit as string) || 20;
    const history = await prisma.aIPromptHistory.findMany({ where: { creatorId: creator.id }, orderBy: { createdAt: "desc" }, take: limit });
    res.json(history);
  } catch (error) {
    console.error("Creator AI history error:", error);
    res.status(500).json({ 
      error: "Failed to load AI history",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;
