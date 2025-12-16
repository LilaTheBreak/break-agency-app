import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { performancePredictionQueue } from '../worker/queues/performancePredictionQueue.js';

const router = Router();

/**
 * POST /api/deliverables/:id/predict-performance
 * Triggers the AI performance prediction pipeline.
 */
router.post('/:id/predict-performance', async (req, res) => {
  const { id } = req.params;
  await performancePredictionQueue.add('predict-performance', { deliverableId: id });
  res.status(202).json({ message: 'AI performance prediction has been queued.' });
});

/**
 * GET /api/deliverables/:id/performance
 * Fetches the latest performance prediction for a deliverable.
 */
router.get('/:id/performance', async (req, res, next) => {
  try {
    const prediction = await prisma.performancePrediction.findUnique({ where: { deliverableId: req.params.id } });
    res.json(prediction);
  } catch (error) {
    next(error);
  }
});

export default router;