import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { viralityGenerateVariantsQueue } from '../worker/queues/viralityQueues.js';

const router = Router();

/**
 * POST /api/virality/simulate
 * Triggers the full 3-queue workflow for a deliverable.
 */
router.post('/simulate', async (req, res) => {
  const { deliverableId } = req.body;

  // Create the main simulation record
  const simulation = await prisma.viralSimulation.create({
    data: {
      deliverableId,
      status: 'pending',
    },
  });

  // Enqueue the first job in the chain
  await viralityGenerateVariantsQueue.add('generate-variants', { simulationId: simulation.id });

  res.status(202).json({ message: 'Virality simulation process started.', simulationId: simulation.id });
});

/**
 * GET /api/virality/:deliverableId
 * Fetches the latest simulation results for a deliverable.
 */
router.get('/:deliverableId', async (req, res, next) => {
  try {
    const simulation = await prisma.viralSimulation.findFirst({
      where: { deliverableId: req.params.deliverableId },
      include: { variants: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(simulation);
  } catch (error) {
    next(error);
  }
});

export default router;