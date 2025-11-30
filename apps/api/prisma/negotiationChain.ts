import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { saveNegotiationState, loadNegotiationState } from '../services/negotiation/strategyMemory.js';
import { aiNegotiationChainQueue } from '../worker/queues/aiNegotiationQueues.js';

const router = Router();

/**
 * POST /api/threads/:id/chain/start
 * Starts or resumes the autonomous negotiation for a thread.
 */
router.post('/threads/:id/chain/start', async (req, res, next) => {
  const { id } = req.params;
  try {
    const state = await loadNegotiationState(id);
    await saveNegotiationState(id, { ...state, status: 'running' });
    // Immediately trigger a run
    await aiNegotiationChainQueue.add('start-chain', { threadId: id });
    res.json({ message: 'Negotiation chain started.' });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/threads/:id/chain/pause
 * Pauses the autonomous negotiation for a thread.
 */
router.post('/threads/:id/chain/pause', async (req, res, next) => {
  const { id } = req.params;
  try {
    const state = await loadNegotiationState(id);
    await saveNegotiationState(id, { ...state, status: 'paused' });
    res.json({ message: 'Negotiation chain paused.' });
  } catch (error) {
    next(error);
  }
});

// Add GET /api/threads/:id/chain/state route here...

export default router;