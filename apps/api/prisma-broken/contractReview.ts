import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { contractReviewQueue } from '../worker/queues/contractReviewQueue.js';

const router = Router();

/**
 * POST /api/contract/review
 * Triggers the contract review pipeline.
 */
router.post('/review', async (req, res) => {
  const { contractReviewId } = req.body;
  // This assumes a file has been uploaded and a ContractReview record created.
  await contractReviewQueue.add('start-review', { contractReviewId });
  res.status(202).json({ message: 'AI contract review process has been queued.' });
});

/**
 * GET /api/contract/:id
 * Fetches the full analysis for a contract review.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const review = await prisma.contractReview.findUnique({ where: { id: req.params.id } });
    res.json(review);
  } catch (error) {
    next(error);
  }
});

export default router;