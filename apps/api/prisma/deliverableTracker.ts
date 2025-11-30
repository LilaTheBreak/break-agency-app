import prisma from '../../lib/prisma.js';

/**
 * Tracks the status of all deliverables for a given campaign.
 * @param campaignId - The ID of the campaign to track.
 * @returns An object summarizing the status of deliverables.
 */
export async function trackDeliverables(campaignId: string) {
  const deliverables = await prisma.deliverable.findMany({
    where: { campaignId },
  });

  const now = new Date();
  const overdue = deliverables.filter(d => d.dueDate && new Date(d.dueDate) < now && d.status !== 'delivered');
  const dueSoon = deliverables.filter(d => d.dueDate && new Date(d.dueDate) > now && (new Date(d.dueDate).getTime() - now.getTime()) < 3 * 24 * 60 * 60 * 1000 && d.status !== 'delivered');
  const submitted = deliverables.filter(d => d.status === 'submitted');
  const pendingApproval = deliverables.filter(d => d.status === 'pendingApproval');

  console.log(`[DELIVERABLE TRACKER] Campaign ${campaignId}: ${overdue.length} overdue, ${dueSoon.length} due soon.`);

  return {
    overdue,
    dueSoon,
    submitted,
    pendingApproval,
    summary: `Overdue: ${overdue.length}, Due Soon: ${dueSoon.length}, Submitted: ${submitted.length}`,
  };
}