import prisma from '../../lib/prisma.js';
import { loadNegotiationState, saveNegotiationState } from './strategyMemory.js';
import { updateBrandNegotiationStats } from './brandModel.js';
import { aiClient } from '../ai/aiClient.js';

const scripts = {
  pushback: "Thanks for your feedback on the rate. Based on the creator's current market value and engagement, our proposed rate is competitive. However, we're happy to explore adjusting the scope to meet your budget.",
  closing: "That's great to hear! We're excited to move forward. I'll prepare the contract with the agreed-upon terms and send it over shortly.",
};

/**
 * Runs a single turn in the autonomous negotiation chain.
 * @param threadId - The ID of the negotiation thread.
 */
export async function runNegotiationChain(threadId: string) {
  // 1. Load state and context
  const state = await loadNegotiationState(threadId);
  const thread = await prisma.negotiationThread.findUnique({ where: { id: threadId } });
  const lastBrandMessage = await prisma.negotiationMessage.findFirst({
    where: { threadId, sender: 'brand' },
    orderBy: { createdAt: 'desc' },
  });

  if (!thread || !lastBrandMessage) throw new Error('Context not found.');

  // 2. Detect scenario (simplified)
  const scenario = lastBrandMessage.body.toLowerCase().includes('budget') ? 'pushback' : 'closing';

  // 3. Choose script and create email
  const script = scripts[scenario];
  const { reply } = await aiClient.json(`Customize this script: "${script}". Respond with JSON: { "reply": "..." }`) as any;

  // 4. Validate and send (or draft)
  const policy = await prisma.agentPolicy.findFirst({ where: { userId: thread.userId } });
  if (policy?.sandboxMode) {
    console.log(`[CHAIN ENGINE] Sandbox mode: Drafting reply for thread ${threadId}`);
  } else {
    console.log(`[CHAIN ENGINE] Sending reply for thread ${threadId}`);
    // Real email sending logic would go here
  }

  // 5. Update state and brand profile
  await saveNegotiationState(threadId, {
    ...state,
    followUpCount: 0, // Reset follow-up counter after a reply
    lastActionAt: new Date(),
  });
  await updateBrandNegotiationStats(thread.brandEmail, lastBrandMessage.body);

  // 6. Log the message
  await prisma.negotiationMessage.create({
    data: { threadId, sender: 'ai', body: reply, aiGenerated: true, status: 'sent' },
  });

  // 7. Enqueue silence monitor (placeholder for a delayed job)
  console.log(`[CHAIN ENGINE] Enqueuing silence monitor for thread ${threadId} in 48 hours.`);
}