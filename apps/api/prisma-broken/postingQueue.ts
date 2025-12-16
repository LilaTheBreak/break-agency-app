import { createSafeQueue } from '../../queues/index.js';

export const postingQueue = createSafeQueue('posting');