import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { negotiationAutoPilotQueue } from '../worker/queues/negotiationAutoPilotQueue.js';

const router = Router();

/**
 * POST /api/negotiation/thread/:threadId/autopilot/start
 * Enables the auto-pilot for a negotiation thread.
 */
router.post('/thread/:threadId/autopilot/start', async (req, res) => {
  const { threadId } = req.params;
  // This would typically update a flag on the NegotiationThread model
  console.log(`[API] Starting auto-pilot for thread ${threadId}`);
  await negotiationAutoPilotQueue.add('start-autopilot', { threadId });
  res.json({ message: 'Negotiation auto-pilot started.' });
});

/**
 * POST /api/negotiation/thread/:threadId/autopilot/stop
 * Disables the auto-pilot for a negotiation thread.
 */
router.post('/thread/:threadId/autopilot/stop', async (req, res) => {
  const { threadId } = req.params;
  console.log(`[API] Stopping auto-pilot for thread ${threadId}`);
  res.json({ message: 'Negotiation auto-pilot stopped.' });
});

export default router;