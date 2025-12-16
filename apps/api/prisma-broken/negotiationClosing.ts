import { Router } from 'express';
import { negotiationExtractQueue } from '../worker/queues/negotiationClosingQueues.js';

const router = Router();

/**
 * POST /api/negotiation/:sessionId/ai/draft
 * Triggers the AI negotiation pipeline to generate a draft reply.
 */
router.post('/:sessionId/ai/draft', async (req, res) => {
  const { sessionId } = req.params;
  // The worker logic would be updated to respect a `draftOnly` flag
  await negotiationExtractQueue.add('draft-reply', { sessionId, draftOnly: true });
  res.status(202).json({ message: 'AI draft generation has been queued.' });
});

/**
 * POST /api/negotiation/:sessionId/ai/send
 * Approves the latest AI suggestion and sends it.
 */
router.post('/:sessionId/ai/send', async (req, res) => {
  const { sessionId } = req.params;
  // In a real app, this would find the latest `NegotiationDecision`
  // and enqueue it in the `negotiationSendQueue`.
  console.log(`Sending approved reply for session ${sessionId}`);
  res.json({ message: 'AI reply has been sent.' });
});

export default router;