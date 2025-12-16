import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { recalcNegotiationStrategy } from '../pipelines/strategyPipeline.js';

const router = Router();

/**
 * GET /api/deals/:id/strategy
 * Fetches the latest negotiation strategy for a deal.
 */
router.get('/deals/:id/strategy', async (req, res, next) => {
  const { id } = req.params;
  try {
    const strategy = await prisma.negotiationStrategy.findUnique({
      where: { dealId: id },
    });
    res.json(strategy);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/deals/:id/refresh-strategy
 * Manually triggers a recalculation of the negotiation strategy.
 */
router.post('/deals/:id/refresh-strategy', async (req, res, next) => {
  const { id } = req.params;
  try {
    const strategy = await recalcNegotiationStrategy(id);
    res.status(201).json(strategy);
  } catch (error) {
    next(error);
  }
});

export default router;