import prisma from '../lib/prisma.js';
import { simulateNegotiationPath, scoreScenario } from '../services/negotiation/simulationEngine.js';

/**
 * Runs a multi-path negotiation simulation for a given deal.
 * @param dealId - The ID of the DealThread to simulate.
 */
export async function runNegotiationSimulation(dealId: string) {
  // 1. Load deal and its base strategy
  const deal = await prisma.dealThread.findUnique({
    where: { id: dealId },
    include: { strategy: true, dealDraft: true },
  });

  if (!deal || !deal.strategy) throw new Error('Deal or base strategy not found.');

  // 2. Define the different paths to simulate
  const pathsToSimulate = [
    { style: 'BALANCED', anchorRate: deal.strategy.anchorRate, openingScript: 'Standard opening...' },
    { style: 'AGGRESSIVE', anchorRate: (deal.strategy.anchorRate || 0) * 1.1, openingScript: 'Firm opening...' },
    { style: 'COLLABORATIVE', anchorRate: deal.strategy.targetRate, openingScript: 'Friendly opening...' },
  ];

  const simulationResults = [];

  // 3. Run simulation for each path
  for (const path of pathsToSimulate) {
    const dealContext = { initialOffer: deal.dealDraft?.offerValue };
    const result = await simulateNegotiationPath(dealContext, path) as any;
    const score = scoreScenario(result);

    simulationResults.push({
      pathName: path.style,
      ...result,
      score,
    });
  }

  // 4. Clear old simulations and save new ones
  await prisma.negotiationSimulation.deleteMany({ where: { dealId } });
  for (const result of simulationResults) {
    await prisma.negotiationSimulation.create({
      data: {
        dealId,
        userId: deal.userId!,
        pathName: result.pathName,
        aiSteps: result.aiSteps,
        predictedOutcome: result.predictedOutcome,
        recommendedAction: result.recommendedAction,
        score: result.score,
      },
    });
  }

  // 5. Identify and recommend the best path
  const bestPath = simulationResults.reduce((best, current) => (current.score > best.score ? current : best));

  console.log(`[SIMULATION PIPELINE] Ran ${simulationResults.length} simulations for deal ${dealId}. Recommended path: ${bestPath.pathName}`);

  return { simulations: simulationResults, recommendedPath: bestPath };
}