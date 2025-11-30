import prisma from "../../lib/prisma.js";
import { predictCreatorBrandFit } from "../ai/creatorFitEngine.js";

export async function runCreatorFit(userId: string, brandPrediction: any) {
  const creators = await prisma.user.findMany({
    where: {
      accountType: "creator"
    },
    include: {
      socialAnalytics: {
        orderBy: { capturedAt: "desc" },
        take: 1
      }
    }
  });

  const results = [];

  for (const creator of creators) {
    const fit = await predictCreatorBrandFit(creator, brandPrediction);

    const record = await prisma.creatorBrandFit.upsert({
      where: {
        creatorId_brandName: {
          creatorId: creator.id,
          brandName: brandPrediction.brandName
        }
      },
      create: {
        creatorId: creator.id,
        brandId: brandPrediction.brandId,
        brandName: brandPrediction.brandName,
        fitScore: fit.fitScore,
        predictedValue: fit.predictedValue,
        likelihood: fit.likelihood,
        confidence: fit.confidence,
        reasons: fit.reasons
      },
      update: {
        fitScore: fit.fitScore,
        predictedValue: fit.predictedValue,
        likelihood: fit.likelihood,
        confidence: fit.confidence,
        reasons: fit.reasons
      }
    });

    results.push(record);
  }

  return results;
}
