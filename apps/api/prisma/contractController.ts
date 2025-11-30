import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { buildContractForDeal } from '../services/contract/contractBuilder.js';

const router = Router();

/**
 * POST /api/contracts/auto-generate/:threadId
 * Manually triggers the AI contract generation pipeline for a negotiation thread.
 */
router.post('/auto-generate/:threadId', async (req, res, next) => {
  try {
    const review = await buildContractForDeal(req.params.threadId);
    res.status(201).json(review);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/contracts/:contractId
 * Fetches a generated contract review and its terms.
 */
router.get('/:contractId', async (req, res) => {
  const review = await prisma.contractReview.findUnique({ where: { id: req.params.contractId }, include: { terms: true } });
  res.json(review);
});

export default router;