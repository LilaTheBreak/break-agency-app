import { Router } from 'express';
import { reconstructDealDraft } from '../services/ai/dealReconstruction.js';
import prisma from '../lib/prisma.js';

const router = Router();

/**
 * POST /ai/deal/reconstruct
 * Triggers the AI deal reconstruction for a single email.
 */
router.post('/reconstruct', async (req, res, next) => {
  const { emailId, threadId } = req.body;
  if (!emailId) {
    return res.status(400).json({ error: 'emailId is required.' });
  }

  try {
    const result = await reconstructDealDraft({ emailId, threadId });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /ai/deal/reconstruct/bulk
 * A placeholder for a future bulk processing endpoint.
 */
router.post('/reconstruct/bulk', async (req, res) => {
  // In a real implementation, this would find all emails classified as 'deal'
  // and enqueue a reconstruction job for each one.
  console.log('[BULK RECONSTRUCT] Triggered. Enqueueing jobs...');
  res.status(202).json({ message: 'Bulk reconstruction process initiated.' });
});

export default router;