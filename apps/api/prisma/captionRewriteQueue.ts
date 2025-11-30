import { createSafeQueue } from '../../queues/index.js';

export const captionRewriteQueue = createSafeQueue('caption-rewrite');