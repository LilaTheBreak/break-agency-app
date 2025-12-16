import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { runDealPrediction } from '../pipelines/dealPredictionPipeline.js';

const router = Router();

/**
 * GET /api/deals/:dealId/prediction
 * Fetches the latest prediction for a deal.
 */
router.get('/:dealId/prediction', async (req, res, next) => {
  const { dealId } = req.params;
  try {
    const prediction = await prisma.dealPrediction.findUnique({
      where: { dealId },
    });
    res.json(prediction);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/deals/:dealId/refresh-prediction
 * Manually triggers a refresh of the deal's prediction.
 */
router.post('/:dealId/refresh-prediction', async (req, res, next) => {
  const { dealId } = req.params;
  try {
    const prediction = await runDealPrediction(dealId);
    res.status(201).json(prediction);
  } catch (error) {
    next(error);
  }
});

export default router;