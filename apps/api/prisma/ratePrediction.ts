import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { predictRateCurve } from '../services/ai/aiRatePredictionService.js';

const router = Router();

/**
 * POST /api/negotiation/:sessionId/predict-rate
 * Triggers the AI rate prediction pipeline for a session.
 */
router.post('/:sessionId/predict-rate', async (req, res, next) => {
  try {
    const session = await predictRateCurve(req.params.sessionId);
    res.status(201).json(session);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/negotiation/:sessionId/rate-prediction
 * Fetches the latest rate prediction data for a session.
 */
router.get('/:sessionId/rate-prediction', async (req, res) => {
  const session = await prisma.negotiationSession.findUnique({ where: { id: req.params.sessionId } });
  res.json(session);
});

export default router;