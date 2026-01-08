import { Router, type Request, type Response } from "express";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { generateWellnessAI, calculateWorkload } from "../services/wellnessAI.js";

const router = Router();

router.use("/api/wellness", requireAuth);

/**
 * POST /api/wellness/check-in
 * Creates a new wellness check-in, generates an AI summary, and calculates a burnout risk score.
 */
router.post("/api/wellness/check-in", async (req: Request, res: Response) => {
  try {
    const { mood, stress, energy, journal } = req.body;
    if (!mood || !stress || !energy) {
      return res.status(400).json({ success: false, error: "Mood, stress, and energy are required." });
    }

    const workload = await calculateWorkload(req.user!.id);

    const ai = await generateWellnessAI({
      mood,
      stress,
      energy,
      workload,
      journal: journal ?? "",
    });

    const check = await prisma.wellnessCheck.create({
      data: {
        userId: req.user!.id,
        mood: parseInt(mood),
        stress: parseInt(stress),
        energy: parseInt(energy),
        workload,
        journal,
        aiSummary: ai.summary,
        burnoutRisk: ai.burnoutRisk,
      },
    });

    res.json({ success: true, data: { check } });
  } catch (e) {
    console.error("Wellness check-in failed:", e);
    res.status(500).json({ success: false, error: "Failed to process wellness check-in." });
  }
});

/**
 * GET /api/wellness/history?days=30
 * Fetches the wellness check-in history for the logged-in user.
 */
router.get("/api/wellness/history", async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const checks = await prisma.wellnessCheck.findMany({
      where: { userId: req.user!.id, createdAt: { gte: since } },
      orderBy: { createdAt: "asc" },
    });

    res.json({ success: true, data: { checks } });
  } catch (e) {
    console.error("Failed to fetch wellness history:", e);
    res.status(500).json({ success: false, error: "Failed to fetch wellness history." });
  }
});

/**
 * GET /api/wellness/insights
 * Fetches the aggregated wellness insights for the logged-in user.
 */
router.get("/api/wellness/insights", async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { talentId: true }
    });

    if (!user?.talentId) {
      return res.json({ success: true, data: { insight: null } });
    }

    const insight = await prisma.wellnessCheckin.findFirst({
      where: { creatorId: user.talentId },
      orderBy: { createdAt: "desc" }
    });

    res.json({ success: true, data: { insight } });
  } catch (e) {
    console.error("Failed to fetch wellness insights:", e);
    res.status(500).json({ success: false, error: "Failed to fetch wellness insights." });
  }
});

export default router;