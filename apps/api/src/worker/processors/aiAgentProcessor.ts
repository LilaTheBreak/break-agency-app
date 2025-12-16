import { processAIAgentTask } from "../../services/ai/aiAgentService.js";

export default async function aiAgentProcessor(job: any) {
  const { taskId } = job.data || {};
  if (!taskId) {
    console.error("AIAgentProcessor received invalid job payload", job.data);
    return;
  }

  try {
    await processAIAgentTask(taskId);
  } catch (err) {
    console.error("AI Agent Task Failed:", err);
  }
}
