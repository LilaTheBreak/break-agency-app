import { processAIAgentTask } from "../../services/ai/aiAgentService.js";

export default async function dealExtractionProcessor(job: any) {
  try {
    const { taskId } = job.data || {};
    if (taskId) {
      await processAIAgentTask(taskId);
    } else {
      console.warn("dealExtractionProcessor: missing taskId.", job.data);
    }
  } catch (err) {
    console.error("dealExtractionProcessor failed:", err);
  }
}
