import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { healthInputQueue } from '../worker/queues/healthQueues.js';

const router = Router();

/**
 * POST /api/health/creator/:userId/run
 * Manually triggers a health check for a creator.
 */
router.post('/creator/:userId/run', async (req, res) => {
  const { userId } = req.params;
  const talent = await prisma.talent.findFirst({ where: { userId } });
  if (!talent) return res.status(404).json({ error: 'Talent not found.' });

  await healthInputQueue.add('manual-health-check', { userId, talentId: talent.id });
  res.status(202).json({ message: 'Creator health check has been queued.' });
});

/**
 * GET /api/health/creator/:userId
 * Fetches the latest health check for a creator.
 */
router.get('/creator/:userId', async (req, res, next) => {
  const { userId } = req.params;
  try {
    const health = await prisma.creatorHealth.findFirst({
      where: { userId },
      orderBy: { lastChecked: 'desc' },
    });
    res.json(health);
  } catch (error) {
    next(error);
  }
});

// GET /api/health/creator/:userId/history would be similar, fetching from CreatorHealthHistory

export default router;