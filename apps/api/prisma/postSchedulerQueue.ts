import { createSafeQueue } from '../../queues/index.js';

export const postSchedulerQueue = createSafeQueue('post-scheduler');