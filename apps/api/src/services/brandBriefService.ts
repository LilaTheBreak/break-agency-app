import prisma from "../lib/prisma.js";
import { parseBrandBrief } from "./ai/briefParser.js";
import { matchCreatorsToBrief } from "./ai/briefMatcher.js";

export async function ingestBrief({
  rawText,
  brandName,
  contactEmail,
  submittedBy
}: {
  rawText: string;
  brandName: string;
  contactEmail?: string;
  submittedBy?: string;
}) {
  const parsed = await parseBrandBrief(rawText);

  const brief = await prisma.brandBrief.create({
    data: {
      brandName,
      contactEmail,
      submittedBy,
      content: rawText,
      aiSummary: parsed.summary,
      aiKeywords: parsed.keywords,
      categories: parsed.categories || [],
      budgetMin: parsed.budget?.min,
      budgetMax: parsed.budget?.max
    }
  });

  const creators = await prisma.user.findMany({
    where: { accountType: "CREATOR" },
    include: { socialAnalytics: true }
  });

  const matches = await matchCreatorsToBrief({ brief: parsed, creators });

  if (Array.isArray(matches) && matches.length) {
    await prisma.briefMatch.createMany({
      data: matches.map((m: any) => ({
        briefId: brief.id,
        creatorId: m.creatorId,
        score: m.score,
        reason: m.reason,
        predictedFee: m.predictedFee,
        predictedPerformance: m.predictedPerformance
      }))
    });
  }

  return brief;
}
