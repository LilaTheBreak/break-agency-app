import { createSafeQueue } from '../../queues/index.js';

export const deliverableQaQueue = createSafeQueue('deliverable-qa');