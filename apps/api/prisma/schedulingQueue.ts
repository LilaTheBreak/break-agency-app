import { createSafeQueue } from '../../queues/index.js';

export const schedulingQueue = createSafeQueue('scheduling');