import prisma from '../../lib/prisma';
import type { EmailClassification } from './classifyEmail';

/**
 * Creates a DealDraft in the database from an email classification.
 * @param emailId The ID of the InboundEmail.
 * @param userId The ID of the user.
 * @param classification The structured data from the AI.
 * @returns The newly created DealDraft record.
 */
export async function createDealDraft(
  emailId: string,
  userId: string,
  classification: EmailClassification
) {
  if (classification.category !== "deal" || !classification.brand) {
    return null;
  }

  const dealDraft = await prisma.dealDraft.create({
    data: {
      userId,
      emailId,
      brand: classification.brand,
      offerType: classification.offerType,
      deliverables: classification.extracted.deliverables || [],
      paymentAmount: classification.extracted.budget,
      currency: classification.extracted.currency,
      deadline: classification.deadline ? new Date(classification.deadline) : null,
      confidence: classification.confidence,
      rawJson: classification
    }
  });

  console.log(`[DEAL DRAFT] Created draft ${dealDraft.id} for brand ${classification.brand}`);
  return dealDraft;
}