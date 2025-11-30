import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { negotiationV2Queue } from '../worker/queues/negotiationV2Queue.js';

const router = Router();

/**
 * POST /api/negotiation/:threadId/strategy
 * Triggers the full v2 negotiation pipeline.
 */
router.post('/:threadId/strategy', async (req, res) => {
  const { threadId } = req.params;
  await negotiationV2Queue.add('generate-strategy', { threadId });
  res.status(202).json({ message: 'AI negotiation strategy generation has been queued.' });
});

/**
 * GET /api/negotiation/:threadId/status
 * Fetches the latest strategy and simulation data for a thread.
 */
router.get('/:threadId/status', async (req, res, next) => {
  // This would fetch from the NegotiationSession model
  const session = await prisma.negotiationSession.findFirst({
    where: { messages: { some: { threadId: req.params.threadId } } },
  });
  res.json({ strategy: session?.strategy, simulation: session?.simulation });
});

export default router;