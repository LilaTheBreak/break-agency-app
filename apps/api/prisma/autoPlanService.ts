import prisma from '../../lib/prisma.js';
import { parseContractForPlan } from '../../integrations/ai/aiDeliverableParser.js';

/**
 * Notifies Slack about the newly generated plan (stub).
 */
function notifySlack(plan: any, campaign: any) {
  console.log(`
  [SLACK NOTIFICATION]
  --------------------
  New Campaign Plan Generated for: ${campaign.title}
  - Deliverables: ${plan.deliverables.length}
  - Timeline Stages: ${plan.timeline.length}
  - Key Risk: Manual check on deadlines recommended.
  - Required Approvals: Final content review.
  --------------------
  `);
}

/**
 * The main orchestrator for the auto-plan generation pipeline.
 * @param contractReviewId - The ID of the signed and reviewed contract.
 */
export async function generatePlan(contractReviewId: string) {
  // 1. Load ContractReview and related data
  const review = await prisma.contractReview.findUnique({ where: { id: contractReviewId }, include: { user: true } });
  if (!review || !review.rawText) {
    throw new Error('Contract review not found or has no text.');
  }

  // 2. Parse contract with AI to get a structured plan
  const plan = await parseContractForPlan(review.rawText) as any;

  // 3. Create a Campaign and CampaignAutoPlan record
  const campaign = await prisma.campaign.create({
    data: {
      title: `Campaign for ${review.brandName}`,
      ownerId: review.userId,
      stage: 'PLANNING',
    },
  });

  const autoPlan = await prisma.campaignAutoPlan.create({
    data: {
      campaignId: campaign.id,
      createdBy: 'ai_agent_s89',
      aiSummary: { summary: `Auto-generated plan with ${plan.deliverables.length} deliverables.` },
      aiTimeline: plan.timeline,
      aiDeliverables: plan.deliverables,
    },
  });

  // 4. Create DeliverableItem records
  if (plan.deliverables && plan.deliverables.length > 0) {
    await prisma.deliverableItem.createMany({
      data: plan.deliverables.map((d: any) => ({
        dealId: 'some_deal_id', // This needs to be linked from the contract review
        type: d.type,
        caption: d.description,
        status: 'draft',
      })),
    });
  }

  // 5. Create Task records
  if (plan.creatorTasks && plan.creatorTasks.length > 0) {
    await prisma.creatorTask.createMany({
      data: plan.creatorTasks.map((t: any) => ({ userId: review.userId, title: t.task, taskType: 'RECORD_VIDEO', dueDate: new Date(t.dueDate) })),
    });
  }

  // 6. Notify team
  notifySlack(plan, campaign);

  console.log(`[AUTO-PLAN SERVICE] Successfully generated plan for campaign ${campaign.id}.`);
  return autoPlan;
}