import { createSafeQueue } from '../../queues/index.js';

export const negotiationQueue = createSafeQueue('negotiation');
export const negotiationFollowUpQueue = createSafeQueue('negotiation-follow-up');