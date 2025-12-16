import prisma from '../../lib/prisma.js';
import { stripeClient } from '../../integrations/stripe/stripeClient.js';
import { xeroClient } from '../../integrations/xero/xeroClient.js';
import { invoiceSendQueue, payoutProcessQueue } from '../../worker/queues/paymentQueues.js';

/**
 * Generates an invoice record from a deal thread.
 */
export async function generateInvoice(dealThreadId: string) {
  const deal = await prisma.dealThread.findUnique({ where: { id: dealThreadId }, include: { dealDraft: true } });
  if (!deal || !deal.dealDraft) throw new Error('Deal not found.');

  const invoice = await prisma.invoice.create({
    data: {
      userId: deal.userId!,
      brandName: deal.brandName!,
      brandEmail: deal.brandEmail,
      amount: deal.dealDraft.offerValue || 0,
      currency: deal.dealDraft.offerCurrency || 'GBP',
      status: 'draft',
      dueDate: new Date(Date.now() + 30 * 24 * 3600 * 1000), // Due in 30 days
    },
  });

  await prisma.invoiceHistory.create({ data: { invoiceId: invoice.id, status: 'created' } });
  return invoice;
}

/**
 * Pushes an invoice to an external accounting service and sends it.
 */
export async function sendInvoice(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) throw new Error('Invoice not found.');

  // Push to Xero (stub)
  const xeroInvoice = await xeroClient.createInvoice('contact_id_placeholder', invoice.amount);
  await prisma.invoice.update({ where: { id: invoiceId }, data: { xeroId: xeroInvoice.id } });

  // Enqueue email sending job
  await invoiceSendQueue.add('send-invoice-email', { invoiceId });
  await prisma.invoiceHistory.create({ data: { invoiceId, status: 'sent' } });
}

/**
 * Reconciles a payment and schedules a payout.
 */
export async function reconcilePayment(invoiceId: string) {
  // Triggered by a webhook
  console.log(`[PAYMENT SERVICE] Reconciling payment for invoice ${invoiceId}`);
  const invoice = await prisma.invoice.update({ where: { id: invoiceId }, data: { status: 'paid' } });
  await prisma.invoiceHistory.create({ data: { invoiceId, status: 'paid' } });

  // Create a payout record
  const payout = await prisma.payout.create({
    data: {
      userId: invoice.userId,
      amount: invoice.amount * 0.8, // Assuming 20% agency fee
      currency: invoice.currency,
      status: 'scheduled',
    },
  });

  // Enqueue the payout processing job
  await payoutProcessQueue.add('process-payout', { payoutId: payout.id });
}