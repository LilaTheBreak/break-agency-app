import { processAIAgentTask } from "../../services/ai/aiAgentService.js";

export default async function triageProcessor(job: any) {
  const taskId = job.data?.taskId;
  if (!taskId) {
    console.warn("triageProcessor skipped: no taskId", job.data);
    return;
  }
  try {
    await processAIAgentTask(taskId);
  } catch (err) {
    console.error("triageProcessor failed:", err);
  }
}
