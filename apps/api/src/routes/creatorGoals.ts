import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import prisma from "../lib/prisma.js";
import { z } from "zod";

const router = Router();

// Validation schemas
const CreateGoalSchema = z.object({
  goalCategory: z.enum(["growth", "creative", "commercial", "personal", "wellbeing"]).default("growth"),
  goalType: z.string(),
  title: z.string().min(1),
  targetValue: z.number().optional(),
  targetUnit: z.string().optional(),
  timeframe: z.string().optional(),
  progress: z.number().min(0).max(1).default(0),
});

const UpdateGoalSchema = z.object({
  goalCategory: z.enum(["growth", "creative", "commercial", "personal", "wellbeing"]).optional(),
  goalType: z.string().optional(),
  title: z.string().min(1).optional(),
  targetValue: z.number().optional(),
  targetUnit: z.string().optional(),
  timeframe: z.string().optional(),
  progress: z.number().min(0).max(1).optional(),
  active: z.boolean().optional(),
});

// GET /api/creator-goals - Get all goals for the authenticated user
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

    const { active, category } = req.query;

    const where: any = { creatorId: talent.id };
    if (active !== undefined) {
      where.active = active === "true";
    }
    if (category) {
      where.goalCategory = category;
    }

    const goals = await prisma.creatorGoal.findMany({
      where,
      orderBy: [
        { active: "desc" },
        { createdAt: "desc" },
      ],
    });

    res.json(goals);
  } catch (error) {
    console.error("[creatorGoals] Error fetching goals:", error);
    res.status(500).json({ error: "Failed to fetch goals" });
  }
});

// GET /api/creator-goals/:id - Get a single goal by ID
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

    const goal = await prisma.creatorGoal.findFirst({
      where: {
        id: req.params.id,
        creatorId: talent.id,
      },
      include: {
        GoalVersions: {
          orderBy: { changedAt: "desc" },
          take: 10,
        },
      },
    });

    if (!goal) {
      return res.status(404).json({ error: "Goal not found" });
    }

    res.json(goal);
  } catch (error) {
    console.error("[creatorGoals] Error fetching goal:", error);
    res.status(500).json({ error: "Failed to fetch goal" });
  }
});

// POST /api/creator-goals - Create a new goal
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

    const parsed = CreateGoalSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
    }

    const goal = await prisma.creatorGoal.create({
      data: {
        ...parsed.data,
        creatorId: talent.id,
      },
    });

    // Create version history entry
    await prisma.creatorGoalVersion.create({
      data: {
        creatorGoalId: goal.id,
        snapshot: goal,
        changedBy: "creator",
        changeType: "created",
      },
    });

    res.status(201).json(goal);
  } catch (error) {
    console.error("[creatorGoals] Error creating goal:", error);
    res.status(500).json({ error: "Failed to create goal" });
  }
});

// PATCH /api/creator-goals/:id - Update a goal
router.patch("/:id", requireAuth, async (req: Request, res: Response) => {
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

    const parsed = UpdateGoalSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
    }

    // Verify ownership
    const existingGoal = await prisma.creatorGoal.findFirst({
      where: {
        id: req.params.id,
        creatorId: talent.id,
      },
    });

    if (!existingGoal) {
      return res.status(404).json({ error: "Goal not found" });
    }

    const goal = await prisma.creatorGoal.update({
      where: { id: req.params.id },
      data: {
        ...parsed.data,
        updatedAt: new Date(),
      },
    });

    // Create version history entry
    await prisma.creatorGoalVersion.create({
      data: {
        creatorGoalId: goal.id,
        snapshot: goal,
        changedBy: "creator",
        changeType: "updated",
      },
    });

    res.json(goal);
  } catch (error) {
    console.error("[creatorGoals] Error updating goal:", error);
    res.status(500).json({ error: "Failed to update goal" });
  }
});

// DELETE /api/creator-goals/:id - Delete a goal (soft delete by setting active=false)
router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
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

    // Verify ownership
    const existingGoal = await prisma.creatorGoal.findFirst({
      where: {
        id: req.params.id,
        creatorId: talent.id,
      },
    });

    if (!existingGoal) {
      return res.status(404).json({ error: "Goal not found" });
    }

    // Soft delete by setting active to false
    const goal = await prisma.creatorGoal.update({
      where: { id: req.params.id },
      data: {
        active: false,
        updatedAt: new Date(),
      },
    });

    // Create version history entry
    await prisma.creatorGoalVersion.create({
      data: {
        creatorGoalId: goal.id,
        snapshot: goal,
        changedBy: "creator",
        changeType: "archived",
      },
    });

    res.json({ success: true, goal });
  } catch (error) {
    console.error("[creatorGoals] Error deleting goal:", error);
    res.status(500).json({ error: "Failed to delete goal" });
  }
});

export default router;
