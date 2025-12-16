import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { generateBriefForDeliverable } from '../services/ai/aiContentBriefService.js';

const router = Router();

/**
 * POST /api/deliverables/:id/ai-brief
 * Triggers the AI content brief generation for a deliverable.
 */
router.post('/:id/ai-brief', async (req, res, next) => {
  try {
    const deliverable = await generateBriefForDeliverable(req.params.id);
    res.status(201).json(deliverable);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/deliverables/:id/brief
 * Fetches the AI-generated brief for a deliverable.
 */
router.get('/:id/brief', async (req, res) => {
  const deliverable = await prisma.deliverableItem.findUnique({ where: { id: req.params.id } });
  res.json(deliverable);
});

export default router;