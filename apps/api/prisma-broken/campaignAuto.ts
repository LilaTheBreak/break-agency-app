import { Router } from 'express';
import { generatePlan } from '../services/campaign/autoPlanService.js';

const router = Router();

/**
 * POST /api/campaign/:contractReviewId/generate-plan
 * Manually triggers the AI auto-planning pipeline for a signed contract.
 */
router.post('/:contractReviewId/generate-plan', async (req, res, next) => {
  try {
    const plan = await generatePlan(req.params.contractReviewId);
    res.status(201).json(plan);
  } catch (error) {
    next(error);
  }
});

export default router;