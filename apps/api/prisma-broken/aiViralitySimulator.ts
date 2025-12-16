import { aiClient } from './aiClient.js';

const variantsPrompt = (context: any) => `
You are a viral content strategist. Based on the deliverable's topic and current social media trends, generate 5 distinct creative variants.

**Deliverable Topic:**
"${context.topic}"

**Current Trends:**
${context.trends.join(', ')}

**Instructions:**
For each variant, create a different hook, caption, and set of hashtags.

**JSON Output Schema:**
{ "variants": [{ "hook": "string", "caption": "string", "hashtags": ["string"] }] }
`;

const simulationPrompt = (context: any) => `
You are a social media algorithm simulator. Predict the virality score (0.0 to 1.0) and estimated views for the given content variant.

**Creator's Average Views:** ${context.avgViews}
**Content Variant:**
${JSON.stringify(context.variant, null, 2)}

**JSON Output Schema:**
{ "viralityScore": "number", "predictedViews": "number", "reasoning": "A brief explanation for the score." }
`;

/**
 * Generates creative variants for a piece of content.
 */
export async function generateVariants(context: { topic: string; trends: string[] }) {
  try {
    const prompt = variantsPrompt(context);
    return await aiClient.json(prompt) as { variants: any[] };
  } catch (error) {
    console.error('[AI VARIANT GENERATOR ERROR]', error);
    return { variants: [{ hook: 'Stub Hook', caption: 'Stub Caption', hashtags: ['#stub'] }] };
  }
}

/**
 * Simulates the performance of a single creative variant.
 */
export async function simulateVariant(context: { avgViews: number; variant: any }) {
  try {
    const prompt = simulationPrompt(context);
    return await aiClient.json(prompt);
  } catch (error) {
    console.error('[AI VARIANT SIMULATOR ERROR]', error);
    return { viralityScore: 0.5, predictedViews: 50000, reasoning: 'AI offline (stub).' };
  }
}

/**
 * Ranks the variants and provides a summary.
 */
export function rankVariants(allScores: any[]) {
  if (!allScores || allScores.length === 0) {
    return { topPick: null, aiSummary: 'No variants were scored.' };
  }
  const sorted = [...allScores].sort((a, b) => b.viralityScore - a.viralityScore);
  const topPick = sorted[0];
  const aiSummary = `The variant with the hook "${topPick.variant.hook}" is predicted to perform best due to: ${topPick.reasoning}`;
  return { topPick, aiSummary };
}