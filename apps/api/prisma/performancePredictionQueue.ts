import { createSafeQueue } from '../../queues/index.js';

export const performancePredictionQueue = createSafeQueue('performance-prediction');