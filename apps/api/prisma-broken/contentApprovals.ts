import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { contentFeedbackQueue } from '../worker/queues/contentFeedbackQueue.js';

const router = Router();

/**
 * POST /api/content/:itemId/feedback
 * Adds a new feedback comment to a content item.
 */
router.post('/:itemId/feedback', async (req, res, next) => {
  try {
    const { authorName, comment } = req.body;
    const feedback = await prisma.contentFeedback.create({
      data: { contentItemId: req.params.itemId, authorName, comment },
    });
    res.status(201).json(feedback);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/content/:itemId/approve
 * Records an approval for a content item.
 */
router.post('/:itemId/approve', async (req, res, next) => {
  try {
    const { actor, version } = req.body;
    const approval = await prisma.contentApproval.create({
      data: { contentItemId: req.params.itemId, actor, status: 'approved', version },
    });
    // Add logic here to advance the contentItem.status
    res.status(201).json(approval);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/content/:itemId/ai-revise
 * Triggers the AI revision pipeline.
 */
router.post('/:itemId/ai-revise', async (req, res) => {
  const { itemId } = req.params;
  await contentFeedbackQueue.add('apply-revisions', { contentItemId: itemId });
  res.status(202).json({ message: 'AI revision process has been queued.' });
});

export default router;