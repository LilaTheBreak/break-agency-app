import type { Job } from 'bullmq';
import prisma from '../../lib/prisma.js';
import { generateNegotiationStrategy } from '../../services/negotiation/v2/strategyEngine.js';
import { runOfferSimulation } from '../../services/negotiation/v2/simulationEngine.js';
import { generateNegotiationReply } from '../../services/negotiation/v2/responseGenerator.js';

/**
 * Worker to run the full v2 negotiation pipeline.
 */
export default async function negotiationV2Processor(job: Job<{ threadId: string }>) {
  const { threadId } = job.data;
  console.log(`[WORKER V2] Running negotiation engine for thread: ${threadId}`);

  // 1. Load Context
  const thread = await prisma.negotiationThread.findUnique({
    where: { id: threadId },
    include: { messages: { orderBy: { createdAt: 'desc' } }, user: { include: { agentPolicy: true, personaProfile: true } } },
  });
  if (!thread || !thread.user) throw new Error('Negotiation context not found.');

  // 2. Strategy Engine
  const strategy = await generateNegotiationStrategy({
    history: thread.messages.map(m => m.body).join('\n'),
    policy: thread.user.agentPolicy,
  }) as any;

  // 3. Simulation Engine
  const simulation = await runOfferSimulation({
    offer: strategy.openingMove.value,
    brandProfile: { industry: 'Fashion', negotiationStyle: 'Aggressive' }, // Mocked
  });

  // 4. Response Generator
  const reply = await generateNegotiationReply({
    strategy,
    simulation,
    persona: thread.user.personaProfile,
  });

  // 5. Save all artifacts to the session/thread
  const sessionId = thread.messages[0].sessionId; // Assuming a link exists
  if (sessionId) {
    await prisma.negotiationSession.update({
      where: { id: sessionId },
      data: { strategy, simulation },
    });
  }

  // In a real app, this would now either auto-send or save as a suggestion
  console.log(`[WORKER V2] Generated reply for thread ${threadId}:`, reply);
}