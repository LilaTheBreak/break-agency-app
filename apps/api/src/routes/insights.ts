import { Router } from "express";
import prisma from "../lib/prisma.js";
import { generateCreatorInsights } from "../services/insightService.js";

const router = Router();

router.get("/:userId", async (req, res) => {
  const data = await prisma.creatorInsights.findMany({
    where: { userId: req.params.userId },
    orderBy: { createdAt: "desc" },
    take: 20
  });
  res.json(data);
});

router.post("/:userId/generate", async (req, res) => {
  const data = await generateCreatorInsights(req.params.userId);
  res.json(data);
});

router.get("/:userId/weekly", async (req, res) => {
  const reports = await prisma.creatorWeeklyReport.findMany({
    where: { userId: req.params.userId },
    orderBy: { createdAt: "desc" },
    take: 12
  });
  res.json(reports);
});

export default router;
