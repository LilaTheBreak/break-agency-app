import prisma from "../../lib/prisma.js";
import { getSignalsForBrand } from "./signalService.js";
import { predictBrandCampaign } from "../ai/campaignPredictionService.js";
import { creatorFitQueue } from "../../worker/queues.js";

export async function runCampaignPrediction(userId: string, brandName: string) {
  let brand = await prisma.brandRelationship.findFirst({
    where: { userId, brandName }
  });

  if (!brand) {
    brand = await prisma.brandRelationship.create({
      data: { userId, brandName }
    });
  }

  const signals = await getSignalsForBrand(brandName, userId);

  const prediction = await predictBrandCampaign(brand, signals);

  const updated = await prisma.brandCampaignPrediction.upsert({
    where: { brandId_userId: { brandId: brand.id, userId } },
    create: {
      userId,
      brandId: brand.id,
      brandName,
      likelihood: prediction.likelihood,
      predictedBudget: prediction.predictedBudget,
      predictedStage: prediction.predictedStage,
      predictedStart: prediction.predictedStart ? new Date(prediction.predictedStart) : null,
      confidence: prediction.confidence,
      reasons: prediction.reasons
    },
    update: {
      likelihood: prediction.likelihood,
      predictedBudget: prediction.predictedBudget,
      predictedStage: prediction.predictedStage,
      predictedStart: prediction.predictedStart ? new Date(prediction.predictedStart) : null,
      confidence: prediction.confidence,
      reasons: prediction.reasons
    }
  });

  await creatorFitQueue.add("fit", { userId, brandPrediction: { ...updated, brandId: brand.id } });
  // Auto-build deal packages for top creator fits can be enqueued separately after fits are computed.

  return updated;
}
