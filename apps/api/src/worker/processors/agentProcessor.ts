import { executeAgentTask } from "../../agent/agentExecutor.js";

// Phase 3: Fail loudly - throw errors so BullMQ can retry
export default async function agentProcessor(job: any) {
  const taskId = job.data?.taskId;
  if (!taskId) {
    throw new Error(`agentProcessor: missing taskId in job data. Job data: ${JSON.stringify(job.data)}`);
  }
  await executeAgentTask(taskId);
}
