import prisma from "../lib/prisma.js";
import { aiAgentQueue } from "./queues.js";
import { AIAgentTaskStatus } from "../constants/aiAgentTaskStatus.js";

export async function enqueueAIAgentTask(data: {
  type: string;
  talentId: string;
  emailId?: string;
  dealId?: string;
  payload?: Record<string, unknown>;
}) {
  const task = await prisma.aIAgentTask.create({
    data: {
      type: data.type as any,
      talentId: data.talentId,
      emailId: data.emailId ?? null,
      dealId: data.dealId ?? null,
      payload: (data.payload ?? {}) as any,
      status: AIAgentTaskStatus.PENDING
    }
  });

  await aiAgentQueue.add("run-task", { taskId: task.id });
  return task;
}
