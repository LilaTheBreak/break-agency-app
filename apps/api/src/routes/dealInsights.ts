import { Router } from "express";
import { generateDealInsights } from "../services/dealInsights.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/:dealId", requireAuth, async (req, res, next) => {
  try {
    const { dealId } = req.params;
    const result = await generateDealInsights(dealId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
