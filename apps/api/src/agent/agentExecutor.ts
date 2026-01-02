import * as actions from "./actions/index.js";
import prisma from "../lib/prisma.js";
import { loadAgentPolicy } from "./agentPolicy.js";
import { findOrCreateThread } from "./negotiation/findThread.js";
import { recordThreadMessage } from "./negotiation/recordMessage.js";
import { getActiveThreadState } from "./negotiation/getActiveThreadState.js";

export async function executeAgentTask(taskId: string) {
  const task = await prisma.aIAgentTask.findUnique({ where: { id: taskId } });
  if (!task) return;

  const userId = task.userId;
  const policy = await loadAgentPolicy(userId);

  await prisma.aIAgentTask.update({
    where: { id: taskId },
    data: { status: "running", startedAt: new Date(), updatedAt: new Date() }
  });

  try {
    let plan = (task.payload as any)?.plan;
    const context: any = { ...(task.payload as any)?.context, policy };

    const email = context?.email;
    if (email && userId) {
      const thread = await findOrCreateThread(userId, email);
      await recordThreadMessage(thread.id, {
        direction: "inbound",
        subject: email.subject,
        body: email.body,
        snippet: email.snippet,
        raw: email
      });
      const threadState = await getActiveThreadState(thread.id);
      context.thread = thread;
      context.threadState = threadState;
      if (threadState.lastOffer && !plan?.steps?.some((s: any) => s.action === "evaluateOfferAgainstHistory")) {
        plan = { ...plan, steps: [{ action: "evaluateOfferAgainstHistory" }, ...(plan?.steps || [])] };
      }
    }
    const results: any[] = [];

    for (const step of plan?.steps || []) {
      const action = (actions as any)[step.action];
      if (!action) throw new Error(`Unknown action: ${step.action}`);

      const result = await action.run(context);
      results.push({ step: step.action, result });

      if (step.action === "validateCounterOffer" && result?.approved === false) {
        await prisma.aIAgentTask.update({
          where: { id: taskId },
          data: {
            status: "completed",
            result: [...results, { status: "needs_review", reason: "counter_offer_exceeds_policy" }],
            completedAt: new Date(),
            updatedAt: new Date()
          }
        });
        return { status: "needs_review" };
      }

      if (step.action === "evaluateOffer" && result?.strategy?.riskLevel === "high") {
        await prisma.aIAgentTask.update({
          where: { id: taskId },
          data: {
            status: "completed",
            result: [...results, { status: "needs_review", reason: "high_risk_negotiation" }],
            completedAt: new Date(),
            updatedAt: new Date()
          }
        });
        return { status: "needs_review" };
      }

      if (step.action === "evaluateOfferAgainstHistory" && result?.shouldCounter === false) {
        await prisma.aIAgentTask.update({
          where: { id: taskId },
          data: {
            status: "completed",
            result: [...results, { status: "no_action", reason: "counter_not_advised" }],
            completedAt: new Date(),
            updatedAt: new Date()
          }
        });
        return { status: "no_action" };
      }
    }

    // Note: negotiationThread model doesn't exist - commenting out
    // if (context?.thread?.id) {
    //   await prisma.negotiationThread.update({
    //     where: { id: context.thread.id },
    //     data: { status: "closed" }
    //   });
    // }

    await prisma.aIAgentTask.update({
      where: { id: taskId },
      data: {
        status: "completed",
        result: results,
        completedAt: new Date(),
        updatedAt: new Date()
      }
    });

    return results;
  } catch (error: any) {
    await prisma.aIAgentTask.update({
      where: { id: taskId },
      data: {
        status: "failed",
        error: String(error),
        completedAt: new Date(),
        updatedAt: new Date()
      }
    });
    throw error;
  }
}
