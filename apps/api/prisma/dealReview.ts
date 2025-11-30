import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { dealReviewQueue } from '../worker/queues/dealReviewQueues.js';

const router = Router();

/**
 * POST /api/deals/:draftId/review
 * Triggers the full deal review pipeline.
 */
router.post('/deals/:draftId/review', async (req, res) => {
  // Assuming draftId can be used to find the dealThreadId
  const deal = await prisma.dealThread.findFirst({ where: { dealDraft: { id: req.params.draftId } } });
  if (!deal) return res.status(404).json({ error: 'Deal thread not found for this draft.' });

  await dealReviewQueue.add('start-deal-review', { dealThreadId: deal.id });
  res.status(202).json({ message: 'Full deal review has been queued.' });
});

/**
 * GET /api/compliance/:dealId
 * Fetches the latest compliance report for a deal.
 */
router.get('/compliance/:dealId', async (req, res, next) => {
  const report = await prisma.aIComplianceReport.findUnique({
    where: { dealThreadId: req.params.dealId },
  });
  res.json(report);
});

export default router;