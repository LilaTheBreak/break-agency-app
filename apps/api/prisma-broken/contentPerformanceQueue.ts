import { createSafeQueue } from '../../queues/index.js';

export const contentPerformanceQueue = createSafeQueue('content-performance');