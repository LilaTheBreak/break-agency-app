import prisma from '../../lib/prisma.js';

const AWAIT_THRESHOLD_HOURS = 24;

/**
 * Recalculates the "awaiting reply" status for a given thread.
 * A thread is awaiting reply if the last message was from the creator/agent
 * and a certain amount of time has passed without a brand reply.
 *
 * @param threadId The ID of the DealThread to recalculate.
 */
export async function recalcAwaitingReply(threadId: string) {
  const thread = await prisma.dealThread.findUnique({
    where: { id: threadId },
    include: {
      emails: {
        orderBy: { receivedAt: 'desc' },
      },
    },
  });

  if (!thread || thread.emails.length === 0 || ['CLOSED_WON', 'CLOSED_LOST'].includes(thread.stage)) {
    await prisma.dealThread.update({ where: { id: threadId }, data: { status: 'closed' } }); // Simplified status
    return;
  }

  const lastEmail = thread.emails[0];

  // If the last message was from the brand, we are not awaiting a reply.
  if (lastEmail.isBrand) {
    await prisma.dealThreadEmail.updateMany({ where: { threadId }, data: { awaitingReply: false } });
    return;
  }

  // Check if enough time has passed since the creator sent the last email.
  const hoursSinceSent = (new Date().getTime() - lastEmail.receivedAt.getTime()) / (1000 * 60 * 60);
  const isAwaiting = hoursSinceSent > AWAIT_THRESHOLD_HOURS;

  await prisma.dealThreadEmail.update({
    where: { id: lastEmail.id },
    data: { awaitingReply: isAwaiting },
  });
}