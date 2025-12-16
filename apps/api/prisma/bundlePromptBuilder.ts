interface BundlePromptInput {
  brandBrief: any;
  industry: string;
  campaignGoals: string[];
  creatorBenchmarks: any;
}

/**
 * Builds a detailed prompt for the AI to generate tiered bundles.
 * @param input - The contextual data for building the prompt.
 * @returns A string prompt for the LLM.
 */
export function buildBundlePrompt(input: BundlePromptInput): string {
  const prompt = `
    You are an expert talent manager and deal strategist. Your task is to create three distinct, price-anchored bundles (Starter, Pro, Elite) for an influencer campaign.

    **Context:**
    - **Brand Industry:** ${input.industry}
    - **Campaign Goals:** ${input.campaignGoals.join(", ")}
    - **Brand Brief Summary:** ${input.brandBrief.summary}
    - **Typical Creator Benchmarks:** ${JSON.stringify(input.creatorBenchmarks, null, 2)}

    **Instructions:**
    Generate a JSON object containing a "bundles" array. Each bundle in the array must have the following structure:
    {
      "name": "string (e.g., 'Starter Content Pack', 'Pro Engagement Bundle', 'Elite Partnership')",
      "description": "string (A brief, compelling description of this bundle)",
      "priceMin": "number (The low-end estimated price for this bundle)",
      "priceMax": "number (The high-end estimated price for this bundle)",
      "deliverables": [{ "type": "string (e.g., 'Instagram Reel')", "quantity": "number" }],
      "usageRights": "string (e.g., '3 months paid social', 'In-perpetuity organic')",
      "upsellSuggestions": ["string (e.g., 'Add paid amplification for +$500')"]
    }
  `;

  return prompt;
}