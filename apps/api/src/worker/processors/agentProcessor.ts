import { executeAgentTask } from "../../agent/agentExecutor.js";

export default async function agentProcessor(job: any) {
  const taskId = job.data?.taskId;
  if (!taskId) return;
  await executeAgentTask(taskId);
}
