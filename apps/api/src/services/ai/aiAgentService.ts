import prisma from "../../lib/prisma.js";
import { sendSlackAlert } from "../../integrations/slack/slackClient.js";
import { AIAgentTaskStatus } from "@prisma/client";

export async function processAIAgentTask(taskId: string) {
  const task = await prisma.aIAgentTask.findUnique({
    where: { id: taskId },
    include: { talent: { include: { aiSettings: true } } }
  });
  if (!task) return;

  try {
    await prisma.aIAgentTask.update({
      where: { id: taskId },
      data: { status: AIAgentTaskStatus.RUNNING, executedAt: new Date() }
    });

    // Placeholder processing; integrate prompt handlers as needed.
    const result = {
      message: "AI agent processing placeholder",
      type: task.type,
      payload: task.payload
    };

    await prisma.aIAgentTask.update({
      where: { id: taskId },
      data: { status: AIAgentTaskStatus.COMPLETED, result }
    });

    await prisma.aIAgentExecutionLog.create({
      data: {
        taskId: task.id,
        talentId: task.talentId,
        action: task.type,
        input: task.payload,
        output: result
      }
    });
  } catch (error) {
    await prisma.aIAgentTask.update({
      where: { id: taskId },
      data: {
        status: AIAgentTaskStatus.FAILED,
        result: { error: error instanceof Error ? error.message : "Unknown error" }
      }
    });
    await sendSlackAlert("AI Agent task failed", { taskId, error: `${error}` });
  }
}
