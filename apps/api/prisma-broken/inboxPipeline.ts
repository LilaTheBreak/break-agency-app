import prisma from '../../../lib/prisma.js';
import { handleAgentEvent } from '../agentOrchestrator.js';
import { runFullNegotiationAI } from '../../ai/aiNegotiationService.js';

/**
 * Pipeline for processing a new inbound email.
 * This would call services from S51 (Brand Reply Engine) and S44 (Auto-Brief).
 */
export async function inboxPipeline(emailId: string) {
  console.log(`[PIPELINE: INBOX] Starting for email ${emailId}`);

  // 1. Classify email (stubbed)
  // 2. Extract entities (stubbed)
  // 3. Create DealDraft (stubbed)
  const dealDraft = await prisma.dealDraft.create({
    data: { userId: 'clxrz45gn000008l4hy285p0g', emailId, brand: 'New Brand from Email' },
  });

  // S93 Integration: Immediately run the negotiation AI on the new draft
  await runFullNegotiationAI(dealDraft.id);

  // 4. Trigger the next event in the orchestrator
  await handleAgentEvent({ type: 'DRAFT_CREATED', payload: { dealDraftId: dealDraft.id, userId: dealDraft.userId } });
}