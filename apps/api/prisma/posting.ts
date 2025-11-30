import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { generateCaptions } from '../services/posting/captionGenerator.js';
import { queuePost } from '../services/posting/postingQueueService.js';

const router = Router();

/**
 * POST /api/deliverables/:id/ai/generate-captions
 * Generates a set of captions for a deliverable.
 */
router.post('/:id/ai/generate-captions', async (req, res, next) => {
  try {
    const { topic } = req.body;
    const { captions } = await generateCaptions(topic);
    await prisma.deliverableItem.update({ where: { id: req.params.id }, data: { aiCaptionDrafts: { captions } } });
    res.json({ captions });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/deliverables/:id/post/queue
 * Adds a deliverable to the posting queue.
 */
router.post('/:id/post/queue', async (req, res) => {
  await queuePost(req.params.id, req.body.platform, req.body.payload, req.body.scheduledFor);
  res.status(202).json({ message: 'Deliverable has been queued for posting.' });
});

export default router;