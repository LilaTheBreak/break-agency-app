import { processAIAgentTask } from "../../services/ai/aiAgentService.js";

// Phase 3: This processor is replaced by dealExtractionWorker (which has proper error handling)
// Keeping for reference but it should not be used
export default async function dealExtractionProcessor(job: any) {
  const { taskId } = job.data || {};
  if (!taskId) {
    throw new Error(`dealExtractionProcessor: missing taskId in job data. Job data: ${JSON.stringify(job.data)}`);
  }
  await processAIAgentTask(taskId);
}
