import prisma from '../lib/prisma';
import { aiAgentQueue } from './queues';
import { AIAgentTaskStatus } from '../constants/aiAgentTaskStatus';

export async function enqueueAIAgentTask(data: {
  type: string;
  talentId: string;
  emailId?: string;
  dealId?: string;
  payload?: Record<string, unknown>;
}) {
  const task = await prisma.aIAgentTask.create({
    data: {
      taskType: data.type,
      userId: data.talentId, // Map talentId to userId for now
      payload: { ...data.payload, emailId: data.emailId, dealId: data.dealId } as any,
      status: "pending"
    } as any
  });

  await aiAgentQueue.add("run-task", { taskId: task.id });
  return task;
}
