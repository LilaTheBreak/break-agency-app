import { Router } from "express";
import prisma from '../lib/prisma';
import { agentQueue } from '../worker/queues';
import { generateAgentPlan } from '../agent/agentPlan';
import { loadAgentPolicy } from '../agent/agentPolicy';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post("/run", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const { email } = req.body ?? {};
    const policy = await loadAgentPolicy(userId);

    const llm = (req as any).llm;

    const plan = await generateAgentPlan({
      email,
      user: req.user,
      llm,
      policy
    });

    const task = await prisma.aIAgentTask.create({
      data: {
        id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        taskType: "agent-plan", // AIAgentTask uses taskType, not type
        payload: { plan, context: { email, user: req.user, llm } }, // AIAgentTask uses payload, not input
        status: "pending",
        updatedAt: new Date(),
      }
    });

    await agentQueue.add("agent-task", { taskId: task.id });

    return res.json({ taskId: task.id, plan });
  } catch (error) {
    next(error);
  }
});

export default router;
