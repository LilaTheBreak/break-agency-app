import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { forecastBuildQueue } from '../worker/queues/forecastQueues.js';

const router = Router();

/**
 * POST /api/forecast/campaign
 * Triggers the forecast generation pipeline for a deal draft.
 */
router.post('/campaign', async (req, res) => {
  const { dealDraftId } = req.body;
  await forecastBuildQueue.add('generate-forecast', { dealDraftId });
  res.status(202).json({ message: 'Campaign forecast generation has been queued.' });
});

/**
 * GET /api/forecast/deal/:dealDraftId
 * Fetches the forecast for a specific deal draft.
 */
router.get('/deal/:dealDraftId', async (req, res, next) => {
  try {
    const forecast = await prisma.campaignForecast.findUnique({
      where: { dealDraftId: req.params.dealDraftId },
    });
    res.json(forecast);
  } catch (error) {
    next(error);
  }
});

export default router;