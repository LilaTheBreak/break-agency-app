import { Router } from 'express';
import { schedulingQueue } from '../worker/queues/schedulingQueue.js';

const router = Router();

/**
 * POST /api/deals/:dealId/schedule/auto
 * Triggers the auto-scheduling pipeline for a deal.
 */
router.post('/deals/:dealId/schedule/auto', async (req, res) => {
  const { dealId } = req.params;
  await schedulingQueue.add('auto-schedule-deal', { dealId });
  res.status(202).json({ message: 'Campaign auto-scheduling has been queued.' });
});

/**
 * POST /api/schedule/:dealId/sync/google
 * Triggers a sync to Google Calendar.
 */
router.post('/schedule/:dealId/sync/google', async (req, res) => {
  // In a real app, this would enqueue a specific sync job.
  console.log(`[API] Triggering Google Calendar sync for deal ${req.params.dealId}`);
  res.status(202).json({ message: 'Google Calendar sync has been queued.' });
});

// Other routes like /update and /conflicts would be added here.

export default router;