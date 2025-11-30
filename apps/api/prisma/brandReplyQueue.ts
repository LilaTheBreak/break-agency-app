import { createSafeQueue } from '../../queues/index.js';

export const brandReplyQueue = createSafeQueue('brand-reply');