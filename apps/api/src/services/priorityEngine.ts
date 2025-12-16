/**
 * priorityEngine.ts — Stub priority scoring engine.
 * Provides safe placeholder logic for unified inbox scoring.
 */

export type PriorityScore = {
  score: number;
  labels: string[];
  isOpportunity: boolean;
};

/**
 * TEMP IMPLEMENTATION:
 * Very lightweight scoring logic based on subject/body content.
 */
export function scoreEmail(parsed: {
  subject?: string | null;
  body?: string | null;
}): PriorityScore {
  const text = `${parsed.subject || ""} ${parsed.body || ""}`.toLowerCase();

  let score = 5;
  const labels: string[] = [];

  if (text.includes("deal") || text.includes("collab")) {
    score += 40;
    labels.push("deal");
  }

  if (text.includes("urgent") || text.includes("asap")) {
    score += 20;
    labels.push("urgent");
  }

  if (text.includes("invite")) {
    score += 10;
    labels.push("invite");
  }

  return {
    score,
    labels,
    isOpportunity: score >= 30,
  };
}

/**
 * TEMP STUB:
 * For DM messages or other formats.
 */
export function scoreMessage(parsed: {
  subject?: string | null;
  body?: string | null;
}) {
  return scoreEmail(parsed);
}

/**
 * ⚠️ Stub implementation for unifiedInboxService.ts compatibility.
 * The real engine would inspect:
 * - sender reputation
 * - thread history
 * - AI classification
 * - deadlines
 * - past engagement
 */
export function computePrioritySignals(input: {
  subject?: string | null;
  body?: string | null;
  sender?: string | null;
  receivedAt?: Date | string | null;
}) {
  // Re-use email scoring for now
  const score = scoreEmail({
    subject: input.subject,
    body: input.body,
  });

  return {
    ...score,
    priority: score.score >= 60 ? "high" : score.score >= 30 ? "medium" : "low",
  };
}
