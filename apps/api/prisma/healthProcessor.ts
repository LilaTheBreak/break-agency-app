import type { Job } from 'bullmq';
import { buildHealthInput, predictCreatorHealth, saveCreatorHealth } from '../../services/ai/aiCreatorHealth.js';

/**
 * Worker to generate an AI health check for a creator.
 * This combines the logic of the three conceptual queues for simplicity.
 */
export default async function healthProcessor(job: Job<{ userId: string; talentId: string }>) {
  const { userId, talentId } = job.data;
  console.log(`[WORKER] Running health check for user: ${userId}`);

  // 1. Build Input
  const input = await buildHealthInput(userId);

  // 2. Predict Health
  const result = await predictCreatorHealth(input) as any;

  // 3. Save Result
  const healthRecord = await saveCreatorHealth(talentId, userId, result);

  // Also save to history
  await prisma.creatorHealthHistory.create({
    data: { healthId: healthRecord.id, snapshot: result },
  });
}