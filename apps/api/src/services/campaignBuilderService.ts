// services/campaignBuilderService.ts
import prisma from "../lib/prisma.js";
import { generateBundleForDeal, type BundleResult } from "./bundleGeneratorService.js";
import { calculateFinalScore } from "./suitabilityScoringService.js";
import { checkCompliance } from "./categoryComplianceService.js";
import { computeOverlap } from "./audienceOverlapService.js";
import { checkForConflicts } from "./conflictChecker.js";

export interface CampaignPlan {
  dealId: string;
  talentName: string;
  brand: string;
  category: string | null;
  bundle: BundleResult;
  suitability: {
    score: number;
    notes: string[];
  };
  conflicts: string[];
  timeline: {
    date: string;
    event: string;
  }[];
}

export async function buildCampaignFromDeal(dealId: string): Promise<CampaignPlan> {
  try {
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      include: { talent: true },
    });

    if (!deal) {
      return fallbackCampaign(dealId);
    }

    const talentName = deal.talent?.name ?? "Unknown Talent";
    const category = deal.category ?? null;

    const bundle = await generateBundleForDeal(dealId);

    const audienceOverlap = computeOverlap(
      deal.talent?.profile?.audience as any,
      deal.brand ? { [deal.brand]: 1 } : {}
    );
    const complianceResult = checkCompliance(category || "", deal.talent?.categories ?? []);
    const suitabilityScore = calculateFinalScore(
      audienceOverlap.score / 100,
      complianceResult,
      deal.rate ?? 0,
      deal.category ? "ok" : "ok"
    );

    const conflictsResult = await checkForConflicts(deal.talent?.userId ?? "", {
      brand: deal.brand ?? undefined,
      category,
      startDate: deal.startDate ?? undefined,
      endDate: deal.endDate ?? undefined,
      exclusivityDays: deal.exclusivityDays ?? null,
      rate: deal.fee ?? null,
    });

    const timeline = buildTimeline(deal.startDate, bundle);

    return {
      dealId,
      talentName,
      brand: deal.brand ?? "Unknown Brand",
      category,
      bundle,
      suitability: {
        score: suitabilityScore.score,
        notes: suitabilityScore.reasons,
      },
      conflicts: conflictsResult.conflicts,
      timeline,
    };
  } catch (err) {
    console.error("Campaign builder failed:", err);
    return fallbackCampaign(dealId);
  }
}

function buildTimeline(startDate: Date | null, bundle: BundleResult) {
  const base = startDate ? new Date(startDate) : new Date();
  const timeline = [
    {
      date: base.toISOString().split("T")[0],
      event: "Campaign Kickoff",
    },
  ];

  bundle.deliverables.forEach((item, index) => {
    const date = new Date(base);
    date.setDate(base.getDate() + (index + 1) * 3);
    timeline.push({
      date: date.toISOString().split("T")[0],
      event: `Deliverable: ${item.type}`,
    });
  });

  return timeline;
}

function fallbackCampaign(dealId: string): CampaignPlan {
  return {
    dealId,
    talentName: "Unknown Talent",
    brand: "Unknown Brand",
    category: null,
    bundle: {
      dealId,
      creativeConcepts: [],
      deliverables: [],
      schedule: [],
      talkingPoints: [],
      predictedPerformance: {
        estimatedReach: 0,
        estimatedEngagementRate: 0,
      },
    },
    suitability: { score: 0, notes: ["Unable to calculate suitability"] },
    conflicts: ["Unable to run conflict checks"],
    timeline: [],
  };
}

export default buildCampaignFromDeal;
