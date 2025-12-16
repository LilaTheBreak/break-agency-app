import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { generatePlanForDeal } from '../services/ai/aiDeliverableGeneratorService.js';

const router = Router();

/**
 * POST /api/deliverables/generate
 * Triggers the AI deliverable plan generation for a deal draft.
 */
router.post('/generate', async (req, res, next) => {
  const { dealDraftId } = req.body;
  try {
    const updatedDraft = await generatePlanForDeal(dealDraftId);
    res.status(201).json(updatedDraft);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/deal-drafts/:id/ai-plan
 * Fetches the AI-generated plan for a deal draft.
 */
router.get('/deal-drafts/:id/ai-plan', async (req, res) => {
  const draft = await prisma.dealDraft.findUnique({ where: { id: req.params.id } });
  res.json(draft);
});

export default router;