import prisma from "../../lib/prisma.js";

export async function loadAIContext(userId: string) {
  // creatorPersonaProfile, aIAgentMemory, interactionHistory models don't exist
  // Using AIPromptHistory as context source instead
  const promptHistory = await prisma.aIPromptHistory.findMany({
    where: { creatorId: userId },
    orderBy: { createdAt: "desc" },
    take: 50
  });

  return {
    persona: null,
    memories: promptHistory.map(p => ({
      id: p.id,
      userId,
      type: "prompt_history",
      topic: p.category,
      content: p.response,
      importance: p.helpful ? 2 : 1,
      updatedAt: p.createdAt
    })),
    interactions: []
  };
}

export async function storeAIMemory(params: {
  userId: string;
  type: string;
  topic?: string;
  content: any;
  importance?: number;
}) {
  // aIAgentMemory model doesn't exist - storing in AIPromptHistory instead
  return prisma.aIPromptHistory.create({
    data: {
      creatorId: params.userId,
      prompt: params.topic || "memory",
      response: JSON.stringify(params.content),
      category: params.type,
      helpful: params.importance !== undefined ? params.importance > 1 : undefined
    }
  });
}

export async function logInteraction(params: {
  userId: string;
  entity: string;
  entityId?: string;
  summary?: string;
  metadata?: any;
}) {
  // interactionHistory model doesn't exist - logging to AIPromptHistory instead
  return prisma.aIPromptHistory.create({
    data: {
      creatorId: params.userId,
      prompt: `${params.entity}:${params.entityId || 'unknown'}`,
      response: params.summary || "",
      category: params.entity,
      helpful: null
    }
  });
}
