import { createSafeQueue } from '../../queues/index.js';

export const contractAssembleQueue = createSafeQueue('contract-assemble');
export const contractDraftQueue = createSafeQueue('contract-draft');
export const contractRedlineQueue = createSafeQueue('contract-redline');
export const contractPdfQueue = createSafeQueue('contract-pdf');
export const contractStoreQueue = createSafeQueue('contract-store');