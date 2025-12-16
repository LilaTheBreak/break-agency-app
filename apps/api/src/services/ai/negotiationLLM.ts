import { trackAITokens } from "../tokenTracker.js";
import { buildNegotiationPrompt } from "../../prompts/negotiationPrompt";

interface NegotiationSuggestion {
  suggestion: string;
  confidence: number;
  strategy: string;
}

export async function analyzeNegotiationThread(threadContext: any) {
  console.log("analyzeNegotiationThread called with context:", threadContext);
  const start = Date.now();
  let tokens = 0;

  try {
    const prompt = buildNegotiationPrompt({
      dealSummary: threadContext.summary || "No summary",
      talentProfile: threadContext.talent,
    });
    const result: NegotiationSuggestion = {
      suggestion: "Suggest a 15% increase in the rate based on the creator's recent engagement metrics.",
      confidence: 0.85,
      strategy: "Leverage recent performance",
    };

    const latency = Date.now() - start;
    await trackAITokens("analyzeNegotiationThread", tokens);

    return {
      ok: true,
      data: result,
      meta: { tokens, latency },
    };
  } catch (err) {
    console.error("Error in analyzeNegotiationThread", err);
    const latency = Date.now() - start;
    await trackAITokens("analyzeNegotiationThread", tokens);
    return {
      ok: false,
      data: null,
      meta: { tokens, latency },
    };
  }
}
