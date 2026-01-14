import { processAIAgentTask } from '../../services/ai/aiAgentService';

// Phase 3: Fail loudly - throw errors so BullMQ can retry
export default async function triageProcessor(job: any) {
  const taskId = job.data?.taskId;
  if (!taskId) {
    throw new Error(`triageProcessor: missing taskId in job data. Job data: ${JSON.stringify(job.data)}`);
  }
  await processAIAgentTask(taskId);
}
