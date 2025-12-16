import { createSafeQueue } from '../../queues/index.js';

export const contractExtractQueue = createSafeQueue('contract-extract');
export const contractClassifyQueue = createSafeQueue('contract-classify');
export const contractRiskQueue = createSafeQueue('contract-risk');
export const contractAlignmentQueue = createSafeQueue('contract-alignment');
export const contractRedlineQueue = createSafeQueue('contract-redline');
export const contractSaveQueue = createSafeQueue('contract-save');