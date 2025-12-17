import { prisma } from "./prismaClient.js";

/**
 * Goal versioning utilities — track changes for agent context and AI learning
 * WITHOUT exposing version history to creators
 */

interface GoalSnapshot {
  id: string;
  goalCategory: string;
  goalType: string;
  title: string;
  targetValue?: number | null;
  targetUnit?: string | null;
  timeframe?: string | null;
  progress: number;
  active: boolean;
}

/**
 * Create a version snapshot when a goal is created/updated/archived
 */
export async function createGoalVersion(
  goalId: string,
  snapshot: GoalSnapshot,
  changeType: "created" | "updated" | "archived",
  changedBy: "creator" | "agent" | "admin" | "system" = "creator"
): Promise<void> {
  try {
    await prisma.creatorGoalVersion.create({
      data: {
        creatorGoalId: goalId,
        snapshot: snapshot as any,
        changeType,
        changedBy,
      },
    });
  } catch (error) {
    console.error("Failed to create goal version:", error);
    // Don't fail the main operation if versioning fails
  }
}

/**
 * Detect if a goal is sensitive (personal/wellbeing)
 * Used to flag goals that should be hidden from brand-facing contexts
 */
export function isGoalSensitive(goalCategory: string): boolean {
  return ["personal", "wellbeing"].includes(goalCategory.toLowerCase());
}

/**
 * Convert goals to AI-friendly context string
 * Filters out sensitive details, formats human-readable
 */
export function goalsToAIContext(goals: any[]): string {
  if (!goals || goals.length === 0) {
    return "This creator has not set specific goals yet.";
  }

  const activeGoals = goals.filter((g) => g.active);
  if (activeGoals.length === 0) {
    return "This creator has not set active goals.";
  }

  // Group by category
  const categorized: Record<string, any[]> = {};
  activeGoals.forEach((goal) => {
    const category = goal.goalCategory || "other";
    if (!categorized[category]) categorized[category] = [];
    categorized[category].push(goal);
  });

  // Build context string
  let context = "This creator is focusing on:\n";

  // Creative goals (high priority for recommendations)
  if (categorized.creative) {
    context += categorized.creative.map((g) => `- ${g.title} (creative goal)`).join("\n") + "\n";
  }

  // Commercial goals (relevant for deals/opportunities)
  if (categorized.commercial) {
    context += categorized.commercial.map((g) => `- ${g.title} (commercial)`).join("\n") + "\n";
  }

  // Growth goals (platform/audience expansion)
  if (categorized.growth) {
    context += categorized.growth.map((g) => `- ${g.title} (growth)`).join("\n") + "\n";
  }

  // Personal/wellbeing goals (soft-weighted, no specifics)
  const sensitiveGoals = [...(categorized.personal || []), ...(categorized.wellbeing || [])];
  if (sensitiveGoals.length > 0) {
    context += `- Maintaining work-life balance and personal wellbeing (${sensitiveGoals.length} personal goals)\n`;
  }

  // Add avoidance hints if wellbeing goals exist
  if (categorized.wellbeing || categorized.personal) {
    context +=
      "\nConsiderations:\n- Avoid suggesting late-night events or high-pressure campaigns\n- Prioritize creator wellbeing in recommendations";
  }

  return context.trim();
}

/**
 * Generate computed intent profile (virtual endpoint data)
 */
export function computeCreatorIntentProfile(goals: any[]) {
  const activeGoals = goals.filter((g) => g.active);

  const categories = [...new Set(activeGoals.map((g) => g.goalCategory))];
  const types = [...new Set(activeGoals.map((g) => g.goalType))];

  const sensitiveCount = activeGoals.filter((g) => isGoalSensitive(g.goalCategory)).length;

  // Determine primary focus (most common category)
  const categoryCounts: Record<string, number> = {};
  activeGoals.forEach((g) => {
    const cat = g.goalCategory || "other";
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });
  const primaryFocus = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "general";

  return {
    activeGoals: activeGoals.length,
    categories,
    types,
    primaryFocus,
    sensitiveGoals: sensitiveCount,
    hasSensitiveGoals: sensitiveCount > 0,
    aiContext: goalsToAIContext(activeGoals),
    lastUpdated: activeGoals.length > 0 ? activeGoals[0].updatedAt : new Date(),
  };
}

