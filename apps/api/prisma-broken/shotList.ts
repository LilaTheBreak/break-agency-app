import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { shotListQueue } from '../worker/queues/shotListQueue.js';

const router = Router();

/**
 * POST /api/concepts/:id/shotlist/generate
 * Triggers the AI shot list generation pipeline.
 */
router.post('/:id/shotlist/generate', async (req, res) => {
  const { id } = req.params;
  await shotListQueue.add('generate-shot-list', { conceptId: id });
  res.status(202).json({ message: 'AI shot list generation has been queued.' });
});

/**
 * GET /api/concepts/:id/shotlist
 * Fetches all shots for a creative concept.
 */
router.get('/:id/shotlist', async (req, res, next) => {
  try {
    const shots = await prisma.creativeShotList.findMany({ where: { conceptId: req.params.id }, orderBy: { shotNumber: 'asc' } });
    res.json(shots);
  } catch (error) {
    next(error);
  }
});

export default router;