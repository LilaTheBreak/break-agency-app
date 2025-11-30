import { Router } from 'express';
import prisma from '../lib/prisma.js';

const router = Router();

/**
 * GET /api/email/outbox
 * Fetches emails that are currently queued or have failed.
 */
router.get('/outbox', async (req, res, next) => {
  try {
    const outbox = await prisma.emailOutbox.findMany({
      where: { status: { in: ['queued', 'failed'] } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(outbox);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/email/history/:talentId
 * Fetches the history of sent emails for a specific talent.
 */
router.get('/history/:talentId', async (req, res) => {
  const history = await prisma.emailOutbox.findMany({ where: { talentId: req.params.talentId, status: 'sent' } });
  res.json(history);
});

export default router;