import { createSafeQueue } from '../../queues/index.js';

export const signaturePrepareQueue = createSafeQueue('signature-prepare');
export const signatureSendQueue = createSafeQueue('signature-send');
export const signatureStatusQueue = createSafeQueue('signature-status');
export const signatureMergeQueue = createSafeQueue('signature-merge');
export const signatureStoreQueue = createSafeQueue('signature-store');
export const signatureNotifyQueue = createSafeQueue('signature-notify');