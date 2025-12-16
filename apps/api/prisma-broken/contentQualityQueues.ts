import { createSafeQueue } from '../../queues/index.js';

export const contentInputQueue = createSafeQueue('content-input');
export const contentPredictQueue = createSafeQueue('content-predict');
export const contentSaveQueue = createSafeQueue('content-save');