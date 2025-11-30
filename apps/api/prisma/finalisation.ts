import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { aiFinalisationQueue } from '../worker/queues/aiFinalisationQueue.js';

const router = Router();

/**
 * POST /api/threads/:id/finalise/start
 * Kicks off the AI finalization pipeline for a thread.
 */
router.post('/threads/:id/finalise/start', async (req, res) => {
  const { id } = req.params;
  await aiFinalisationQueue.add('start-finalisation', { threadId: id });
  res.status(202).json({ message: 'Deal finalization process started.' });
});

/**
 * GET /api/threads/:id/finalise/status
 * Gets the latest generated contract review for preview.
 */
router.get('/threads/:id/finalise/status', async (req, res, next) => {
  const { id } = req.params;
  try {
    // Find the contract review linked to the deal thread
    const contract = await prisma.contract.findFirst({ where: { threadId: id }, include: { reviews: true } });
    const review = contract?.reviews[0];
    res.json(review);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/threads/:id/finalise/confirm
 * Confirms the AI-generated draft and sends for signature.
 */
router.post('/threads/:id/finalise/confirm', async (req, res) => {
  const { id } = req.params;
  // In a real app, this would trigger the `signatureDraft` service to move from 'draft' to 'sent'
  // and call the DocuSign client, respecting the sandbox policy.
  console.log(`[FINALIZE CONFIRM] Confirmation received for thread ${id}. Envelope would be sent now.`);
  res.json({ message: 'Contract approved and sent for signature.' });
});

export default router;