/**
 * Growth Initiatives Controller
 * 
 * Strategic initiatives for talent growth: inputs, outputs, performance, impact
 */

import { Request, Response } from "express";
import { z } from "zod";

// Validation schemas
const createInitiativeSchema = z.object({
  talentId: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  platforms: z.array(z.string()).optional(),
  objective: z.string().optional(),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()).optional(),
  monthlyBudget: z.number().optional(),
  totalBudget: z.number().optional(),
  owner: z.enum(["agent", "talent", "both"]).default("both"),
});

const updateInitiativeSchema = createInitiativeSchema.partial().omit({ talentId: true });

const createInputSchema = z.object({
  initiativeId: z.string(),
  type: z.enum(["contributor", "paid_tool", "time_investment", "one_off_cost"]),
  name: z.string().min(1),
  contributorUserId: z.string().optional(),
  costMonthly: z.number().optional(),
  costOneOff: z.number().optional(),
  startDate: z.string().or(z.date()).optional(),
  endDate: z.string().or(z.date()).optional(),
  notes: z.string().optional(),
});

const createOutputSchema = z.object({
  initiativeId: z.string(),
  platform: z.enum(["LinkedIn", "Instagram", "Press", "Other"]),
  format: z.enum(["post", "video", "article", "profile_change", "outreach"]),
  contributorUserId: z.string().optional(),
  title: z.string().optional(),
  url: z.string().optional(),
  publishedAt: z.string().or(z.date()).optional(),
  notes: z.string().optional(),
});

const createPerformanceSchema = z.object({
  initiativeId: z.string(),
  totalViews: z.number().optional(),
  avgEngagement: z.number().optional(),
  followerGrowth: z.number().optional(),
  profileVisits: z.number().optional(),
  inboundMessages: z.number().optional(),
  brandEnquiries: z.number().optional(),
  speakingInvites: z.number().optional(),
  periodStart: z.string().or(z.date()),
  periodEnd: z.string().or(z.date()),
  notes: z.string().optional(),
});

const createBusinessImpactSchema = z.object({
  initiativeId: z.string(),
  dealsInfluencedIds: z.array(z.string()).optional(),
  inboundLeads: z.number().optional(),
  brandCategoriesUnlocked: z.array(z.string()).optional(),
  avgDealValueChangePct: z.number().optional(),
  agentNotes: z.string().optional(),
});

/**
 * Get all initiatives for a talent
 */
export async function getInitiativesHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { talentId } = req.query;
    
    if (!talentId || typeof talentId !== 'string') {
      res.status(400).json({ error: "talentId is required" });
      return;
    }

    const prisma = (await import("../lib/prisma.js")).default;
    const initiatives = await prisma.growthInitiative.findMany({
      where: { talentId },
      include: {
        inputs: true,
        outputs: true,
        performance: true,
        businessImpacts: true,
        createdByUser: { select: { id: true, email: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(initiatives);
  } catch (error) {
    console.error("[Get Initiatives]", error);
    res.status(500).json({ error: "Failed to fetch initiatives" });
  }
}

/**
 * Get single initiative
 */
export async function getInitiativeHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const prisma = (await import("../lib/prisma.js")).default;

    const initiative = await prisma.growthInitiative.findUnique({
      where: { id },
      include: {
        inputs: { include: { contributor: { select: { id: true, email: true, name: true } } } },
        outputs: { include: { contributor: { select: { id: true, email: true, name: true } } } },
        performance: true,
        businessImpacts: true,
        createdByUser: { select: { id: true, email: true, name: true } },
      },
    });

    if (!initiative) {
      res.status(404).json({ error: "Initiative not found" });
      return;
    }

    res.json(initiative);
  } catch (error) {
    console.error("[Get Initiative]", error);
    res.status(500).json({ error: "Failed to fetch initiative" });
  }
}

/**
 * Create new initiative
 */
export async function createInitiativeHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const validation = createInitiativeSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: validation.error.issues });
      return;
    }

    const { talentId, name, description, platforms, objective, startDate, endDate, monthlyBudget, totalBudget, owner } = validation.data;
    const prisma = (await import("../lib/prisma.js")).default;

    const initiative = await prisma.growthInitiative.create({
      data: {
        talentId,
        name,
        description,
        platforms: platforms || [],
        objective,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        monthlyBudget,
        totalBudget,
        owner,
        createdByUserId: user.id,
      },
      include: {
        createdByUser: { select: { id: true, email: true, name: true } },
      },
    });

    res.status(201).json(initiative);
  } catch (error) {
    console.error("[Create Initiative]", error);
    res.status(500).json({ error: "Failed to create initiative" });
  }
}

