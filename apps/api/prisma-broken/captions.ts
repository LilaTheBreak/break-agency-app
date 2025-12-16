import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { captionQueue } from '../worker/queues/captionQueue.js';

const router = Router();

/**
 * POST /api/concepts/:id/captions/generate
 * Triggers the AI caption generation pipeline for a concept.
 */
router.post('/:id/captions/generate', async (req, res) => {
  const { id } = req.params;
  const { platform } = req.body;
  await captionQueue.add('generate-captions', { conceptId: id, platform });
  res.status(202).json({ message: 'AI caption generation has been queued.' });
});

/**
 * GET /api/concepts/:id/captions
 * Fetches all generated captions for a creative concept.
 */
router.get('/:id/captions', async (req, res, next) => {
  try {
    const captions = await prisma.creativeCaption.findMany({ where: { conceptId: req.params.id }, orderBy: { createdAt: 'desc' } });
    res.json(captions);
  } catch (error) {
    next(error);
  }
});

export default router;