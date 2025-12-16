import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { moodboardQueue } from '../worker/queues/moodboardQueue.js';

const router = Router();

/**
 * POST /api/moodboards/create
 * Triggers the AI moodboard generation pipeline for a concept.
 */
router.post('/create', async (req, res) => {
  const { conceptId } = req.body;
  await moodboardQueue.add('generate-moodboard', { conceptId });
  res.status(202).json({ message: 'AI moodboard generation has been queued.' });
});

/**
 * GET /api/moodboards/:id
 * Fetches a generated moodboard by its ID.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const moodboard = await prisma.creativeMoodboard.findUnique({ where: { id: req.params.id } });
    res.json(moodboard);
  } catch (error) {
    next(error);
  }
});

export default router;