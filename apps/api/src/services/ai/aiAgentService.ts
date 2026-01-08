import prisma from "../../lib/prisma.js";
import { sendSlackAlert } from "../../integrations/slack/slackClient.js";
import { AIAgentTaskStatus } from "../../constants/aiAgentTaskStatus.js";
import { trackAITokens } from "./tokenTracker.js";
import * as insightLLM from "./insightLLM.js";
import * as dealExtractor from "./dealExtractor.js";
import * as negotiationLLM from "./negotiationLLM.js";
import * as inboxReplyEngine from "./inboxReplyEngine.js";
import * as suitabilityLLM from "./suitabilityLLM.js";

export async function processAIAgentTask(taskId: string) {
  const start = Date.now();

  try {
    const task = await prisma.aIAgentTask.findUnique({
      where: { id: taskId }
    });

    if (!task) {
      throw new Error(`Task with ID ${taskId} not found.`);
    }

    await prisma.aIAgentTask.update({
      where: { id: taskId },
      data: { status: AIAgentTaskStatus.RUNNING, startedAt: new Date() },
    });

    let aiResponse = null;
    let attempts = 0;
    while (attempts < 3) {
      attempts += 1;
      aiResponse = await runLLMTask(task);
      if (aiResponse.ok) break;
    }
    if (!aiResponse?.ok) {
      await prisma.aIAgentTask.update({
        where: { id: taskId },
        data: {
          status: AIAgentTaskStatus.FAILED,
          result: { error: "AI task failed after retries" },
        },
      });
      const latency = Date.now() - start;
      return {
        ok: false,
        data: null,
        meta: { tokens: aiResponse?.meta?.tokens ?? 0, latency },
      };
    }
    const result = aiResponse.data;

    const updatedTask = await prisma.aIAgentTask.update({
      where: { id: taskId },
      data: { status: AIAgentTaskStatus.COMPLETED, result },
    });

    // aIAgentExecutionLog model doesn't exist - skipping detailed logging
    // await prisma.aIAgentExecutionLog.create({
    //   data: {
    //     taskId: task.id,
    //     talentId: task.talentId,
    //     action: task.type,
    //     input: task.payload,
    //     output: aiResponse.data,
    //     tokens: aiResponse.meta.tokens,
    //     latency: aiResponse.meta.latency,
    //   },
    // });

    await trackAITokens({
      service: "aiAgentService",
      tokens: aiResponse.meta.tokens,
      userId: task.userId,
      model: aiResponse.meta.model,
    });

    const latency = Date.now() - start;
    return {
      ok: aiResponse.ok,
      data: aiResponse.data,
      meta: {
        tokens: aiResponse.meta.tokens,
        latency,
      },
    };
  } catch (error) {
    const latency = Date.now() - start;
    await prisma.aIAgentTask.update({
      where: { id: taskId },
      data: {
        status: AIAgentTaskStatus.FAILED,
        result: { error: error instanceof Error ? error.message : "Unknown error" },
      },
    });
    await sendSlackAlert("AI Agent task failed", { taskId, error: `${error}` });

    return {
      ok: false,
      data: null,
      meta: {
        tokens: 0,
        latency,
      },
    };
  }
}
async function runLLMTask(task: any) {
  switch (task.type) {
    case "business_summary":
      return insightLLM.generateBusinessSummary(task.payload);
    case "deal_extraction":
      return dealExtractor.extractDealFromEmail(task.payload?.emailBody ?? "");
    case "negotiation_suggestion":
      return negotiationLLM.analyzeNegotiationThread({
        summary: task.payload?.summary,
        talent: task.payload?.talent,
      });
    case "inbox_reply":
      return inboxReplyEngine.generateReplyVariations(task.payload);
    case "suitability_score":
      return suitabilityLLM.analyzeQualitativeSuitability(
        task.payload?.creator,
        task.payload?.brand,
        task.payload?.campaign
      );
    default:
      return { ok: false, data: null, meta: { tokens: 0, latency: 0 } };
  }
}
