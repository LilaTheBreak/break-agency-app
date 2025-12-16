import { Router } from 'express';
import prisma from '../lib/prisma.js';

const router = Router();

/**
 * GET /api/forecast/thread/:id
 * Fetches the forecast for a deal thread.
 */
router.get('/thread/:id', async (req, res, next) => {
  try {
    const forecast = await prisma.dealForecast.findUnique({
      where: { threadId: req.params.id },
    });
    res.json(forecast);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/forecast/draft/:id
 * Fetches the forecast for a deal draft.
 */
router.get('/draft/:id', async (req, res) => {
  const forecast = await prisma.dealForecast.findUnique({ where: { draftId: req.params.id } });
  res.json(forecast);
});

export default router;