/**
 * Match event to creator goals — returns confidence score 0-100
 */
export function matchEventToGoals(event: any, goals: any[]): number {
  if (!goals || goals.length === 0) return 50; // Neutral if no goals

  const activeGoals = goals.filter((g) => g.active);
  if (activeGoals.length === 0) return 50;

  let score = 0;
  let matches = 0;

  // Check if event type aligns with goal types
  const eventType = (event.eventType || "").toLowerCase();
  const eventName = (event.eventName || "").toLowerCase();

  activeGoals.forEach((goal) => {
    const goalType = goal.goalType.toLowerCase();
    const goalTitle = goal.title.toLowerCase();

    // Direct type matches
    if (eventType.includes(goalType) || eventName.includes(goalType)) {
      score += 30;
      matches++;
    }

    // Keyword matches in title
    if (eventName.includes(goalTitle.split(" ")[0])) {
      score += 20;
      matches++;
    }

    // Category alignment
    if (goal.goalCategory === "creative" && ["shoot", "launch", "appearance"].includes(eventType)) {
      score += 15;
    }
  });

  // Avoid recommending events if wellbeing goals are active
  const hasWellbeingGoals = activeGoals.some((g) => g.goalCategory === "wellbeing");
  if (hasWellbeingGoals && (eventType === "late_night" || event.duration > 8)) {
    score -= 25;
  }

  // Normalize to 0-100
  const finalScore = Math.min(100, Math.max(0, score));
  return finalScore;
}

/**
 * Match opportunity to creator goals — returns relevance rank
 */
export function matchOpportunityToGoals(opportunity: any, goals: any[]): {
  score: number;
  matchReasons: string[];
} {
  if (!goals || goals.length === 0) {
    return { score: 50, matchReasons: [] };
  }

  const activeGoals = goals.filter((g) => g.active);
  if (activeGoals.length === 0) {
    return { score: 50, matchReasons: [] };
  }

  let score = 0;
  const matchReasons: string[] = [];

  const oppDescription = (opportunity.description || "").toLowerCase();
  const oppTitle = (opportunity.title || "").toLowerCase();

  activeGoals.forEach((goal) => {
    const goalType = goal.goalType.toLowerCase();
    const goalCategory = goal.goalCategory.toLowerCase();

    // Revenue goals match paid opportunities
    if (goalType === "revenue" && opportunity.value > 0) {
      score += 25;
      matchReasons.push(`Aligns with revenue goal: ${goal.title}`);
    }

    // Speaking goals match speaking/panel opportunities
    if (goalType === "speaking" && (oppTitle.includes("speak") || oppDescription.includes("panel"))) {
      score += 30;
      matchReasons.push(`Matches speaking goal: ${goal.title}`);
    }

    // Product goals match launch/collab opportunities
    if (goalType === "product" && (oppDescription.includes("product") || oppDescription.includes("launch"))) {
      score += 30;
      matchReasons.push(`Aligns with product goal: ${goal.title}`);
    }

    // Content goals match content creation opportunities
    if (goalType === "content" && (oppDescription.includes("content") || oppDescription.includes("creator"))) {
      score += 20;
      matchReasons.push(`Matches content goal: ${goal.title}`);
    }

    // Growth category prefers high-visibility opportunities
    if (goalCategory === "growth" && opportunity.reach > 100000) {
      score += 15;
      matchReasons.push("High-visibility opportunity aligned with growth goals");
    }
  });

  const finalScore = Math.min(100, Math.max(0, score));
  return { score: finalScore, matchReasons: matchReasons.slice(0, 3) }; // Top 3 reasons
}
