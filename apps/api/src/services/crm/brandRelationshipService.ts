import prisma from "../../lib/prisma.js";
import { scoreBrandAffinity } from "../ai/brandAIScoringService.js";

export async function recordBrandEvent(userId: string, brandName: string, type: string, metadata: any = {}) {
  let brand = await prisma.brandRelationship.findFirst({
    where: { userId, brandName }
  });

  if (!brand) {
    brand = await prisma.brandRelationship.create({
      data: {
        userId,
        brandName,
        brandEmail: metadata.email,
        category: metadata.category,
        region: metadata.region
      }
    });
  }

  await prisma.brandEvent.create({
    data: {
      brandId: brand.id,
      userId,
      type,
      metadata
    }
  });

  return brand;
}

export async function updateBrandScores(userId: string, brandId: string) {
  const brand = await prisma.brandRelationship.findUnique({ where: { id: brandId } });
  if (!brand) return null;

  const events = await prisma.brandEvent.findMany({
    where: { brandId },
    orderBy: { createdAt: "desc" },
    take: 30
  });

  const score = await scoreBrandAffinity(events, brand, { id: userId });

  await prisma.brandRelationship.update({
    where: { id: brandId },
    data: {
      affinityScore: score.affinityScore,
      likelihoodToClose: score.likelihoodToClose,
      warm: score.warm,
      metadata: { reasons: score.reasons }
    }
  });

  await prisma.brandAffinitySnapshot.create({
    data: {
      userId,
      brandId,
      affinityScore: score.affinityScore,
      likelihoodToClose: score.likelihoodToClose
    }
  });

  return score;
}
