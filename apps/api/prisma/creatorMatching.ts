import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { creatorMatchQueue } from '../worker/queues/creatorMatchQueue.js';

const router = Router();

/**
 * GET /api/campaign/:aiPlanId/matches
 * Fetches the ranked list of creator matches for a campaign plan.
 */
router.get('/campaign/:aiPlanId/matches', async (req, res, next) => {
  const { aiPlanId } = req.params;
  try {
    const matches = await prisma.creatorMatchResult.findMany({
      where: { aiPlanId },
      orderBy: { rank: 'asc' },
      include: { talent: { include: { user: true } } },
    });
    res.json(matches);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/campaign/:aiPlanId/matches/regenerate
 * Manually triggers the regeneration of the talent shortlist.
 */
router.post('/campaign/:aiPlanId/matches/regenerate', async (req, res) => {
  const { aiPlanId } = req.params;
  await creatorMatchQueue.add('regenerate-shortlist', { aiPlanId });
  res.status(202).json({ message: 'Talent shortlist regeneration has been queued.' });
});

// GET /api/campaign/match/:id would be similar, fetching a single CreatorMatchResult

export default router;