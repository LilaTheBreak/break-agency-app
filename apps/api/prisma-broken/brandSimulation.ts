import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { runBrandSimulation } from '../services/ai/aiBrandSimulatorService.js';

const router = Router();

/**
 * POST /api/negotiation/:dealDraftId/simulate-brand
 * Triggers the brand simulation pipeline.
 */
router.post('/:dealDraftId/simulate-brand', async (req, res, next) => {
  try {
    const session = await runBrandSimulation(req.params.dealDraftId);
    res.status(201).json(session);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/negotiation/:sessionId/brand-simulation
 * Fetches the results of a brand simulation from a negotiation session.
 */
router.get('/:sessionId/brand-simulation', async (req, res) => {
  const session = await prisma.negotiationSession.findUnique({ where: { id: req.params.sessionId } });
  res.json(session);
});

export default router;