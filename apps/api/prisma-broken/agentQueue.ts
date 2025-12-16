import { createSafeQueue } from '../../queues/index.js';

export const agentQueue = createSafeQueue('agent-main');