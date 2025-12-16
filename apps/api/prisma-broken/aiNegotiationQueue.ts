import { createSafeQueue } from '../../queues/index.js';

export const aiNegotiationQueue = createSafeQueue('ai-negotiation');