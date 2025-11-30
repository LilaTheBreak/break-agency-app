import type { Job } from 'bullmq';
import prisma from '../../lib/prisma.js';
import { extractOfferFromEmail, generateCounterOffer, logNegotiationDecision } from '../../services/ai/aiNegotiationEngine.js';
import { negotiationCounterOfferQueue } from '../queues/negotiationClosingQueues.js';

/**
 * Worker to run the negotiation analysis and decision pipeline.
 */
export default async function negotiationClosingProcessor(job: Job<{ sessionId: string }>) {
  const { sessionId } = job.data;
  console.log(`[WORKER] Running negotiation closing engine for session: ${sessionId}`);

  // 1. Extract Offer & Check Policy
  const session = await prisma.negotiationSession.findUnique({
    where: { id: sessionId },
    include: { user: { include: { agentPolicy: true } }, messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
  });
  if (!session || !session.messages[0]) throw new Error('Session or message not found.');

  const analysis = await extractOfferFromEmail({
    emailBody: session.messages[0].body || '',
    policy: session.user.agentPolicy,
  }) as any;

  if (!analysis.compliance.isCompliant) {
    console.warn(`[WORKER] Offer for session ${sessionId} is not compliant. Halting auto-negotiation.`);
    await logNegotiationDecision(sessionId, { decisionType: 'HALT', reasoning: 'Offer not compliant with policy.' });
    return;
  }

  // 2. Generate Counter-Offer
  const { counterOffer } = await generateCounterOffer({
    offerValue: analysis.offer.value,
    creatorTier: 'A', // This would come from the talent's profile
  });

  // 3. Draft Message & Save Decision
  // In a real pipeline, this would call another service to draft the message body.
  const finalMessage = counterOffer.script;

  await logNegotiationDecision(sessionId, {
    decisionType: 'COUNTER_OFFER',
    reasoning: counterOffer.justification,
    chosenCounterOffer: counterOffer,
    generatedMessage: finalMessage,
  });

  console.log(`[WORKER] Negotiation analysis for session ${sessionId} complete.`);
}