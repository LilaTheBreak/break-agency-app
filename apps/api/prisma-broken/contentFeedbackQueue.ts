import { createSafeQueue } from '../../queues/index.js';

export const contentFeedbackQueue = createSafeQueue('content-feedback');