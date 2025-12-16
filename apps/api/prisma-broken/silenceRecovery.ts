import prisma from '../../lib/prisma.js';
import { aiClient } from '../ai/aiClient.js';
import { loadNegotiationState, saveNegotiationState } from './strategyMemory.js';

const followupScripts = [
  "Just wanted to gently follow up on my previous email. Let me know if you have any questions!",
  "Circling back on this. Are you still interested in moving forward?",
  "Following up one last time on this opportunity. If I don't hear back, I'll assume the timing isn't right.",
];

/**
 * Handles periods of silence in a negotiation thread by sending a follow-up.
 * @param threadId - The ID of the negotiation thread.
 */
export async function handleSilence(threadId: string) {
  const state = await loadNegotiationState(threadId) as any;
  const thread = await prisma.negotiationThread.findUnique({ where: { id: threadId } });

  if (!thread || state.status !== 'running') {
    console.log(`[SILENCE RECOVERY] Thread ${threadId} is paused. Skipping follow-up.`);
    return;
  }

  const followUpIndex = Math.min(state.followUpCount, followupScripts.length - 1);
  const script = followupScripts[followUpIndex];

  // In a real app, you'd use a proper email service.
  console.log(`[SILENCE RECOVERY] Sending follow-up to ${thread.brandEmail}: "${script}"`);

  // Update state
  await saveNegotiationState(threadId, {
    ...state,
    followUpCount: state.followUpCount + 1,
    lastActionAt: new Date(),
  });

  // Log the action
  await prisma.negotiationMessage.create({
    data: { threadId, sender: 'ai', body: script, aiGenerated: true, status: 'sent' },
  });
}