import { Prisma } from "@prisma/client";
import { Router, Request, Response, NextFunction } from "express";
import { getAssistantResponse } from "../services/ai/aiAssistant.js";
import prisma from "../lib/prisma.js";

const router = Router();

router.post("/ai/:role", ensureUser, async (req: Request, res: Response) => {
  const role = req.params.role || "admin";
  const userId = req.user!.id;
  const userInput = String(req.body?.userInput || req.body?.message || "").trim();
  const contextId = typeof req.body?.contextId === "string" ? req.body.contextId : undefined;
  if (!userInput) {
    return res.status(400).json({ error: "userInput is required" });
  }
  try {
    const result = await getAssistantResponse({ role, userId, contextId, userInput });
    await prisma.aiHistory.create({
      data: {
        userId,
        role: result.role,
        prompt: userInput,
        response: result.response,
        context: result.context as Prisma.InputJsonValue
      }
    });
    await pruneHistory(userId);
    res.json({ suggestions: result.response, context: result.context });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "AI assistant unavailable" });
  }
});

function ensureUser(req: Request, res: Response, next: NextFunction) {
  if (!req.user?.id) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

async function pruneHistory(userId: string) {
  const count = await prisma.aiHistory.count({ where: { userId } });
  if (count <= 50) return;
  const oldest = await prisma.aiHistory.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    skip: 50
  });
  const ids = oldest.map((entry) => entry.id);
  if (ids.length) {
    await prisma.aiHistory.deleteMany({ where: { id: { in: ids } } });
  }
}

export default router;
