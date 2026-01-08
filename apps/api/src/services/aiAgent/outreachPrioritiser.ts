import prisma from "../../lib/prisma.js";

export async function buildOutreachPlan(userId: string) {
  const brands = await prisma.brandIntelligence.findMany({
    take: 200,
    orderBy: { updatedAt: "desc" }
  });

  const weights = {
    recency: 0.5,
    categoryFit: 0.3,
    engagementHistory: 0.2
  };

  const scored = brands.map((b) => {
    const recencyDays = (Date.now() - new Date(b.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
    const recencyScore = Math.max(0, 100 - recencyDays);
    const categoryFit = (b.insights as any)?.fitScore || 0;
    const engagement = (b.insights as any)?.replyRate || 0;

    const score =
      weights.recency * recencyScore +
      weights.categoryFit * categoryFit +
      weights.engagementHistory * engagement;

    return { ...b, score };
  });

  const top = scored
    .filter((b) => b.score > 10)
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

  const created = [];

  for (const b of top) {
    const exists = await prisma.outreachPlan.findFirst({
      where: { userId, brandName: b.brandName, status: "pending" }
    });
    if (!exists) {
      const row = await prisma.outreachPlan.create({
        data: {
          userId,
          brandName: b.brandName,
          brandEmail: b.brandEmail,
          score: Math.round(b.score)
        }
      });
      created.push(row);
    }
  }

  return created;
}
