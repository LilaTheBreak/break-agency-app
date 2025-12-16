import prisma from '../../lib/prisma.js';
import { runQAReview } from '../../integrations/ai/aiQAClient.js';

/**
 * Notifies Slack about high-risk QA results (stub).
 */
function notifySlackIfRisk(deliverableId: string, report: any) {
  const highRiskIssues = report.issues.filter((issue: any) => issue.severity === 'high');
  if (highRiskIssues.length > 0) {
    console.log(`[SLACK NOTIFICATION] High-risk issue found in deliverable ${deliverableId}: ${highRiskIssues[0].description}`);
  }
}

/**
 * The main orchestrator for the deliverable QA pipeline.
 * @param deliverableId - The ID of the deliverable to review.
 */
export async function reviewDeliverable(deliverableId: string) {
  // 1. Load all necessary context
  const deliverable = await prisma.deliverableItem.findUnique({
    where: { id: deliverableId },
    include: {
      deal: { include: { user: { include: { personaProfile: true } }, contract: { include: { versions: { take: 1, orderBy: { version: 'desc' } } } } } },
    },
  });

  if (!deliverable || !deliverable.deal.user) {
    throw new Error('Deliverable or its associated context not found.');
  }

  await prisma.deliverableItem.update({ where: { id: deliverableId }, data: { aiQaStatus: 'running' } });

  // 2. Assemble the input for the AI
  const context = {
    caption: deliverable.caption || '',
    imageUrl: deliverable.fileUrl, // Assuming fileId is resolved to a URL
    contractRules: deliverable.deal.contract?.versions[0]?.rules || {},
    persona: deliverable.deal.user.personaProfile || {},
    deliverableMetadata: { type: deliverable.type, platform: 'Instagram' },
  };

  // 3. Run the AI QA review
  const report = await runQAReview(context) as any;

  // 4. Save the review to the database
  await prisma.deliverableItem.update({
    where: { id: deliverableId },
    data: {
      aiQaReport: report,
      aiQaStatus: 'completed',
      aiQaScore: report.overallScore,
      aiQaRisks: report.issues,
    },
  });

  // 5. Create a historical record of this QA run
  await prisma.deliverableQAHistory.create({
    data: {
      deliverableId,
      type: 'AUTOMATED_QA',
      summary: report.summary,
      details: report,
      score: report.overallScore,
    },
  });

  // 6. Trigger notifications if necessary
  notifySlackIfRisk(deliverableId, report);

  console.log(`[AI QA SERVICE] Successfully reviewed deliverable ${deliverableId}. Score: ${report.overallScore}`);
  return report;
}