/**
 * Update initiative
 */
export async function updateInitiativeHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const validation = updateInitiativeSchema.safeParse(req.body);
    
    if (!validation.success) {
      res.status(400).json({ error: validation.error.issues });
      return;
    }

    const prisma = (await import("../lib/prisma.js")).default;
    
    const initiative = await prisma.growthInitiative.update({
      where: { id },
      data: {
        ...validation.data,
        startDate: validation.data.startDate ? new Date(validation.data.startDate) : undefined,
        endDate: validation.data.endDate ? new Date(validation.data.endDate) : undefined,
      },
      include: {
        createdByUser: { select: { id: true, email: true, name: true } },
      },
    });

    res.json(initiative);
  } catch (error) {
    console.error("[Update Initiative]", error);
    res.status(500).json({ error: "Failed to update initiative" });
  }
}

/**
 * Add input to initiative
 */
export async function addInputHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const validation = createInputSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: validation.error.issues });
      return;
    }

    const prisma = (await import("../lib/prisma.js")).default;

    const input = await prisma.growthInput.create({
      data: {
        ...validation.data,
        startDate: validation.data.startDate ? new Date(validation.data.startDate) : null,
        endDate: validation.data.endDate ? new Date(validation.data.endDate) : null,
      },
      include: {
        contributor: { select: { id: true, email: true, name: true } },
      },
    });

    res.status(201).json(input);
  } catch (error) {
    console.error("[Add Input]", error);
    res.status(500).json({ error: "Failed to add input" });
  }
}

/**
 * Add output to initiative
 */
export async function addOutputHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const validation = createOutputSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: validation.error.issues });
      return;
    }

    const prisma = (await import("../lib/prisma.js")).default;

    const output = await prisma.growthOutput.create({
      data: {
        ...validation.data,
        publishedAt: validation.data.publishedAt ? new Date(validation.data.publishedAt) : null,
      },
      include: {
        contributor: { select: { id: true, email: true, name: true } },
      },
    });

    res.status(201).json(output);
  } catch (error) {
    console.error("[Add Output]", error);
    res.status(500).json({ error: "Failed to add output" });
  }
}

/**
 * Add performance data to initiative
 */
export async function addPerformanceHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const validation = createPerformanceSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: validation.error.issues });
      return;
    }

    const prisma = (await import("../lib/prisma.js")).default;

    const performance = await prisma.growthPerformance.create({
      data: {
        ...validation.data,
        periodStart: new Date(validation.data.periodStart),
        periodEnd: new Date(validation.data.periodEnd),
      },
    });

    res.json(performance);
  } catch (error) {
    console.error("[Add Performance]", error);
    res.status(500).json({ error: "Failed to add performance data" });
  }
}

/**
 * Add business impact to initiative
 */
export async function addBusinessImpactHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const validation = createBusinessImpactSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: validation.error.issues });
      return;
    }

    const prisma = (await import("../lib/prisma.js")).default;

    const impact = await prisma.businessImpact.create({
      data: validation.data,
    });

    res.json(impact);
  } catch (error) {
    console.error("[Add Business Impact]", error);
    res.status(500).json({ error: "Failed to add business impact" });
  }
}

/**
 * Get cost rollup for an initiative
 */
export async function getInitiativeCostHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const prisma = (await import("../lib/prisma.js")).default;

    const inputs = await prisma.growthInput.findMany({
      where: { initiativeId: id },
    });

    const monthlyCost = inputs.reduce((sum, input) => sum + (input.costMonthly || 0), 0);
    const oneOffCost = inputs.reduce((sum, input) => sum + (input.costOneOff || 0), 0);
    const totalCost = monthlyCost + oneOffCost;

    res.json({
      monthlyCost,
      oneOffCost,
      totalCost,
      inputsCount: inputs.length,
    });
  } catch (error) {
    console.error("[Get Initiative Cost]", error);
    res.status(500).json({ error: "Failed to fetch cost" });
  }
}

/**
 * Get all initiatives across all talent (admin dashboard)
 */
export async function getAllInitiativesHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const prisma = (await import("../lib/prisma.js")).default;

    const initiatives = await prisma.growthInitiative.findMany({
      include: {
        talent: { select: { id: true, name: true } },
        inputs: true,
        outputs: true,
        performance: true,
        businessImpacts: true,
        createdByUser: { select: { id: true, email: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(initiatives);
  } catch (error) {
    console.error("[Get All Initiatives]", error);
    res.status(500).json({ error: "Failed to fetch initiatives" });
  }
}
