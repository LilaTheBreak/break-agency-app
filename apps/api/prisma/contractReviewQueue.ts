import { createSafeQueue } from '../../queues/index.js';

export const contractReviewQueue = createSafeQueue('contract-review');