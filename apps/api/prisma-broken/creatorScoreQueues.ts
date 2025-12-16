import { createSafeQueue } from '../../queues/index.js';

export const creatorScoreMarketFitQueue = createSafeQueue('creator-score-market-fit');
export const creatorScorePredictedEarningsQueue = createSafeQueue('creator-score-predicted-earnings');
export const creatorScoreAlignmentQueue = createSafeQueue('creator-score-alignment');
export const creatorScoreVelocityQueue = createSafeQueue('creator-score-velocity');
export const creatorScorePortfolioQueue = createSafeQueue('creator-score-portfolio');
export const creatorScoreAggregateQueue = createSafeQueue('creator-score-aggregate');