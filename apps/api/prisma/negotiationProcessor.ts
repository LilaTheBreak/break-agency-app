import type { Job } from 'bullmq';
import prisma from '../../lib/prisma.js';
import { generateNegotiationStrategy } from '../../services/ai/negotiation/negotiationStrategist.js';
import { draftNegotiationMessage } from '../../services/ai/negotiation/negotiationWriter.js';
import { routeAIGeneratedReply } from '../../services/email/replyRouter.js';

/**
 * Worker to run the full AI negotiation pipeline for a thread.
 */
export default async function negotiationProcessor(job: Job<{ threadId: string }>) {
  const { threadId } = job.data;
  console.log(`[WORKER] Running negotiation engine for thread: ${threadId}`);

  // 1. Load Context
  const thread = await prisma.negotiationThread.findUnique({
    where: { id: threadId },
    include: {
      messages: { orderBy: { createdAt: 'desc' } },
      user: { include: { agentPolicy: true, personaProfile: true, talents: true } },
    },
  });
  if (!thread || !thread.user) throw new Error('Negotiation context not found.');

  const history = thread.messages.map(m => `${m.sender}: ${m.body}`).join('\n\n');

  // 2. Generate Strategy
  const strategy = await generateNegotiationStrategy({
    history,
    creatorTier: 'A', // This would be dynamic
    policy: thread.user.agentPolicy,
  }) as any;

  // 3. Draft Message (with Persona)
  const message = await draftNegotiationMessage({
    strategy: { ...strategy, subject: thread.messages[0].subject },
    justification: strategy.justification,
    persona: thread.user.personaProfile,
  });

  // 4. Route Reply (Auto-send or save as suggestion)
  await routeAIGeneratedReply(
    { aiSubject: message.subject, aiBody: message.body, autoSend: true, confidence: strategy.confidence },
    {
      email: { id: `negotiation_${thread.id}` }, // Create a context object for the router
      dealThread: thread,
      talent: thread.user.talents[0],
      policy: thread.user.agentPolicy,
    }
  );

  // 5. Update Thread
  await prisma.negotiationThread.update({
    where: { id: threadId },
    data: { lastAiAction: { decision: strategy.decision, at: new Date() } },
  });
}