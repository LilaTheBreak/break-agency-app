import prisma from '../lib/prisma.js';

const WAIT_HOURS = {
  WARM: 48,
  COLD: 72,
  HIGH_VALUE: 24,
};

/**
 * Detects if a deal thread is awaiting a reply and updates its status.
 * @param threadId The ID of the DealThread to check.
 */
export async function detectAwaitingReply(threadId: string) {
  const dealDraft = await prisma.dealDraft.findFirst({
    where: { email: { dealDrafts: { some: { id: threadId } } } },
    include: {
      email: {
        include: {
          // Simplified logic: assuming InboundEmail tracks the whole thread
        },
      },
    },
  });

  if (!dealDraft || !dealDraft.lastOutboundEmailAt) {
    return;
  }

  // If brand replied after our last outbound, we are not awaiting a reply.
  if (dealDraft.brandLastReplyAt && dealDraft.brandLastReplyAt > dealDraft.lastOutboundEmailAt) {
    await prisma.dealDraft.update({ where: { id: dealDraft.id }, data: { awaitingReply: false } });
    return;
  }

  // Determine wait time (simplified logic)
  const waitHours = WAIT_HOURS.WARM;
  const now = new Date();
  const followUpDueDate = new Date(dealDraft.lastOutboundEmailAt.getTime() + waitHours * 60 * 60 * 1000);

  if (now > followUpDueDate) {
    console.log(`[FOLLOW-UP DETECTOR] Thread ${threadId} is overdue for a reply.`);
    await prisma.dealDraft.update({
      where: { id: dealDraft.id },
      data: {
        awaitingReply: true,
        recommendedFollowUp: {
          reason: `No reply from brand in over ${waitHours} hours.`,
          recommendedTime: followUpDueDate,
        },
      },
    });
    // Here you would enqueue a job for the follow-up
  }
}