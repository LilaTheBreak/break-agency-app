import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { qaQueue } from '../worker/queues/qaQueue.js';

const router = Router();

/**
 * POST /api/qa/review/:deliverableId
 * Triggers the AI QA pipeline for a deliverable.
 */
router.post('/review/:deliverableId', async (req, res) => {
  const { deliverableId } = req.params;
  await qaQueue.add('run-qa-review', { deliverableId });
  res.status(202).json({ message: 'Deliverable QA review has been queued.' });
});

/**
 * GET /api/qa/:deliverableId/latest-review
 * Fetches the latest QA report for a deliverable.
 */
router.get('/:deliverableId/latest-review', async (req, res, next) => {
  try {
    const deliverable = await prisma.deliverableItem.findUnique({ where: { id: req.params.deliverableId } });
    res.json(deliverable?.aiQaReport || null);
  } catch (error) {
    next(error);
  }
});

export default router;