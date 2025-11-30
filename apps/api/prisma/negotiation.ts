import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { runFullNegotiationAI } from '../services/ai/aiNegotiationService.js';

const router = Router();

/**
 * POST /api/negotiation/:dealDraftId/run
 * Manually triggers the full negotiation AI pipeline for a deal draft.
 */
router.post('/:dealDraftId/run', async (req, res, next) => {
  try {
    const session = await runFullNegotiationAI(req.params.dealDraftId);
    res.status(201).json(session);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/negotiation/:sessionId
 * Fetches a negotiation session and its associated AI strategy.
 */
router.get('/:sessionId', async (req, res) => {
  const session = await prisma.negotiationSession.findUnique({ where: { id: req.params.sessionId } });
  res.json(session);
});

export default router;