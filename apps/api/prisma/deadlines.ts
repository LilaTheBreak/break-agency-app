import { Router } from 'express';
import prisma from '../lib/prisma.js';

const router = Router();

/**
 * GET /api/deadlines/talent/:talentId
 * Fetches all active deadlines for a specific talent.
 */
router.get('/talent/:talentId', async (req, res, next) => {
  const { talentId } = req.params;
  try {
    const deadlines = await prisma.deadlineMonitor.findMany({
      where: { talentId, status: { in: ['active', 'at_risk', 'overdue'] } },
      orderBy: { dueAt: 'asc' },
    });
    res.json(deadlines);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/deadlines/resolve/:deadlineId
 * Manually marks a deadline as completed.
 */
router.post('/resolve/:deadlineId', async (req, res) => {
  await prisma.deadlineMonitor.update({ where: { id: req.params.deadlineId }, data: { status: 'completed' } });
  res.json({ message: 'Deadline marked as completed.' });
});

export default router;