import { createSafeQueue } from '../../queues/index.js';

export const contractDraftQueue = createSafeQueue('contract-draft');