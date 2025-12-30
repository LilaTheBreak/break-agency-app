import { Router } from "express";
import prisma from "../lib/prisma.js";
import { generateCreatorInsights } from "../services/insightService.js";

const router = Router();

router.get("/:userId", async (req, res) => {
  // Use existing CreatorInsight model (singular, not plural)
  const data = await prisma.creatorInsight.findMany({
    where: { creatorId: req.params.userId },
    orderBy: { createdAt: "desc" },
    take: 20
  });
  res.json(data);
});

router.post("/:userId/generate", async (req, res) => {
  const data = await generateCreatorInsights(req.params.userId);
  res.json(data);
});

router.get("/:userId/weekly", async (_req, res) => {
  // REMOVED: Weekly reports feature not implemented - CreatorWeeklyReport model does not exist
  res.status(410).json({ 
    error: "Weekly reports feature removed",
    message: "This feature is not yet implemented. CreatorWeeklyReport model does not exist in database schema.",
    alternative: "Use /api/insights/:userId for creator insights"
  });
});

export default router;
