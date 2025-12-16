import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { aiNegotiationQueue } from '../worker/queues/aiNegotiationQueue.js';

const router = Router();

/**
 * POST /api/negotiation/:sessionId/handle-reply
 * Manually triggers the real-time engine to process a new reply.
 */
router.post('/:sessionId/handle-reply', async (req, res) => {
  const { sessionId } = req.params;
  const { brandReplyBody } = req.body;
  await aiNegotiationQueue.add('handle-brand-reply', { sessionId, brandReplyBody });
  res.status(202).json({ message: 'Brand reply is being processed by the AI.' });
});

/**
 * GET /api/negotiation/:sessionId/live-state
 * Fetches the latest adaptive state of a negotiation session.
 */
router.get('/:sessionId/live-state', async (req, res) => {
  const session = await prisma.negotiationSession.findUnique({
    where: { id: req.params.sessionId },
    select: { aiLastBrandIntent: true, aiLastBrandFee: true, aiAutoCounter: true, aiAdaptiveState: true },
  });
  res.json(session);
});

export default router;