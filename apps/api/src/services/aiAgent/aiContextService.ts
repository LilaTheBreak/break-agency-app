import prisma from "../../lib/prisma.js";

export async function loadAIContext(userId: string) {
  const persona = await prisma.creatorPersonaProfile.findUnique({
    where: { userId }
  });

  const memories = await prisma.aIAgentMemory.findMany({
    where: { userId },
    orderBy: [{ importance: "desc" }, { updatedAt: "desc" }],
    take: 50
  });

  const interactions = await prisma.interactionHistory.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 25
  });

  return {
    persona,
    memories,
    interactions
  };
}

export async function storeAIMemory(params: {
  userId: string;
  type: string;
  topic?: string;
  content: any;
  importance?: number;
}) {
  return prisma.aIAgentMemory.create({
    data: {
      userId: params.userId,
      type: params.type,
      topic: params.topic,
      content: params.content,
      importance: params.importance ?? 1
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
  return prisma.interactionHistory.create({
    data: {
      userId: params.userId,
      entity: params.entity,
      entityId: params.entityId,
      summary: params.summary,
      metadata: params.metadata
    }
  });
}
