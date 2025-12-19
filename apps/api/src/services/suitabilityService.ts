import prisma from "../lib/prisma.js";
import { computeOverlap } from "./audienceOverlapService.js";
import { checkCompliance } from "./categoryComplianceService.js";
import { checkConflicts } from "./conflictChecker.js";
import { calculateFinalScore } from "./suitabilityScoringService.js";
import { analyzeQualitativeSuitability } from "./ai/suitabilityLLM.js";
import { generateSuitabilityExplanation } from "./ai/suitabilityExplainer.js";

interface EvaluateSuitabilityArgs {
  creatorId: string;
  brandId: string;
  campaignId?: string;
}

/**
 * Orchestrates the entire suitability evaluation process.
 * @param args - Creator, Brand, and optional Campaign IDs.
 * @returns The saved SuitabilityResult.
 */
export async function evaluateSuitability(args: EvaluateSuitabilityArgs) {
  const { creatorId, brandId, campaignId } = args;

  const creator = await prisma.talent.findUnique({ where: { id: creatorId }, include: { profile: true } });
  const brand = await prisma.brand.findUnique({ where: { id: brandId } });
  const campaign = campaignId ? await prisma.brandCampaign.findUnique({ where: { id: campaignId } }) : null;

  if (!creator || !brand) {
    throw new Error("Creator or Brand not found.");
  }

  // 1. Audience Overlap
  const audienceScore = await computeOverlap(creator.profile?.audience as any, brand.targetAudience as any);

  // 2. Category Compliance
  const compliance = await checkCompliance({
    categories: creator.categories ?? [],
  });

  // 3. Conflict of Interest
  const conflicts = await checkConflicts(creatorId, brandId, campaignId);

  // 4. Qualitative AI Analysis
  const aiQualitative = await analyzeQualitativeSuitability(
    creator.profile,
    brand,
    campaign?.brief
  );

  // Consolidate flags
  const flags = [...compliance.flags, ...conflicts.flags, ...aiQualitative.warningSigns];

  // 5. Final Scoring
  const breakdown = {
    audience: audienceScore.score,
    compliance: compliance.isCompliant ? 100 : 0,
    conflicts: conflicts.score,
    contentAlignment: aiQualitative.contentAlignmentScore,
    brandToneMatch: aiQualitative.brandToneMatch,
  };
  const finalScore = calculateFinalScore({
    overlapScore: audienceScore.score,
    compliant: compliance.isCompliant,
  });

  // 6. Save Result
  const suitabilityResult = await prisma.suitabilityResult.create({
    data: {
      creatorId,
      brandId,
      campaignId,
      score: finalScore,
      flags: flags,
      categories: creator.categories, // Or derived from campaign
      reasoning: breakdown as any,
      aiSummary: aiQualitative.aiSummary,
      aiJson: aiQualitative as any,
    },
  });

  return suitabilityResult;
}

/**
 * Retrieves suitability history for a creator.
 * @param creatorId - The ID of the creator.
 * @returns An array of SuitabilityResult objects.
 */
export async function getSuitabilityHistory(creatorId: string) {
  return prisma.suitabilityResult.findMany({
    where: { creatorId },
    orderBy: { createdAt: "desc" },
    include: { brand: true, campaign: true },
  });
}

/**
 * Retrieves a single suitability result by ID.
 * @param id - The ID of the SuitabilityResult.
 * @returns The SuitabilityResult object or null.
 */
export async function getSuitabilityResult(id: string) {
  return prisma.suitabilityResult.findUnique({
    where: { id },
    include: { creator: true, brand: true, campaign: true },
  });
}

export { generateSuitabilityExplanation };

export async function calculateSuitabilityScore(input: {
  creatorAudience: string[];
  brandAudience: string[];
  categories: string[];
}) {
  console.log("[suitabilityService] calculateSuitabilityScore input:", input);

  const overlap = computeOverlap({
    creatorAudience: input.creatorAudience,
    brandAudience: input.brandAudience,
  });

  const compliance = checkCompliance({ categories: input.categories });

  const finalScore = calculateFinalScore({
    overlapScore: overlap.score,
    compliant: compliance.isCompliant,
  });

  return {
    overlap,
    compliance,
    finalScore,
  };
}
