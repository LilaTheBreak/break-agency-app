import { createSafeQueue } from '../../queues/index.js';

export const invoicePrepareQueue = createSafeQueue('invoice-prepare');
export const invoiceSendQueue = createSafeQueue('invoice-send');
export const invoiceStatusPollQueue = createSafeQueue('invoice-status-poll');
export const invoiceReconciliationQueue = createSafeQueue('invoice-reconciliation');
export const payoutProcessQueue = createSafeQueue('payout-process');
export const payoutNotifyQueue = createSafeQueue('payout-notify');