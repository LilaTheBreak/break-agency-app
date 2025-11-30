import prisma from "../lib/prisma.js";
import { buildCreatorBundleAI } from "./ai/bundleEngine.js";

export async function generateCreatorBundle({ userId, brandPrediction }: { userId: string; brandPrediction: any }) {
  const creators = await prisma.user.findMany({
    where: { accountType: "CREATOR" },
    include: { socialAnalytics: { take: 1, orderBy: { capturedAt: "desc" } } }
  });

  const aiResult = await buildCreatorBundleAI({ brandPrediction, creators });

  return prisma.creatorBundle.create({
    data: {
      userId,
      brandName: brandPrediction.brandName,
      prediction: brandPrediction,
      packages: aiResult
    }
  });
}
