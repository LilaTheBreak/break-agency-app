import prisma from "../lib/prisma.js";
import { brandQueue } from "../worker/queues.js";

export async function recalcBrandCRM() {
  const brands = await prisma.brandRelationship.findMany();
  for (const b of brands) {
    await brandQueue.add("rescore", { userId: b.userId, brandId: b.id });
  }
}
