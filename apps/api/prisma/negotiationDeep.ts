import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { negotiationDeepQueue } from '../worker/queues/negotiationDeepQueue.js';

const router = Router();

/**
 * POST /api/negotiation/:emailId/analyze
 * Triggers the deep negotiation analysis pipeline.
 */
router.post('/:emailId/analyze', async (req, res) => {
  const { emailId } = req.params;
  await negotiationDeepQueue.add('analyze-email', { emailId });
  res.status(202).json({ message: 'AI deep negotiation analysis has been queued.' });
});

/**
 * GET /api/negotiation/thread/:threadId
 * Fetches the full history and latest AI insights for a negotiation thread.
 */
router.get('/thread/:threadId', async (req, res, next) => {
  try {
    const thread = await prisma.negotiationThread.findUnique({
      where: { id: req.params.threadId },
      include: { messages: { orderBy: { createdAt: 'asc' } }, session: true },
    });
    res.json(thread);
  } catch (error) {
    next(error);
  }
});

export default router;