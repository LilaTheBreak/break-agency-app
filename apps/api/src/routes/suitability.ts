import { Router } from "express";
import {
  evaluateSuitability,
  getSuitabilityHistory,
  getSuitabilityResult,
  explainSuitability
} from '../controllers/suitabilityController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post("/score", requireAuth, evaluateSuitability);
router.get("/history", requireAuth, getSuitabilityHistory);
router.get("/result/:id", requireAuth, getSuitabilityResult);
router.get("/explain/:id", requireAuth, explainSuitability);

export default router;
