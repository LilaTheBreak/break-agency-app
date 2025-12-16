// services/suitabilityScoringService.ts

export interface FinalScoreResult {
  score: number; // 0–100
  breakdown: {
    audienceOverlap: number;
    compliance: number;
    engagement: number;
    priceFit: number;
  };
  reasons: string[];
}

function normalizeEngagementRate(er: number | null | undefined): number {
  if (!er || er <= 0) return 0;

  // Cap at 5% to avoid extreme outliers
  if (er >= 0.05) return 1;

  // Scale between 0–5%
  return er / 0.05;
}

function complianceToScore(level: string): number {
  switch (level) {
    case "safe":
      return 1;
    case "caution":
      return 0.5;
    case "conflict":
      return 0;
    default:
      return 0.5; // fallback
  }
}

function priceFitToScore(fit: string): number {
  switch (fit) {
    case "good":
      return 1;
    case "ok":
      return 0.6;
    case "bad":
      return 0.2;
    default:
      return 0.5;
  }
}

export function calculateFinalScore(
  audienceOverlapScore: number = 0,
  compliance: { level: string; reasons?: string[] } = { level: "caution" },
  engagementRate: number = 0,
  priceFit: string = "ok"
): FinalScoreResult {
  try {
    const overlapNorm = Math.max(0, Math.min(1, audienceOverlapScore));
    const complianceScore = complianceToScore(compliance.level);
    const engagementScore = normalizeEngagementRate(engagementRate);
    const priceFitScore = priceFitToScore(priceFit);

    // Weighted sum → 0–1
    const weighted =
      overlapNorm * 0.4 +
      complianceScore * 0.3 +
      engagementScore * 0.2 +
      priceFitScore * 0.1;

    const final = Math.round(weighted * 100);

    return {
      score: final,
      breakdown: {
        audienceOverlap: overlapNorm,
        compliance: complianceScore,
        engagement: engagementScore,
        priceFit: priceFitScore,
      },
      reasons: [
        ...(compliance.reasons || []),
        `Audience overlap contribution: ${Math.round(overlapNorm * 40)}/40`,
        `Compliance contribution: ${Math.round(complianceScore * 30)}/30`,
        `Engagement contribution: ${Math.round(engagementScore * 20)}/20`,
        `Price fit contribution: ${Math.round(priceFitScore * 10)}/10`,
      ],
    };
  } catch (err) {
    return {
      score: 50,
      breakdown: {
        audienceOverlap: 0.5,
        compliance: 0.5,
        engagement: 0.5,
        priceFit: 0.5,
      },
      reasons: ["Scoring failed; fallback score applied."],
    };
  }
}

export default calculateFinalScore;
