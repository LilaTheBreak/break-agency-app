import prisma from '../lib/prisma.js';
import { extractFinalTerms } from '../services/ai/deal/finalTermsExtractor.js';
import { generateOfferSummary } from '../services/ai/deal/offerSummary.js';
import { generateSOW } from '../services/deals/sowGenerator.js';
import { draftContractFromSOW } from '../services/contracts/contractAutoDraft.js';
import { createSignatureDraft } from '../services/signature/signatureDraft.js';

/**
 * Runs the full deal finalization pipeline.
 * @param threadId - The ID of the negotiation thread to finalize.
 */
export async function runFinalisationPipeline(threadId: string) {
  // 1. Load thread history
  const thread = await prisma.negotiationThread.findUnique({ where: { id: threadId }, include: { messages: true } });
  if (!thread) throw new Error('Negotiation thread not found.');

  const threadHistory = thread.messages.map(m => `${m.sender}: ${m.body}`).join('\n\n');

  // 2. Extract final terms
  const finalTerms = await extractFinalTerms(threadHistory);

  // 3. Generate summary
  const { summary } = await generateOfferSummary(finalTerms);

  // 4. Generate SOW
  const sow = generateSOW({ ...finalTerms, brandName: thread.brandName });

  // 5. Create Contract Draft in DB
  const contractReview = await draftContractFromSOW(sow, { userId: thread.userId, brandName: thread.brandName! });

  // Update the review with the AI summary
  await prisma.contractReview.update({
    where: { id: contractReview.id },
    data: { aiSummary: { summary } },
  });

  // 6. Create Deliverables if they don't exist
  // Placeholder for deliverable creation logic...

  // 7. Create Signature Request Draft
  // First, ensure a parent Contract record exists
  const contract = await prisma.contract.upsert({
    where: { threadId },
    create: { userId: thread.userId, threadId, status: 'draft', terms: sow },
    update: { terms: sow },
  });
  await createSignatureDraft(contract.id, { signerEmail: thread.brandEmail, signerName: thread.brandName! });

  console.log(`[FINALISATION PIPELINE] Successfully generated all assets for thread ${threadId}.`);

  return {
    summary,
    sow,
    contractReviewId: contractReview.id,
  };
}