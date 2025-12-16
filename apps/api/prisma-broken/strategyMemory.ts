import prisma from '../../lib/prisma.js';

const defaultState = {
  status: 'paused', // 'running', 'paused', 'completed'
  followUpCount: 0,
  lastActionAt: new Date(),
};

/**
 * Loads the current state of a negotiation thread.
 * @param threadId - The ID of the negotiation thread.
 */
export async function loadNegotiationState(threadId: string) {
  const thread = await prisma.negotiationThread.findUnique({ where: { id: threadId } });
  if (!thread) throw new Error('Negotiation thread not found.');
  return { ...defaultState, ...(thread.state as object || {}) };
}

/**
 * Saves an updated state to a negotiation thread.
 * @param threadId - The ID of the negotiation thread.
 * @param state - The new state object to save.
 */
export async function saveNegotiationState(threadId: string, state: any) {
  return prisma.negotiationThread.update({
    where: { id: threadId },
    data: { state },
  });
}