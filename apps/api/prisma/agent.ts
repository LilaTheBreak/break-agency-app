import { Router } from 'express';
import { agentQueue } from '../worker/queues/agentQueue.js';

const router = Router();

/**
 * POST /api/agent/trigger
 * Manually triggers the agent orchestrator with a specific event.
 */
router.post('/trigger', async (req, res) => {
  const { eventType, payload } = req.body;
  await agentQueue.add('manual-trigger', { type: eventType, payload });
  res.status(202).json({ message: `Agent event '${eventType}' has been queued.` });
});

export default router;