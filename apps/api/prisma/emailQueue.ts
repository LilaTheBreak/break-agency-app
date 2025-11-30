import { createSafeQueue } from '../../queues/index.js';

export const emailQueue = createSafeQueue('email');