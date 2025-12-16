import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { invoicePrepareQueue, invoiceReconciliationQueue } from '../worker/queues/paymentQueues.js';

const router = Router();

/**
 * POST /api/invoices/:dealThreadId/generate
 * Triggers the invoice generation pipeline.
 */
router.post('/invoices/:dealThreadId/generate', async (req, res) => {
  const { dealThreadId } = req.params;
  await invoicePrepareQueue.add('generate-invoice', { dealThreadId });
  res.status(202).json({ message: 'Invoice generation has been queued.' });
});

/**
 * GET /api/invoices/:invoiceId/status
 * Fetches the status and history of an invoice.
 */
router.get('/invoices/:invoiceId/status', async (req, res, next) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.invoiceId },
      include: { history: { orderBy: { createdAt: 'asc' } } },
    });
    res.json(invoice);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/payments/webhook/stripe
 * Webhook endpoint for Stripe to confirm payments.
 */
router.post('/payments/webhook/stripe', async (req, res) => {
  const event = req.body;
  // In a real app, you'd verify the webhook signature here
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const invoiceId = paymentIntent.metadata.invoiceId;
    await invoiceReconciliationQueue.add('reconcile-stripe-payment', { invoiceId });
  }
  res.sendStatus(200);
});

export default router;