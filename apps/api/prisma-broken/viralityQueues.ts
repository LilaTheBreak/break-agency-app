import { createSafeQueue } from '../../queues/index.js';

export const viralityGenerateVariantsQueue = createSafeQueue('virality-generate-variants');
export const viralitySimulationQueue = createSafeQueue('virality-simulation');
export const viralityRankingQueue = createSafeQueue('virality-ranking');