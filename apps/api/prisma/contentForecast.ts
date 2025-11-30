import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { contentPerformanceQueue } from '../worker/queues/contentPerformanceQueue.js';

const router = Router();

/**
 * POST /api/forecast/content
 * Manually triggers a forecast generation for a deliverable.
 */
router.post('/', async (req, res) => {
  const { deliverableId } = req.body;
  await contentPerformanceQueue.add('generate-forecast', { deliverableId });
  res.status(202).json({ message: 'Content performance forecast generation has been queued.' });
});

/**
 * GET /api/forecast/content/:id
 * Fetches the forecast for a specific deliverable.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const forecast = await prisma.contentPerformanceForecast.findUnique({
      where: { deliverableId: req.params.id },
    });
    res.json(forecast);
  } catch (error) {
    next(error);
  }
});

export default router;