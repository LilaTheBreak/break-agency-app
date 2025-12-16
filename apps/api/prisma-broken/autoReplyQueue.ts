import { createSafeQueue } from '../../queues/index.js';

export const autoReplyQueue = createSafeQueue('auto-reply');