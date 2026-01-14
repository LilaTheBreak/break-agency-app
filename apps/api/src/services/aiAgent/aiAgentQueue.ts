import { aiAgentQueue } from '../../worker/queues';

export async function enqueueAIAgentTask(task: {
  type: "INBOX_REPLY" | "NEGOTIATE_DEAL" | "OUTREACH";
  userId: string;
  emailId?: string;
  dealId?: string;
  targetBrand?: string;
  payload?: Record<string, unknown>;
}) {
  return aiAgentQueue.add("aiAgentTask", task, {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: true,
    removeOnFail: false
  });
}
