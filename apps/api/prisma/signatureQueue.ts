import { createSafeQueue } from '../../queues/index.js';

export const signaturePrepareQueue = createSafeQueue('signature-prepare');
export const signatureWebhookQueue = createSafeQueue('signature-webhook');
export const signatureNotifyQueue = createSafeQueue('signature-notify');