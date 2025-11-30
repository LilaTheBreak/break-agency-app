import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { reviewDraft } from '../services/ai/aiContentReviewService.js';

const router = Router();

/**
 * POST /api/deliverables/:id/review-draft
 * Triggers the AI draft review pipeline for a deliverable.
 */
router.post('/:id/review-draft', async (req, res, next) => {
  try {
    const deliverable = await reviewDraft(req.params.id);
    res.status(201).json(deliverable);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/deliverables/:id/review
 * Fetches the AI-generated review for a deliverable.
 */
router.get('/:id/review', async (req, res) => {
  const deliverable = await prisma.deliverableItem.findUnique({ where: { id: req.params.id } });
  res.json(deliverable);
});

export default router;