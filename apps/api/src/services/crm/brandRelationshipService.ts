import prisma from "../../lib/prisma.js";
import { scoreBrandAffinity } from "../ai/brandAIScoringService.js";

// Note: brandRelationship, brandEvent, brandAffinitySnapshot models don't exist
// Stubbing out to prevent errors - this feature is not fully implemented
export async function recordBrandEvent(userId: string, brandName: string, type: string, metadata: any = {}) {
  // Return stub brand object
  return {
    id: `brand_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    brandName,
    brandEmail: metadata.email,
    category: metadata.category,
    region: metadata.region,
    affinityScore: 0,
    likelihoodToClose: 0,
    warm: false,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  // Original implementation (commented out - models don't exist):
  // let brand = await prisma.brandRelationship.findFirst({
  //   where: { userId, brandName }
  // });
  //
  // if (!brand) {
  //   brand = await prisma.brandRelationship.create({
  //     data: {
  //       userId,
  //       brandName,
  //       brandEmail: metadata.email,
  //       category: metadata.category,
  //       region: metadata.region
  //     }
  //   });
  // }
  //
  // await prisma.brandEvent.create({
  //   data: {
  //     brandId: brand.id,
  //     userId,
  //     type,
  //     metadata
  //   }
  // });
  //
  // return brand;
}

export async function updateBrandScores(userId: string, brandId: string) {
  // Return stub score
  return {
    affinityScore: 0,
    likelihoodToClose: 0,
    warm: false,
    reasons: []
  };

  // Original implementation (commented out - models don't exist):
  // const brand = await prisma.brandRelationship.findUnique({ where: { id: brandId } });
  // if (!brand) return null;
  //
  // const events = await prisma.brandEvent.findMany({
  //   where: { brandId },
  //   orderBy: { createdAt: "desc" },
  //   take: 30
  // });
  //
  // const score = await scoreBrandAffinity(events, brand, { id: userId });
  //
  // await prisma.brandRelationship.update({
  //   where: { id: brandId },
  //   data: {
  //     affinityScore: score.affinityScore,
  //     likelihoodToClose: score.likelihoodToClose,
  //     warm: score.warm,
  //     metadata: { reasons: score.reasons }
  //   }
  // });
  //
  // await prisma.brandAffinitySnapshot.create({
  //   data: {
  //     userId,
  //     brandId,
  //     affinityScore: score.affinityScore,
  //     likelihoodToClose: score.likelihoodToClose
  //   }
  // });
  //
  // return score;
}
