import * as actions from "./actions/index.js";
import prisma from "../lib/prisma.js";
import { loadAgentPolicy } from "./agentPolicy.js";
import { findOrCreateThread } from "./negotiation/findThread.js";
import { recordThreadMessage } from "./negotiation/recordMessage.js";
import { getActiveThreadState } from "./negotiation/getActiveThreadState.js";

export async function executeAgentTask(taskId: string) {
  const task = await prisma.agentTask.findUnique({ where: { id: taskId } });
  if (!task) return;

  const userId = task.userId!;
  const policy = await loadAgentPolicy(userId);

  await prisma.agentTask.update({
    where: { id: taskId },
    data: { status: "running" }
  });

  try {
    let plan = (task.input as any)?.plan;
    const context: any = { ...(task.input as any)?.context, policy };

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
        await prisma.agentTask.update({
          where: { id: taskId },
          data: {
            status: "success",
            output: [...results, { status: "needs_review", reason: "counter_offer_exceeds_policy" }]
          }
        });
        return { status: "needs_review" };
      }

      if (step.action === "evaluateOffer" && result?.strategy?.riskLevel === "high") {
        await prisma.agentTask.update({
          where: { id: taskId },
          data: {
            status: "success",
            output: [...results, { status: "needs_review", reason: "high_risk_negotiation" }]
          }
        });
        return { status: "needs_review" };
      }

      if (step.action === "evaluateOfferAgainstHistory" && result?.shouldCounter === false) {
        await prisma.agentTask.update({
          where: { id: taskId },
          data: {
            status: "success",
            output: [...results, { status: "no_action", reason: "counter_not_advised" }]
          }
        });
        return { status: "no_action" };
      }
    }

    if (context?.thread?.id) {
      await prisma.negotiationThread.update({
        where: { id: context.thread.id },
        data: { status: "closed" }
      });
    }

    await prisma.agentTask.update({
      where: { id: taskId },
      data: {
        status: "success",
        output: results
      }
    });

    return results;
  } catch (error: any) {
    await prisma.agentTask.update({
      where: { id: taskId },
      data: {
        status: "error",
        error: String(error)
      }
    });
    throw error;
  }
}
