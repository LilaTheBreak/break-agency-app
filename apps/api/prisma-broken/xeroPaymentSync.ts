import cron from 'node-cron';
import prisma from '../lib/prisma.js';
import { fetchXeroPaymentStatus } from '../integrations/xero/xeroClient.js';
import { creditCreator } from '../services/billing/balanceLedger.js';
import { calculateCommissions } from '../services/billing/commissionService.js';

/**
 * Syncs payment statuses from Xero for outstanding invoices.
 */
async function syncXeroPayments() {
  console.log('[CRON] Syncing payments from Xero...');
  const outstandingInvoices = await prisma.invoice.findMany({
    where: { status: 'submitted' },
  });

  for (const invoice of outstandingInvoices) {
    if (!invoice.xeroId || !invoice.userId) continue;

    const status = await fetchXeroPaymentStatus(invoice.xeroId);

    if (status === 'PAID') {
      console.log(`[CRON] Invoice ${invoice.xeroId} marked as PAID.`);
      // 1. Create Payment record
      await prisma.payment.create({
        data: { userId: invoice.userId, amount: invoice.amount, currency: invoice.currency, status: 'paid' },
      });

      // 2. Update Invoice status
      await prisma.invoice.update({ where: { id: invoice.id }, data: { status: 'paid', processedAt: new Date() } });

      // 3. Credit creator's balance (after commission)
      const commissions = calculateCommissions({ totalAmount: invoice.amount, talent: {}, agentPolicy: {} });
      await creditCreator(invoice.userId, commissions.creatorPortion);

      // 4. Create Reconciliation and Payout records (simplified)
      await prisma.reconciliation.create({ data: { invoiceId: invoice.id, status: 'completed' } });

      // 5. Announce via Slack/email (placeholder)
      console.log(`[SLACK] Payment of ${invoice.amount} received from ${invoice.brandName}!`);
    }
  }
}

// Schedule to run every hour
cron.schedule('0 * * * *', syncXeroPayments);