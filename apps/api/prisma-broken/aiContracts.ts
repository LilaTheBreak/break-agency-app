import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { contractDraftQueue } from '../worker/queues/contractDraftQueue.js';

const router = Router();

/**
 * GET /api/contracts/:aiPlanId
 * Fetches all AI-generated contract drafts for a campaign plan.
 */
router.get('/:aiPlanId', async (req, res, next) => {
  const { aiPlanId } = req.params;
  try {
    const drafts = await prisma.aIContractDraft.findMany({
      where: { aiPlanId },
      include: { talent: { include: { user: true } } },
    });
    res.json(drafts);
  } catch (error) {
    next(error);
  }
});

router.post('/:aiPlanId/generate', async (req, res) => {
  const { aiPlanId } = req.params;
  await contractDraftQueue.add('generate-contracts', { aiPlanId });
  res.status(202).json({ message: 'Contract generation has been queued.' });
});

export default router;