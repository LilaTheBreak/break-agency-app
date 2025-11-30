import prisma from '../../lib/prisma.js';
import { buildContractDraft } from '../ai/contracts/contractDraftBuilder.js';
import { runRedlineEngine } from '../ai/contracts/redlineEngine.js';
import { generateNegotiationReply } from '../ai/contracts/negotiationReplyGenerator.js';

/**
 * Generates a full contract from a DealDraft.
 */
export async function generateAIContract(dealDraftId: string) {
  const dealDraft = await prisma.dealDraft.findUnique({
    where: { id: dealDraftId },
    include: { user: { include: { personaProfile: true } } },
  });
  if (!dealDraft) throw new Error('DealDraft not found.');

  const result = await buildContractDraft({
    dealDraft,
    persona: dealDraft.user.personaProfile,
  });

  // Save the result to a new ContractReview record
  return prisma.contractReview.create({
    data: {
      userId: dealDraft.userId,
      brandName: dealDraft.brand,
      aiDealMapping: result.clauses as any,
      aiRisks: result.aiRisks as any,
      status: 'ai_drafted',
    },
  });
}

/**
 * Runs the redline engine on an uploaded brand contract.
 */
export async function reviewBrandContract(contractReviewId: string) {
  const contractReview = await prisma.contractReview.findUnique({
    where: { id: contractReviewId },
  });
  if (!contractReview || !contractReview.rawText) {
    throw new Error('Contract review record or raw text not found.');
  }

  const { aiRisks, aiRedlines } = await runRedlineEngine(contractReview.rawText);

  return prisma.contractReview.update({
    where: { id: contractReviewId },
    data: {
      aiRisks: aiRisks as any,
      aiRedlines: aiRedlines as any,
      status: 'ai_redlined',
    },
  });
}

/**
 * Generates a negotiation reply script based on existing redlines.
 */
export async function generateContractNegotiationReply(contractReviewId: string) {
  const contractReview = await prisma.contractReview.findUnique({
    where: { id: contractReviewId },
    include: { user: { include: { personaProfile: true } } },
  });
  if (!contractReview || !contractReview.aiRedlines) {
    throw new Error('Contract review or redlines not found.');
  }

  const { negotiationScript } = await generateNegotiationReply({
    redlines: contractReview.aiRedlines as any[],
    persona: contractReview.user.personaProfile,
  });

  // In a real app, you might save this to a dedicated field.
  // For now, we can add it to the metadata of the review.
  console.log(`[CONTRACTS] Generated negotiation script for review ${contractReviewId}`);
  return { negotiationScript };
}