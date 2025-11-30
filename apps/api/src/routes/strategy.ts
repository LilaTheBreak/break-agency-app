import { Router } from "express";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/predictions", requireAuth, async (req, res) => {
  const preds = await prisma.brandCampaignPrediction.findMany({
    where: { userId: req.user!.id },
    orderBy: { likelihood: "desc" }
  });
  res.json({ predictions: preds });
});

router.get("/clusters", requireAuth, async (req, res) => {
  const clusters = await prisma.opportunityCluster.findMany({
    where: { userId: req.user!.id },
    orderBy: { score: "desc" }
  });
  res.json({ clusters });
});

export default router;
