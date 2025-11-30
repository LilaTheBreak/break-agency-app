import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { deliverableQaQueue } from '../worker/queues/deliverableQaQueue.js';

const router = Router();

/**
 * POST /api/deliverable/:id/qa
 * Triggers the AI QA pipeline for a deliverable.
 */
router.post('/:id/qa', async (req, res) => {
  const { id } = req.params;
  await deliverableQaQueue.add('run-qa', { deliverableId: id });
  res.status(202).json({ message: 'Deliverable QA process has been queued.' });
});

/**
 * GET /api/deliverable/:id/qa
 * Fetches the latest QA report for a deliverable.
 */
router.get('/:id/qa', async (req, res, next) => {
  try {
    const deliverable = await prisma.deliverableItem.findUnique({ where: { id: req.params.id } });
    res.json(deliverable?.aiQaReport || null);
  } catch (error) {
    next(error);
  }
});

export default router;