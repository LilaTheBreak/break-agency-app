import { createSafeQueue } from '../../queues/index.js';

export const negotiationExtractQueue = createSafeQueue('negotiation-extract');
export const negotiationPolicyCheckQueue = createSafeQueue('negotiation-policy-check');
export const negotiationCounterOfferQueue = createSafeQueue('negotiation-counter-offer');
export const negotiationMessageQueue = createSafeQueue('negotiation-message');
export const negotiationDealUpdateQueue = createSafeQueue('negotiation-deal-update');
export const negotiationDecisionQueue = createSafeQueue('negotiation-decision');