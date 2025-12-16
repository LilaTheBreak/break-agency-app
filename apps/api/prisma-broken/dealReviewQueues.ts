import { createSafeQueue } from '../../queues/index.js';

export const dealReviewQueue = createSafeQueue('deal-review');
export const contractReviewQueue = createSafeQueue('contract-review'); // From S64
export const negotiationMessageReviewQueue = createSafeQueue('negotiation-message-review');
export const brandSafetyQueue = createSafeQueue('brand-safety');