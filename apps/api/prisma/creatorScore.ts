import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { creatorScoreMarketFitQueue } from '../worker/queues/creatorScoreQueues.js';

const router = Router();

/**
 * POST /api/creators/:id/score/recalculate
 * Manually triggers a score recalculation for a creator.
 */
router.post('/:id/score/recalculate', async (req, res) => {
  const { id } = req.params; // This should be the Talent ID
  await creatorScoreMarketFitQueue.add('manual-recalc', { talentId: id });
  res.status(202).json({ message: 'Creator score recalculation has been queued.' });
});

/**
 * GET /api/creators/:id/score
 * Fetches the latest score for a creator.
 */
router.get('/:id/score', async (req, res, next) => {
  const { id } = req.params; // This should be the Talent ID
  try {
    const score = await prisma.creatorScore.findUnique({ where: { talentId: id } });
    res.json(score);
  } catch (error) {
    next(error);
  }
});

export default router;