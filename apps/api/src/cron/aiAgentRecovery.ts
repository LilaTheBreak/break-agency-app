import prisma from '../lib/prisma.js';
import { aiAgentQueue } from '../worker/queues.js';

export async function recoverAIAgentTasks() {
  const tasks = await prisma.aIAgentTask.findMany({
    where: {
      status: { in: ["PENDING", "FAILED"] }
    },
    take: 50
  });

  for (const task of tasks) {
    await aiAgentQueue.add("run-task", { taskId: task.id });
  }

  return { recovered: tasks.length };
}
