import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { contractAssembleQueue } from '../worker/queues/contractWriterQueues.js';

const router = Router();

/**
 * POST /api/contracts/generate/:dealDraftId
 * Manually triggers the contract generation pipeline.
 */
router.post('/generate/:dealDraftId', async (req, res) => {
  const { dealDraftId } = req.params;
  await contractAssembleQueue.add('manual-generate', { dealDraftId });
  res.status(202).json({ message: 'AI contract generation has been queued.' });
});

/**
 * GET /api/contracts/:contractId
 * Fetches a generated contract by its ID.
 */
router.get('/:contractId', async (req, res, next) => {
  try {
    const contract = await prisma.contractGenerated.findUnique({ where: { id: req.params.contractId } });
    res.json(contract);
  } catch (error) {
    next(error);
  }
});

export default router;