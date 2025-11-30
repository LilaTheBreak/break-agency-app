import { createSafeQueue } from '../../queues/index.js';

export const performanceQueue = createSafeQueue('performance');