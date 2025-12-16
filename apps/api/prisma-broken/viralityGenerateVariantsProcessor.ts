import type { Job } from 'bullmq';
import prisma from '../../lib/prisma.js';
import { generateVariants } from '../../services/ai/aiViralitySimulator.js';
import { viralitySimulationQueue } from '../queues/viralityQueues.js';

/**
 * Worker to generate creative variants for a deliverable.
 */
export default async function viralityGenerateVariantsProcessor(job: Job<{ simulationId: string }>) {
  const { simulationId } = job.data;
  console.log(`[WORKER] Generating variants for simulation: ${simulationId}`);

  const simulation = await prisma.viralSimulation.findUnique({ where: { id: simulationId }, include: { deliverable: true } });
  if (!simulation) throw new Error('Simulation not found.');

  await prisma.viralSimulation.update({ where: { id: simulationId }, data: { status: 'generating_variants' } });

  // Mock trending topics
  const trends = ['GRWM', 'Unboxing', 'Day in the Life'];
  const { variants } = await generateVariants({ topic: simulation.deliverable.description || 'New Product', trends });

  // For each variant, enqueue a simulation job
  for (const variant of variants) {
    const variantScore = await prisma.viralVariantScore.create({
      data: { simulationId, variant, viralityScore: 0 },
    });
    await viralitySimulationQueue.add('simulate-variant', { variantScoreId: variantScore.id });
  }

  await prisma.viralSimulation.update({ where: { id: simulationId }, data: { status: 'simulating' } });
}