import { Router } from "express";
import { buildCampaignFromDeal } from '../services/campaignBuilderService.js';

const router = Router();

router.post("/from-deal/:dealDraftId", async (req, res) => {
  try {
    const result = await buildCampaignFromDeal(req.params.dealDraftId);
    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Campaign build failed" });
  }
});

export default router;
