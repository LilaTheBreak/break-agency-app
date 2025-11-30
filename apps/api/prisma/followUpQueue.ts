import { createSafeQueue } from '../../queues/index.js';

export const followUpQueue = createSafeQueue('follow-up');