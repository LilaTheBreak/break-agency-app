import prisma from "../lib/prisma.js";
import { buildDealPackageAI } from "./ai/dealPackageEngine.js";

export async function generateDealPackage({
  userId,
  brandPrediction,
  creatorId,
  context
}: {
  userId: string;
  brandPrediction: any;
  creatorId?: string;
  context?: any;
}) {
  const creator = creatorId
    ? await prisma.user.findUnique({
        where: { id: creatorId },
        include: { socialAnalytics: { orderBy: { capturedAt: "desc" }, take: 1 } }
      })
    : null;

  const aiResult = await buildDealPackageAI({ brandPrediction, creator, context });

  return prisma.dealPackage.create({
    data: {
      userId,
      creatorId,
      brandName: brandPrediction.brandName,
      campaignGoal: aiResult.campaignGoal,
      deliverables: aiResult.deliverables,
      pricing: aiResult.pricing,
      concepts: aiResult.concepts,
      timeline: aiResult.timeline,
      terms: aiResult.terms,
      upsells: aiResult.upsells
    }
  });
}
