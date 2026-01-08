// services/ai/tokenTracker.ts

import prisma from "../../lib/prisma.js";

export interface TokenTrackingInput {
  model: string;
  promptTokens: number;
  completionTokens: number;
  org?: string;
  userId?: string; // optional future use for user-level billing
  service?: string; // optional service name for categorization
}

/**
 * Estimated cost per 1,000 tokens.
 * Values are approximate, safe defaults.
 */
const MODEL_COSTS: Record<string, number> = {
  "gpt-4.1": 0.005,       // $0.005 / 1K tokens
  "gpt-4.1-mini": 0.00015,
  "gpt-4o": 0.005,
  "gpt-4o-mini": 0.00015,
  "claude-3.5-sonnet": 0.003,
  "claude-3.5-haiku": 0.0004,
  "gemini-1.5-pro": 0.002,
  "gemini-1.5-flash": 0.0002,
};

/**
 * Returns cost per token for the given model.
 * If unknown, fall back to a safe low estimate.
 */
function getModelCost(model: string): number {
  return MODEL_COSTS[model] ?? 0.0002; // $0.0002 fallback
}

/**
 * Tracks AI token usage and logs to the database.
 *
 * This does *not* throw — if tracking fails,
 * it logs a warning but never breaks the request.
 */
export async function trackAITokens(input: TokenTrackingInput) {
  try {
    const { model, promptTokens, completionTokens, userId } = input;

    const totalTokens = promptTokens + completionTokens;
    const costPerToken = getModelCost(model);
    const estimatedCost = (totalTokens / 1000) * costPerToken;

    await prisma.aiTokenLog.create({
      data: {
        model,
        promptTokens,
        completionTokens,
        totalTokens,
        estimatedCost,
        userId: userId ?? null,
      },
    });

    return {
      model,
      totalTokens,
      estimatedCost,
    };
  } catch (err) {
    console.warn("[AI TOKEN TRACKER] Failed to record tokens:", err);
    return null;
  }
}

/**
 * Utility helper used by LLM wrappers to format results.
 */
export function extractTokenUsage(apiResponse: any) {
  if (!apiResponse) return { promptTokens: 0, completionTokens: 0 };

  return {
    promptTokens:
      apiResponse?.usage?.prompt_tokens ??
      apiResponse?.usage?.promptTokens ??
      0,
    completionTokens:
      apiResponse?.usage?.completion_tokens ??
      apiResponse?.usage?.completionTokens ??
      0,
  };
}

export default {
  trackAITokens,
  extractTokenUsage,
};
