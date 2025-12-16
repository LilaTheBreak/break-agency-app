import { aiClient } from './aiClient.js';

const bundlePrompt = (context: any) => `
You are an expert talent manager. Based on the target brand and a list of potential creators with their match scores, assemble a synergistic "creator bundle" of 2-3 creators.

Target Brand: ${context.brandName}
Potential Creators: ${JSON.stringify(context.creators)}

Justify why this bundle works well together.
Respond with JSON: { "bundleName": "string", "creators": [{ "creatorName": "string", "justification": "string" }], "bundleJustification": "string" }
`;

/**
 * Creates a bundle of creators for a specific brand campaign.
 */
export async function buildCreatorBundle(context: { brandName: string; creators: any[] }) {
  try {
    const prompt = bundlePrompt(context);
    return await aiClient.json(prompt);
  } catch (error) {
    console.error('[AI BUNDLE BUILDER ERROR]', error);
    return {
      bundleName: 'Stubbed Creator Bundle',
      creators: [{ creatorName: 'Creator A', justification: 'Good audience overlap (stub).' }],
      bundleJustification: 'This is a stubbed bundle justification.',
    };
  }
}