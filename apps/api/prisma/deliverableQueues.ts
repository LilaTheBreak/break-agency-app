import { createSafeQueue } from '../../queues/index.js';

export const deliverableExtractQueue = createSafeQueue('deliverable-extract');
export const deliverableBrandCheckQueue = createSafeQueue('deliverable-brand-check');
export const deliverableBriefCheckQueue = createSafeQueue('deliverable-brief-check');
export const deliverableComplianceQueue = createSafeQueue('deliverable-compliance');
export const deliverableSafetyQueue = createSafeQueue('deliverable-safety');
export const deliverableRewriteQueue = createSafeQueue('deliverable-rewrite');
export const deliverablePredictQueue = createSafeQueue('deliverable-predict');
export const deliverableReportQueue = createSafeQueue('deliverable-report');