import { aiClient } from './aiClient.js';

const draftPrompt = (context: any) => `
You are a legal tech AI that drafts creator contracts based on finalized deal terms.

**Final Deal Terms:**
- Brand: ${context.brandName}
- Creator: ${context.creatorName}
- Total Budget: £${context.budget}
- Deliverables: ${JSON.stringify(context.deliverables)}
- Usage Rights: 12 months on social media platforms

**Instructions:**
1.  **draftContractText**: Generate the full legal text for a standard creator agreement based on these terms.
2.  **analyseContractRisks**: Identify 2-3 potential risks or ambiguities in the text you just generated.
3.  **generateRedlines**: For each risk, suggest a redline (a rewritten version of the risky clause).

**JSON Output Schema:**
{
  "contractText": "The full legal text...",
  "risks": [{ "risk": "string", "recommendation": "string" }],
  "redlines": [{ "originalClause": "string", "suggestedRedline": "string", "reason": "string" }]
}
`;

/**
 * Assembles all necessary data for contract generation.
 */
export async function assembleContractData(dealDraft: any) {
  // In a real app, this would fetch data from multiple related models.
  return {
    brandName: dealDraft.brand,
    creatorName: dealDraft.user.name,
    budget: dealDraft.offerValue,
    deliverables: dealDraft.deliverables,
  };
}

/**
 * Generates the contract text and analysis using AI.
 */
export async function draftAndAnalyzeContract(context: any) {
  try {
    const prompt = draftPrompt(context);
    return await aiClient.json(prompt);
  } catch (error) {
    console.error('[AI CONTRACT WRITER ERROR]', error);
    return {
      contractText: '// AI FAILED TO GENERATE CONTRACT //',
      risks: [{ risk: 'AI Offline', recommendation: 'Manual review required.' }],
      redlines: [],
    };
  }
}