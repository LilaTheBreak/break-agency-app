import type { Job } from 'bullmq';
import prisma from '../../lib/prisma.js';
import { qaAnalyzeDeliverable } from '../../agent/deliverables/deliverableQaEngine.js';

/**
 * Worker to run the full AI QA pipeline for a deliverable.
 */
export default async function deliverableQaProcessor(job: Job<{ deliverableId: string }>) {
  const { deliverableId } = job.data;
  console.log(`[WORKER] Running deliverable QA for: ${deliverableId}`);

  await prisma.deliverableItem.update({ where: { id: deliverableId }, data: { aiQaStatus: 'running' } });

  const deliverable = await prisma.deliverableItem.findUnique({ where: { id: deliverableId } });
  if (!deliverable) throw new Error('Deliverable not found for QA.');

  // 1. Run the full analysis
  const report = await qaAnalyzeDeliverable(deliverable) as any;

  // 2. Update the DeliverableItem with the report
  await prisma.deliverableItem.update({
    where: { id: deliverableId },
    data: {
      aiQaReport: report,
      aiQaStatus: 'completed',
      aiQaScore: report.overallScore,
      aiQaPerformance: report.performancePrediction,
      aiQaRisks: report.risks,
    },
  });

  // 3. Log this run to the history table
  await prisma.deliverableQAHistory.create({
    data: {
      deliverableId,
      type: 'INITIAL_QA',
      summary: report.summary,
      details: report,
      score: report.overallScore,
    },
  });
}