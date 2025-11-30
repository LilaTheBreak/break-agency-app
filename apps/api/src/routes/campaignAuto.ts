import { Router } from "express";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { generateAutoCampaignPlan } from "../services/campaignAutoPlanService.js";

const router = Router();

router.post("/generate", requireAuth, async (req, res, next) => {
  try {
    const { briefId, bundleId } = req.body ?? {};
    const plan = await generateAutoCampaignPlan({
      briefId,
      bundleId,
      createdBy: req.user!.id
    });
    res.json({ plan });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const plan = await prisma.campaignAutoPlan.findUnique({
      where: { id: req.params.id },
      include: {
        brief: true,
        CampaignTimelineItem: true,
        CampaignDeliverableAuto: true
      }
    });
    res.json({ plan });
  } catch (error) {
    next(error);
  }
});

export default router;
