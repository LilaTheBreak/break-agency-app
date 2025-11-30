import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { deliverableExtractQueue } from '../worker/queues/deliverableQueues.js';

const router = Router();

/**
 * POST /api/deliverables/:id/ai-review
 * Triggers the full AI QA pipeline for a deliverable.
 */
router.post('/:id/ai-review', async (req, res) => {
  const { id } = req.params;
  // Enqueue the first job in the chain
  await deliverableExtractQueue.add('start-qa', { deliverableId: id });
  res.status(202).json({ message: 'Deliverable QA process has been started.' });
});

/**
 * GET /api/deliverables/:id/ai-report
 * Fetches the latest AI QA report for a deliverable.
 */
router.get('/:id/ai-report', async (req, res, next) => {
  try {
    const report = await prisma.deliverableQualityReport.findUnique({
      where: { deliverableId: req.params.id },
      include: { issues: true },
    });
    res.json(report);
  } catch (error) {
    next(error);
  }
});

export default router;