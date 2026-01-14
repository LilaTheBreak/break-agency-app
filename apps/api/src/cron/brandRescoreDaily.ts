import prisma from '../lib/prisma';
import { brandQueue } from '../worker/queues';

// Note: brandRelationship model doesn't exist - stubbing out
export async function recalcBrandCRM() {
  // TODO: Refactor to use CrmBrand or implement brandRelationship model
  const brands: any[] = [];
  for (const b of brands) {
    await brandQueue.add("rescore", { userId: b.userId, brandId: b.id });
  }
  return { processed: 0 };
}
