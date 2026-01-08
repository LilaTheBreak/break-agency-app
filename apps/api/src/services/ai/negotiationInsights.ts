import { Router } from 'express';
import { generateNegotiationInsights } from './negotiationEngine.js';
import prisma from '../../lib/prisma.js';

const router = Router();

/**
 * POST /ai/negotiation/generate
 * Triggers the generation of negotiation insights for a deal draft.
 */
router.post('/generate', async (req, res, next) => {
  const { draftId } = req.body;
  if (!draftId) {
    return res.status(400).json({ error: 'draftId is required.' });
  }

  try {
    // In a real app, this would likely be enqueued to a worker
    const insight = await generateNegotiationInsights(draftId);
    res.status(201).json(insight);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /ai/negotiation/:draftId
 * Fetches the latest negotiation insights for a given deal draft.
 */
router.get('/:draftId', async (req, res, next) => {
  const { draftId } = req.params;
  try {
    const insight = await prisma.negotiationInsight.findFirst({
      where: { dealId: draftId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(insight);
  } catch (error) {
    next(error);
  }
});

export default router;