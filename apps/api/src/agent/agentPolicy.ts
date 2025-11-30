import prisma from "../lib/prisma.js";

export async function loadAgentPolicy(userId: string) {
  let policy = await prisma.agentPolicy.findUnique({ where: { userId } });

  if (!policy) {
    policy = await prisma.agentPolicy.create({
      data: { userId }
    });
  }

  return policy;
}
