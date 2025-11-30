import { createSafeQueue } from '../../queues/index.js';

export const negotiationInsightQueue = createSafeQueue('negotiation-insight');