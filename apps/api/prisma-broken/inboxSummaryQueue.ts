import { createSafeQueue } from '../../queues/index.js';

export const inboxSummaryQueue = createSafeQueue('inbox-summary');