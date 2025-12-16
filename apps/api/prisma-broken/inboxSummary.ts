import { Router } from 'express';
import prisma from '../lib/prisma.js';

const router = Router();
const MOCK_USER_ID = 'clxrz45gn000008l4hy285p0g'; // Mock user for demonstration

/**
 * GET /api/inbox-summary/daily
 * Fetches the latest daily summary for the current user.
 */
router.get('/daily', async (req, res, next) => {
  try {
    const summary = await prisma.inboxSummary.findFirst({
      where: { userId: MOCK_USER_ID, timeframe: 'daily' },
      orderBy: { createdAt: 'desc' },
    });
    res.json(summary);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/inbox-summary/generate
 */
router.post('/generate', async (req, res) => {
  // This would enqueue a job for the current user
  res.status(202).json({ message: 'Inbox summary generation has been queued.' });
});

export default router;