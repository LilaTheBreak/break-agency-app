import prisma from '../../lib/prisma.js';
import { followUpQueue } from '../../worker/queues/followUpQueue.js';
import { generateBrandFollowUp } from '../ai/aiFollowUpService.js';

const FOLLOW_UP_DELAY = 48 * 60 * 60 * 1000; // 48 hours in ms
const MAX_FOLLOW_UPS = 3;

/**
 * Schedules the first follow-up check for a deliverable sent to a brand.
 */
export async function scheduleBrandFollowUp(deliverableId: string) {
  const deliverable = await prisma.deliverableItem.findUnique({ where: { id: deliverableId } });
  if (!deliverable || deliverable.status !== 'pending_brand_approval') {
    console.warn(`[FOLLOW-UP] Deliverable ${deliverableId} not in a state to schedule follow-up.`);
    return;
  }

  await prisma.deliverableItem.update({
    where: { id: deliverableId },
    data: { brandApprovalRequestedAt: new Date(), autoFollowUpEnabled: true },
  });

  await followUpQueue.add('check-brand-response', { deliverableId }, { delay: FOLLOW_UP_DELAY });
  console.log(`[FOLLOW-UP] Scheduled first follow-up check for deliverable ${deliverableId}.`);
}

/**
 * Cancels all pending follow-up jobs for a deliverable.
 * This is called when a brand replies.
 */
export async function cancelFollowUps(deliverableId: string) {
  await prisma.deliverableItem.update({ where: { id: deliverableId }, data: { autoFollowUpEnabled: false } });
  // Logic to remove jobs from BullMQ queue would go here.
  console.log(`[FOLLOW-UP] Canceled all future follow-ups for deliverable ${deliverableId}.`);
}

/**
 * Escalates a non-responsive deliverable to a human manager.
 */
async function escalateNonResponse(deliverableId: string) {
  console.log(`[FOLLOW-UP] Escalating deliverable ${deliverableId} due to non-response.`);
  await prisma.deliverableItem.update({ where: { id: deliverableId }, data: { status: 'escalated_unresponsive' } });
  // Send Slack message
  console.log(`[SLACK STUB] To #managers: Deliverable ${deliverableId} has not received a brand response after ${MAX_FOLLOW_UPS} follow-ups. Please review.`);
}

/**
 * The core job runner that checks, sends, and reschedules follow-ups.
 */
export async function runFollowUpJob(deliverableId: string) {
  const deliverable = await prisma.deliverableItem.findUnique({ where: { id: deliverableId } });

  // 1. Validate state: If deliverable is no longer pending or auto-follow-ups are disabled, stop.
  if (!deliverable || deliverable.status !== 'pending_brand_approval' || !deliverable.autoFollowUpEnabled) {
    console.log(`[FOLLOW-UP] Halting follow-up for deliverable ${deliverableId} as it's no longer pending or is disabled.`);
    return;
  }

  // 2. Check follow-up count and escalate if needed
  if (deliverable.followUpCount >= MAX_FOLLOW_UPS) {
    await escalateNonResponse(deliverableId);
    return;
  }

  // 3. Generate and send the follow-up email
  console.log(`[FOLLOW-UP] Sending follow-up #${deliverable.followUpCount + 1} for deliverable ${deliverableId}.`);
  const deal = await prisma.dealThread.findUnique({ where: { id: deliverable.dealId } });
  const { subject, body } = await generateBrandFollowUp({
    brandName: deal?.brandName,
    deliverableType: deliverable.type,
    followUpCount: deliverable.followUpCount,
  }) as any;

  // await routeEmail('BRAND_FOLLOW_UP', { to: deal.brandEmail, subject, body });

  // 4. Update deliverable state and log the action
  await prisma.deliverableItem.update({
    where: { id: deliverableId },
    data: {
      followUpCount: { increment: 1 },
      lastBrandFollowUpAt: new Date(),
    },
  });
  await prisma.approvalLog.create({ data: { deliverableId, actor: 'ai_agent', action: 'SENT_FOLLOW_UP' } });

  // 5. Schedule the next follow-up
  await followUpQueue.add('check-brand-response', { deliverableId }, { delay: FOLLOW_UP_DELAY });
}