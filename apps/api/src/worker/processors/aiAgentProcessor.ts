import { runAIAgentTask } from "../../services/aiAgent/aiAgentRunner.js";

export default async function aiAgentProcessor(job: any) {
  const payload = job.data;
  if (!payload?.type && !payload?.taskId) {
    console.error("AIAgentProcessor received invalid payload", payload);
    return;
  }
  try {
    await runAIAgentTask(payload);
  } catch (err) {
    console.error("AI Agent Task Failed:", err);
    throw err;
  }
}
