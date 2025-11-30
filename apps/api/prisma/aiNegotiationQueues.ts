import { createSafeQueue } from '../../queues/index.js';

export const aiNegotiationChainQueue = createSafeQueue('ai-negotiation-chain');
export const aiSilenceWorkerQueue = createSafeQueue('ai-silence-worker');