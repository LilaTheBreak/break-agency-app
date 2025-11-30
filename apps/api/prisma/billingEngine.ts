import prisma from '../../lib/prisma.js';
import { createXeroInvoice } from '../../integrations/xero/xeroClient.js';

/**
 * Generates and sends an invoice for a completed deal.
 * @param dealId - The ID of the DealThread that has been won.
 */
export async function generateInvoiceForDeal(dealId: string) {
  // 1. Load deal, talent, deliverables, agreed rate
  const deal = await prisma.dealThread.findUnique({
    where: { id: dealId },
    include: { dealDraft: true }, // Assuming deal draft has final terms
  });

  if (!deal || deal.stage !== 'CLOSED_WON') {
    throw new Error('Deal is not in a state to be invoiced.');
  }

  const existingInvoice = await prisma.invoice.findFirst({ where: { externalId: `deal_${dealId}` } });
  if (existingInvoice) {
    console.log(`[BILLING] Invoice already exists for deal ${dealId}.`);
    return existingInvoice;
  }

  const dealDraft = deal.dealDraft;
  const amount = dealDraft?.offerValue || 0;

  // 2. Create invoice draft in DB
  const invoiceDraft = await prisma.invoice.create({
    data: {
      userId: deal.userId,
      brandName: deal.brandName,
      brandEmail: deal.brandEmail,
      amount,
      currency: dealDraft?.offerCurrency || 'gbp',
      status: 'draft',
      externalId: `deal_${dealId}`, // Internal reference
    },
  });

  // 3. Build Xero-compliant payload
  const xeroPayload = {
    contactName: deal.brandName || 'Client',
    emailAddress: deal.brandEmail || '',
    lineItems: [{ description: `Services rendered for campaign: ${deal.subjectRoot}`, quantity: 1, unitAmount: amount }],
  };

  // 4. Push invoice to Xero
  const xeroResponse = await createXeroInvoice(xeroPayload);

  // 5. Save Xero invoice ID and update status
  const finalInvoice = await prisma.invoice.update({
    where: { id: invoiceDraft.id },
    data: { status: 'submitted', xeroId: xeroResponse.externalId, xeroUrl: xeroResponse.url },
  });

  console.log(`[BILLING] Created and submitted Xero invoice ${finalInvoice.xeroId} for deal ${dealId}.`);
  return finalInvoice;
}