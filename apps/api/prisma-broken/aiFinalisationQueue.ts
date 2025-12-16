import { createSafeQueue } from '../../queues/index.js';

export const aiFinalisationQueue = createSafeQueue('ai-finalisation');