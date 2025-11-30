import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { runNegotiationSimulation } from '../pipelines/simulationPipeline.js';

const router = Router();

/**
 * GET /api/deals/:id/simulations
 * Fetches all stored simulations for a deal.
 */
router.get('/deals/:id/simulations', async (req, res, next) => {
  const { id } = req.params;
  try {
    const simulations = await prisma.negotiationSimulation.findMany({
      where: { dealId: id },
      orderBy: { score: 'desc' },
    });
    res.json(simulations);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/deals/:id/run-simulations
 * Manually triggers the negotiation simulation pipeline.
 */
router.post('/deals/:id/run-simulations', async (req, res, next) => {
  const { id } = req.params;
  try {
    const result = await runNegotiationSimulation(id);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/deals/:id/recommended-path
 * Fetches only the highest-scoring, recommended simulation path.
 */
router.get('/deals/:id/recommended-path', async (req, res, next) => {
  const { id } = req.params;
  // This is a simplified version. In a real app, you might have a dedicated field on the deal.
  const bestSim = await prisma.negotiationSimulation.findFirst({ where: { dealId: id }, orderBy: { score: 'desc' } });
  res.json(bestSim);
});

export default router;