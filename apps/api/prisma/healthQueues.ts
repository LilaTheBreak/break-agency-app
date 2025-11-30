import { createSafeQueue } from '../../queues/index.js';

export const healthInputQueue = createSafeQueue('health-input');
export const healthPredictQueue = createSafeQueue('health-predict');
export const healthSaveQueue = createSafeQueue('health-save');