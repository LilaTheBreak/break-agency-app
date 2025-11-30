import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { scheduleBrandFollowUp, cancelFollowUps } from '../services/followUp/followUpService.js';

const router = Router();

/**
 * POST /api/followups/:deliverableId/schedule
 * Manually schedules follow-ups for a deliverable.
 */
router.post('/:deliverableId/schedule', async (req, res) => {
  await scheduleBrandFollowUp(req.params.deliverableId);
  res.status(202).json({ message: 'Follow-up sequence scheduled.' });
});

/**
 * POST /api/followups/:deliverableId/cancel
 * Cancels all pending follow-ups for a deliverable.
 */
router.post('/:deliverableId/cancel', async (req, res) => {
  await cancelFollowUps(req.params.deliverableId);
  res.json({ message: 'Follow-up sequence cancelled.' });
});

/**
 * GET /api/followups/:deliverableId/status
 */
router.get('/:deliverableId/status', async (req, res) => {
  const deliverable = await prisma.deliverableItem.findUnique({ where: { id: req.params.deliverableId }, select: { autoFollowUpEnabled: true, followUpCount: true, lastBrandFollowUpAt: true } });
  res.json(deliverable);
});

export default router;