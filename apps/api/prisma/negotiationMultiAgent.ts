import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { runMultiAgentNegotiation } from '../services/ai/aiMultiAgentService.js';

const router = Router();

/**
 * POST /api/negotiation/:dealDraftId/multi-agent-run
 * Triggers the full multi-agent negotiation pipeline.
 */
router.post('/:dealDraftId/multi-agent-run', async (req, res, next) => {
  try {
    const session = await runMultiAgentNegotiation(req.params.dealDraftId);
    res.status(201).json(session);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/negotiation/:sessionId/strategy
 * Fetches a negotiation session and its associated multi-agent strategy.
 */
router.get('/:sessionId/strategy', async (req, res) => {
  const session = await prisma.negotiationSession.findUnique({ where: { id: req.params.sessionId } });
  res.json(session);
});

export default router;