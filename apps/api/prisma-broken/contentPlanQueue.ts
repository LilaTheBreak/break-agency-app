import { createSafeQueue } from '../../queues/index.js';

export const contentPlanQueue = createSafeQueue('content-plan');