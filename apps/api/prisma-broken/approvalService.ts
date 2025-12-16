import prisma from '../../lib/prisma.js';
import { qaQueue } from '../../worker/queues/qaQueue.js';

/**
 * Logs an approval action to the database.
 */
async function logApprovalStep(deliverableId: string, actor: string, action: string, comments?: string, actorId?: string) {
  return prisma.approvalLog.create({
    data: {
      deliverableId,
      actor,
      action,
      comments,
      actorId,
    },
  });
}

/**
 * Sends a Slack notification (stub).
 */
function sendSlackMessage(channel: string, message: string) {
  console.log(`[SLACK STUB] To #${channel}: ${message}`);
}

/**
 * Sends an email with a secure link for brand approval (stub).
 */
async function sendBrandApprovalRequestEmail(deliverableId: string, brandEmail: string) {
  // In a real app, use S75's signatureLinkService to generate a JWT
  const magicToken = `jwt_token_for_${deliverableId}`;
  const approvalLink = `${process.env.WEB_URL}/approve/deliverable/${magicToken}`;
  console.log(`[EMAIL STUB] Sending approval request to ${brandEmail}. Link: ${approvalLink}`);
  // await routeEmail('BRAND_APPROVAL_REQUEST', { to: brandEmail, ... });
}

/**
 * Requests internal manager approval for a deliverable.
 */
export async function requestManagerApproval(deliverableId: string) {
  await prisma.deliverableItem.update({ where: { id: deliverableId }, data: { status: 'pending_manager_approval' } });
  await logApprovalStep(deliverableId, 'ai_agent', 'REQUESTED_REVIEW');
  sendSlackMessage('managers', `Deliverable ${deliverableId} is ready for review.`);
}

/**
 * Approves a deliverable as a manager, sending it to the brand for final approval.
 */
export async function approveAsManager(deliverableId: string, managerId: string) {
  const deliverable = await prisma.deliverableItem.update({ where: { id: deliverableId }, data: { status: 'pending_brand_approval' } });
  await logApprovalStep(deliverableId, 'manager', 'APPROVED', undefined, managerId);

  // Find brand email from the deal
  const deal = await prisma.dealThread.findUnique({ where: { id: deliverable.dealId } });
  if (deal?.brandEmail) {
    await sendBrandApprovalRequestEmail(deliverableId, deal.brandEmail);
  }
}

/**
 * Rejects a deliverable as a manager, sending it back to the creator.
 */
export async function rejectAsManager(deliverableId: string, managerId: string, comments: string) {
  await prisma.deliverableItem.update({ where: { id: deliverableId }, data: { status: 'needs_revision', brandFeedback: { manager: comments } } });
  await logApprovalStep(deliverableId, 'manager', 'REJECTED', comments, managerId);
  sendSlackMessage('creators', `Deliverable ${deliverableId} needs revisions. Comments: ${comments}`);
}

/**
 * Approves a deliverable as the brand, locking it for posting.
 */
export async function approveAsBrand(deliverableId: string, brandEmail: string) {
  const deliverable = await prisma.deliverableItem.findUnique({ where: { id: deliverableId } });
  if (deliverable?.locked) throw new Error('Deliverable is locked and cannot be changed.');

  await prisma.deliverableItem.update({
    where: { id: deliverableId },
    data: { status: 'approved', locked: true },
  });
  await logApprovalStep(deliverableId, 'brand', 'APPROVED', undefined, brandEmail);
  sendSlackMessage('campaigns', `Brand has approved deliverable ${deliverableId}! Ready for posting.`);
}

/**
 * Rejects a deliverable as the brand, sending it back for revision.
 */
export async function rejectAsBrand(deliverableId: string, brandEmail: string, comments: string) {
  const deliverable = await prisma.deliverableItem.findUnique({ where: { id: deliverableId } });
  if (deliverable?.locked) throw new Error('Deliverable is locked and cannot be changed.');

  // Increment version and set status to needs_revision
  await prisma.deliverableItem.update({
    where: { id: deliverableId },
    data: {
      status: 'needs_revision',
      brandFeedback: { brand: comments },
      version: { increment: 1 },
    },
  });
  await logApprovalStep(deliverableId, 'brand', 'REJECTED', comments, brandEmail);

  // Trigger a re-check by the QA engine after the creator submits a new version
  // This would be called on the "submit new version" event.
  // await qaQueue.add('re-check', { deliverableId });
}