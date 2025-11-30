import type { Job } from 'bullmq';
import prisma from '../../lib/prisma.js';
import { analyzeDeliverable } from '../../services/ai/aiDeliverable.js';

/**
 * Worker to run the full AI QA pipeline for a deliverable.
 */
export default async function deliverableQualityProcessor(job: Job<{ deliverableId: string }>) {
  const { deliverableId } = job.data;
  console.log(`[WORKER] Running deliverable QA for: ${deliverableId}`);

  // 1. Extract Content and Context
  const deliverable = await prisma.deliverable.findUnique({
    where: { id: deliverableId },
    include: { campaign: { include: { brandLinks: { include: { brand: { include: { policies: { include: { versions: { take: 1, orderBy: { version: 'desc' } } } } } } } } } } },
  });
  if (!deliverable) throw new Error('Deliverable not found.');

  const context = {
    caption: deliverable.description || '',
    brandGuidelines: deliverable.campaign?.brandLinks[0]?.brand.policies[0]?.versions[0]?.rules || {},
    briefRequirements: deliverable.campaign?.deliverablePlan || {}, // Assuming brief reqs are on the campaign
  };

  // Create/update the report status
  const report = await prisma.deliverableQualityReport.upsert({
    where: { deliverableId },
    create: { deliverableId, status: 'running' },
    update: { status: 'running' },
  });

  // 2. Run the AI Analysis
  const analysis = await analyzeDeliverable(context) as any;

  // 3. Save the Report
  const { scores, issues, suggestedRewrites, predictedPerformance } = analysis;
  const overallScore = (scores.brandGuidelinesScore + scores.briefRequirementsScore + scores.complianceScore + scores.brandSafetyScore) / 4;

  await prisma.deliverableQualityReport.update({
    where: { id: report.id },
    data: {
      status: 'completed',
      overallScore,
      ...scores,
      suggestedRewrites,
      predictedPerformance,
    },
  });

  // Clear old issues and save new ones
  await prisma.deliverableQualityIssue.deleteMany({ where: { reportId: report.id } });
  if (issues && issues.length > 0) {
    await prisma.deliverableQualityIssue.createMany({
      data: issues.map((issue: any) => ({
        reportId: report.id,
        ...issue,
      })),
    });
  }

  console.log(`[WORKER] QA for deliverable ${deliverableId} complete. Score: ${overallScore.toFixed(0)}`);
}