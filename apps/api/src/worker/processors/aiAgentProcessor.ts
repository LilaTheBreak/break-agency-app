import { processAIAgentTask } from "../../services/ai/aiAgentService.js";

// Phase 3: Fail loudly - throw errors so BullMQ can retry
export default async function aiAgentProcessor(job: any) {
  const { taskId } = job.data || {};
  if (!taskId) {
    throw new Error(`AIAgentProcessor: missing taskId in job data. Job data: ${JSON.stringify(job.data)}`);
  }

  await processAIAgentTask(taskId);
}
