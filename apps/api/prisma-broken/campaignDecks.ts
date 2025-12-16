import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { campaignDeckQueue } from '../worker/queues/campaignDeckQueue.js';

const router = Router();

/**
 * POST /api/campaign/decks/:aiPlanId
 * Manually triggers the generation of a campaign deck.
 */
router.post('/:aiPlanId', async (req, res) => {
  const { aiPlanId } = req.params;
  await campaignDeckQueue.add('generate-deck', { aiPlanId });
  res.status(202).json({ message: 'Campaign deck generation has been queued.' });
});

/**
 * GET /api/campaign/decks/:aiPlanId
 * Fetches the latest generated deck for a campaign plan.
 */
router.get('/:aiPlanId', async (req, res, next) => {
  const { aiPlanId } = req.params;
  try {
    const deck = await prisma.campaignDeck.findUnique({
      where: { aiPlanId },
    });
    res.json(deck);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/campaign/decks/:id/regenerate
 * A stub for regenerating a deck.
 */
router.post('/:id/regenerate', async (req, res) => {
  // This would re-enqueue the generation job.
  res.status(202).json({ message: 'Deck regeneration has been queued.' });
});

export default router;