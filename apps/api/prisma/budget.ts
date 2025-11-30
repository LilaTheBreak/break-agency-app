import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { budgetPlanQueue } from '../worker/queues/budgetPlanQueue.js';

const router = Router();

/**
 * GET /api/campaign/:aiPlanId/budget
 * Fetches the optimized budget for a campaign plan.
 */
router.get('/campaign/:aiPlanId/budget', async (req, res, next) => {
  const { aiPlanId } = req.params;
  try {
    const budget = await prisma.aIOptimizedBudget.findUnique({
      where: { aiPlanId },
    });
    res.json(budget);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/campaign/:aiPlanId/budget/regenerate
 */
router.post('/campaign/:aiPlanId/budget/regenerate', async (req, res) => {
  const { aiPlanId } = req.params;
  await budgetPlanQueue.add('regenerate-budget', { aiPlanId });
  res.status(202).json({ message: 'Budget optimization has been queued.' });
});

export default router;