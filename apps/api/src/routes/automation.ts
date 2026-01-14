import { Router } from "express";
import { runDealAutomation } from '../services/dealAutomation';
import { requireAdmin } from '../middleware/requireAdmin';

const router = Router();

router.post("/deal-automation/run", requireAdmin, async (_req, res, next) => {
  try {
    const result = await runDealAutomation();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
