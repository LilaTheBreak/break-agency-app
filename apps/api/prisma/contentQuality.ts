import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { contentInputQueue } from '../worker/queues/contentQualityQueues.js';

const router = Router();

/**
 * POST /api/content/:deliverableId/analyse
 * Triggers the quality analysis pipeline for a deliverable.
 */
router.post('/:deliverableId/analyse', async (req, res) => {
  const { deliverableId } = req.params;
  await contentInputQueue.add('analyse-content', { deliverableId });
  res.status(202).json({ message: 'Content quality analysis has been queued.' });
});

/**
 * GET /api/content/:deliverableId/quality
 * Fetches the latest quality analysis for a deliverable.
 */
router.get('/:deliverableId/quality', async (req, res, next) => {
  try {
    const quality = await prisma.contentQuality.findUnique({
      where: { deliverableId: req.params.deliverableId },
      include: { hookSuggestions: true },
    });
    res.json(quality);
  } catch (error) {
    next(error);
  }
});

export default router;