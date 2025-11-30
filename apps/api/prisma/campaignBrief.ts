import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { campaignBriefQueue } from '../worker/queues/campaignBriefQueue.js';

const router = Router();

/**
 * POST /api/campaign/auto-brief/:dealDraftId
 * Triggers the generation of an AI campaign brief.
 */
router.post('/auto-brief/:dealDraftId', async (req, res) => {
  const { dealDraftId } = req.params;
  await campaignBriefQueue.add('generate-brief', { dealDraftId });
  res.status(202).json({ message: 'AI brief generation has been queued.' });
});

/**
 * GET /api/campaign/auto-brief/:dealDraftId
 * Fetches the latest AI-generated campaign brief for a deal draft.
 */
router.get('/auto-brief/:dealDraftId', async (req, res, next) => {
  const { dealDraftId } = req.params;
  try {
    const plan = await prisma.campaignAIPlan.findUnique({
      where: { dealDraftId },
    });
    res.json(plan);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/campaign/auto-brief/:id/regenerate
 * A stub for regenerating a brief.
 */
router.post('/auto-brief/:id/regenerate', async (req, res) => {
  // This would re-enqueue the generation job.
  res.status(202).json({ message: 'Regeneration has been queued.' });
});

export default router;