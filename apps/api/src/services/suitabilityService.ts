import prisma from '../lib/prisma';
import { computeOverlap } from './audienceOverlapService';
import { checkCompliance } from './categoryComplianceService';
import { checkConflicts } from './conflictChecker';
import { calculateFinalScore } from './suitabilityScoringService';
import { analyzeQualitativeSuitability } from './ai/suitabilityLLM';
import { generateSuitabilityExplanation } from './ai/suitabilityExplainer';

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

  const creator = await prisma.talent.findUnique({ where: { id: creatorId } });
  const brand = await prisma.brand.findUnique({ where: { id: brandId } });
  const campaign = campaignId ? await prisma.brandCampaign.findUnique({ where: { id: campaignId } }) : null;

  if (!creator || !brand) {
    throw new Error("Creator or Brand not found.");
  }

  // Placeholder implementation - full AI analysis not yet implemented
  const flags: string[] = [];
  const breakdown = {
    audience: 0,
    compliance: 0,
    conflicts: 0,
    contentAlignment: 0,
    brandToneMatch: 0,
  };
  const finalScore = 50; // Default placeholder score

  // 6. Save Result
  const suitabilityResult = await prisma.suitabilityResult.create({
    data: {
      id: `suit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      creatorId,
      brandId,
      score: finalScore,
      flags: flags,
      categories: creator.categories || [],
      reasoning: breakdown as any,
      aiSummary: "Suitability analysis not yet implemented",
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
    include: { Brand: true, Talent: true },
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
    include: { Talent: true, Brand: true },
  });
}

export { generateSuitabilityExplanation };

export async function calculateSuitabilityScore(input: {
  creatorAudience?: string[];
  brandAudience?: string[];
  categories?: string[];
}) {
  console.log("[suitabilityService] calculateSuitabilityScore input:", input);

  const overlapScore = 50; // Default
  const complianceResult = { isCompliant: true };

  const finalScore = calculateFinalScore(overlapScore);

  return {
    overlap: { score: overlapScore },
    compliance: complianceResult,
    finalScore,
  };
}
