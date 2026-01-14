import { Router, type Request, type Response } from "express";
import { requireAuth } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';
import { z } from "zod";

const router = Router();

// Validation schema
const CreateWellnessCheckinSchema = z.object({
  energyLevel: z.number().int().min(1).max(5),
  workload: z.enum(["light", "comfortable", "busy", "overwhelming"]),
  notes: z.string().optional(),
});

// GET /api/wellness-checkins - Get all wellness check-ins for the authenticated user
router.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Find the talent profile for this user
    const talent = await prisma.talent.findUnique({
      where: { userId },
    });

    if (!talent) {
      return res.status(404).json({ error: "Talent profile not found" });
    }

    const { limit, days } = req.query;

    const where: any = { creatorId: talent.id };
    
    // Filter by date range if specified
    if (days) {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(days as string));
      where.createdAt = { gte: daysAgo };
    }

    const checkins = await prisma.wellnessCheckin.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit ? parseInt(limit as string) : 30,
    });

    res.json(checkins);
  } catch (error) {
    console.error("[wellnessCheckins] Error fetching check-ins:", error);
    res.status(500).json({ error: "Failed to fetch wellness check-ins" });
  }
});

// GET /api/wellness-checkins/latest - Get the most recent check-in
router.get("/latest", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const talent = await prisma.talent.findUnique({
      where: { userId },
    });

    if (!talent) {
      return res.status(404).json({ error: "Talent profile not found" });
    }

    const checkin = await prisma.wellnessCheckin.findFirst({
      where: { creatorId: talent.id },
      orderBy: { createdAt: "desc" },
    });

    if (!checkin) {
      return res.json({ checkin: null, shouldShow: true });
    }

    // Calculate if a new check-in should be shown (7 days since last)
    const daysSinceLastCheckin = (Date.now() - checkin.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    const shouldShow = daysSinceLastCheckin >= 7;

    res.json({ 
      checkin,
      shouldShow,
      daysSinceLastCheckin: Math.floor(daysSinceLastCheckin)
    });
  } catch (error) {
    console.error("[wellnessCheckins] Error fetching latest check-in:", error);
    res.status(500).json({ error: "Failed to fetch latest check-in" });
  }
});

// GET /api/wellness-checkins/stats - Get wellness statistics
router.get("/stats", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const talent = await prisma.talent.findUnique({
      where: { userId },
    });

    if (!talent) {
      return res.status(404).json({ error: "Talent profile not found" });
    }

    const { days = 30 } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days as string));

    const checkins = await prisma.wellnessCheckin.findMany({
      where: {
        creatorId: talent.id,
        createdAt: { gte: daysAgo },
      },
      orderBy: { createdAt: "desc" },
    });

    if (checkins.length === 0) {
      return res.json({
        totalCheckins: 0,
        averageEnergyLevel: null,
        workloadDistribution: {},
        trend: null,
      });
    }

    // Calculate statistics
    const averageEnergyLevel = checkins.reduce((sum, c) => sum + c.energyLevel, 0) / checkins.length;
    
    const workloadDistribution = checkins.reduce((acc, c) => {
      acc[c.workload] = (acc[c.workload] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate trend (compare first half vs second half)
    const midpoint = Math.floor(checkins.length / 2);
    const recentAverage = checkins.slice(0, midpoint).reduce((sum, c) => sum + c.energyLevel, 0) / midpoint;
    const olderAverage = checkins.slice(midpoint).reduce((sum, c) => sum + c.energyLevel, 0) / (checkins.length - midpoint);
    const trend = recentAverage > olderAverage ? "improving" : recentAverage < olderAverage ? "declining" : "stable";

    res.json({
      totalCheckins: checkins.length,
      averageEnergyLevel: Math.round(averageEnergyLevel * 10) / 10,
      workloadDistribution,
      trend,
      periodDays: parseInt(days as string),
    });
  } catch (error) {
    console.error("[wellnessCheckins] Error fetching stats:", error);
    res.status(500).json({ error: "Failed to fetch wellness statistics" });
  }
});

// POST /api/wellness-checkins - Create a new wellness check-in
router.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const talent = await prisma.talent.findUnique({
      where: { userId },
    });

    if (!talent) {
      return res.status(404).json({ error: "Talent profile not found" });
    }

    const parsed = CreateWellnessCheckinSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
    }

    const checkin = await prisma.wellnessCheckin.create({
      data: {
        id: `wellness_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        creatorId: talent.id,
        energyLevel: parsed.data.energyLevel,
        workload: parsed.data.workload,
        notes: parsed.data.notes || null,
      },
    });

    res.status(201).json(checkin);
  } catch (error) {
    console.error("[wellnessCheckins] Error creating check-in:", error);
    res.status(500).json({ error: "Failed to create wellness check-in" });
  }
});

// GET /api/wellness-checkins/:id - Get a single check-in by ID
router.get("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const talent = await prisma.talent.findUnique({
      where: { userId },
    });

    if (!talent) {
      return res.status(404).json({ error: "Talent profile not found" });
    }

    const checkin = await prisma.wellnessCheckin.findFirst({
      where: {
        id: req.params.id,
        creatorId: talent.id,
      },
    });

    if (!checkin) {
      return res.status(404).json({ error: "Wellness check-in not found" });
    }

    res.json(checkin);
  } catch (error) {
    console.error("[wellnessCheckins] Error fetching check-in:", error);
    res.status(500).json({ error: "Failed to fetch wellness check-in" });
  }
});

export default router;
