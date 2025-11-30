import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { performanceQueue } from '../worker/queues/performanceQueue.js';

const router = Router();

/**
 * POST /api/deliverables/:id/performance/refresh
 * Manually triggers a performance data refresh for a deliverable.
 */
router.post('/deliverables/:id/performance/refresh', async (req, res) => {
  const { id } = req.params;
  await performanceQueue.add('refresh-performance', { deliverableId: id });
  res.status(202).json({ message: 'Performance data refresh has been queued.' });
});

/**
 * GET /api/deliverables/:id/performance
 * Fetches all performance snapshots for a deliverable.
 */
router.get('/deliverables/:id/performance', async (req, res, next) => {
  try {
    const snapshots = await prisma.postPerformance.findMany({
      where: { deliverableId: req.params.id },
      orderBy: { capturedAt: 'asc' },
    });
    res.json(snapshots);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/campaigns/:id/report
 * Fetches the AI-generated report for a campaign.
 */
router.get('/campaigns/:id/report', async (req, res) => {
  const campaign = await prisma.campaign.findUnique({ where: { id: req.params.id } });
  res.json(campaign?.aiReport || { summary: 'Report not generated yet.' });
});

export default router;