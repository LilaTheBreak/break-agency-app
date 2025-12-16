import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { calculateDealPricing, generateUpsells } from '../services/pricing/pricingEngine.js';

const router = Router();
const MOCK_USER_ID = 'clxrz45gn000008l4hy285p0g'; // Mock user for demonstration

/**
 * POST /api/pricing/calc
 * Calculates the dynamic price for a given deal draft.
 */
router.post('/calc', async (req, res, next) => {
  const { dealDraftId } = req.body;
  try {
    const snapshot = await calculateDealPricing(MOCK_USER_ID, dealDraftId);
    res.status(201).json(snapshot);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/pricing/upsells
 * Generates upsell suggestions for a deal draft.
 */
router.post('/upsells', async (req, res, next) => {
  const { dealDraftId } = req.body;
  try {
    const dealDraft = await prisma.dealDraft.findUnique({ where: { id: dealDraftId } });
    if (!dealDraft) return res.status(404).json({ error: 'Deal draft not found.' });
    const upsells = generateUpsells(dealDraft);
    res.json(upsells);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/pricing/snapshots/:userId
 * Retrieves all pricing snapshots for a user.
 */
router.get('/snapshots/:userId', async (req, res, next) => {
  // Add permission checks in a real app
  try {
    const snapshots = await prisma.pricingSnapshot.findMany({ where: { userId: req.params.userId } });
    res.json(snapshots);
  } catch (error) {
    next(error);
  }
});

export default router;