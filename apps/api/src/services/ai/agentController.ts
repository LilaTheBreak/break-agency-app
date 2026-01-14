import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
// import { agentQueue } from '../worker/queues.js';

const AgentTaskSchema = z.object({
  taskName: z.string(),
  context: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Dispatches a task to the AI agent queue.
 */
export async function dispatchAgentTask(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = AgentTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: "Invalid payload", details: parsed.error.flatten() });
    }

    console.log("dispatchAgentTask called with task:", parsed.data.taskName);
    // TODO: Add task to the agent queue
    // await agentQueue.add("runAgentTask", { ...parsed.data, userId: req.user!.id });

    return res.status(202).json({ ok: true, message: "Agent task accepted." });
  } catch (err) {
    console.error("Error in dispatchAgentTask", err);
    next(err);
  }
}