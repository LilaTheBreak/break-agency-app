import type { EmailClassification } from './classifyEmail.js';

type PriorityResult = {
  score: number;
  reasons: string[];
};

const URGENCY_WEIGHTS: Record<string, number> = {
  high: 30,
  medium: 15,
  low: 5
};

const CATEGORY_WEIGHTS: Record<string, number> = {
  deal: 40,
  invite: 20,
  gifting: 10,
  other: 0,
  spam: -20
};

export function calculatePriorityScore(classification: EmailClassification): PriorityResult {
  const reasons: string[] = [];
  let score = 0;

  // Urgency score
  const urgencyScore = URGENCY_WEIGHTS[classification.urgency] || 0;
  if (urgencyScore > 0) {
    score += urgencyScore;
    reasons.push(`Urgency is ${classification.urgency} (+${urgencyScore})`);
  }

  // Category score
  const categoryScore = CATEGORY_WEIGHTS[classification.category] || 0;
  score += categoryScore;
  reasons.push(`Category is ${classification.category} (+${categoryScore})`);

  // Budget bonus
  if (classification.extracted.budget && classification.extracted.budget > 0) {
    score += 25;
    reasons.push(`Includes a budget (+25)`);
  }

  // Confidence adjustment
  score *= classification.confidence;
  reasons.push(`Confidence adjustment (*${classification.confidence.toFixed(2)})`);

  return { score: Math.round(score), reasons };
}