import prisma from "../lib/prisma.js";

/**
 * Calculates the deal win rate.
 * @param userId - The ID of the user to calculate for.
 * @returns The win rate as a percentage.
 */
export async function getWinRate(userId: string) {
  const dealCounts = await prisma.deal.groupBy({
    by: ["stage"],
    where: { userId },
    _count: {
      id: true,
    },
  });

  const won = dealCounts.find(d => d.stage === "COMPLETED")?._count.id || 0;
  const lost = dealCounts.find(d => d.stage === "LOST")?._count.id || 0;

  if (won + lost === 0) return 0;

  return (won / (won + lost)) * 100;
}

/**
 * Calculates the average time it takes to close a deal.
 * @param userId - The ID of the user.
 * @returns The average deal pace in days.
 */
export async function getDealPace(userId: string) {
  const closedDeals = await prisma.deal.findMany({
    where: {
      userId,
      stage: { in: ["COMPLETED", "CLOSED_WON"] },
      createdAt: { not: null },
      updatedAt: { not: null },
    },
  });

  if (closedDeals.length === 0) return 0;

  const totalDays = closedDeals.reduce((sum, deal) => {
    const diffTime = Math.abs(deal.updatedAt.getTime() - deal.createdAt.getTime());
    return sum + Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, 0);

  return totalDays / closedDeals.length;
}

/**
 * Gets the distribution of deal values.
 * @param userId - The ID of the user.
 * @returns An object with deal value distribution.
 */
export async function getValueDistribution(userId: string) {
  const deals = await prisma.deal.findMany({
    where: { userId, value: { not: null } },
    select: { value: true },
  });

  // This is a simplified distribution. A real implementation might use buckets.
  const values = deals.map(d => d.value).filter(v => v !== null) as number[];
  const average = values.reduce((a, b) => a + b, 0) / (values.length || 1);
  const min = Math.min(...values);
  const max = Math.max(...values);

  return { average, min, max, count: values.length };
}

/**
 * Gets the performance of different deliverable types.
 * @param userId - The ID of the user.
 * @returns A list of deliverables with their performance.
 */
export async function getDeliverablePerformance(userId: string) {
  // This is a placeholder. A real implementation would require a `ContentPerformance` model
  // linked to deliverables to track actual views, engagement, etc.
  return prisma.deliverable.groupBy({
    by: ["title"], // Using title as a proxy for deliverable type
    where: { deal: { userId } },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  });
}