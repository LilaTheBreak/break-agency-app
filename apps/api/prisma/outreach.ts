import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { outreachInputQueue } from '../worker/queues/outreachQueues.js';

const router = Router();

/**
 * POST /api/outreach/start
 * Triggers the outreach generation process for a specific lead.
 */
router.post('/start', async (req, res) => {
  const { leadId, userId } = req.body;
  await outreachInputQueue.add('start-outreach', { leadId, userId });
  res.status(202).json({ message: 'Outreach generation process has been started.' });
});

/**
 * GET /api/outreach/:sequenceId
 * Fetches the details and suggestions for a specific outreach sequence.
 */
router.get('/:sequenceId', async (req, res) => {
  const suggestions = await prisma.outreachSuggestion.findMany({
    where: { sequenceId: req.params.sequenceId },
  });
  res.json(suggestions);
});

export default router;