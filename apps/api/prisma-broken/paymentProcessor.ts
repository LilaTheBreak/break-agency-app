import type { Job } from 'bullmq';
import { generateInvoice, sendInvoice, reconcilePayment } from '../../services/payments/paymentService.js';

/**
 * Worker to run the various stages of the payment pipeline.
 */
export default async function paymentProcessor(job: Job<any>) {
  console.log(`[WORKER] Running payment job: ${job.name}`);

  switch (job.name) {
    case 'generate-invoice':
      await generateInvoice(job.data.dealThreadId);
      break;
    case 'send-invoice':
      await sendInvoice(job.data.invoiceId);
      break;
    case 'reconcile-payment':
      await reconcilePayment(job.data.invoiceId);
      break;
    // Add other cases for payout, etc.
    default:
      console.warn(`[WORKER] Unknown payment job name: ${job.name}`);
  }
}