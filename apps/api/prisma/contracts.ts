import { Router } from 'express';
import {
  generateAIContract,
  reviewBrandContract,
  generateContractNegotiationReply,
} from '../services/contracts/index.js';

const router = Router();

/**
 * POST /api/contract/ai/generate
 * Generates a new contract from a DealDraft ID.
 */
router.post('/ai/generate', async (req, res, next) => {
  const { dealDraftId } = req.body;
  try {
    const result = await generateAIContract(dealDraftId);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/contract/ai/review
 * Kicks off redline analysis for an uploaded contract.
 */
router.post('/ai/review', async (req, res, next) => {
  const { contractReviewId } = req.body;
  try {
    const result = await reviewBrandContract(contractReviewId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/contract/ai/negotiation-reply
 * Generates a negotiation script based on redlines.
 */
router.post('/ai/negotiation-reply', async (req, res, next) => {
  const { contractReviewId } = req.body;
  try {
    const result = await generateContractNegotiationReply(contractReviewId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;