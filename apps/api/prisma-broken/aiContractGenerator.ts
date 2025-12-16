import { aiClient } from '../ai/aiClient.js';

const contractGenerationPrompt = (context: any) => `
You are an expert legal tech AI. Your task is to generate a complete, formal creator agreement based on the finalized terms from a negotiation.

**Finalized Deal Terms:**
- Brand: ${context.brandName}
- Creator: ${context.creatorName}
- Final Rate: £${context.finalRate}
- Deliverables: ${JSON.stringify(context.deliverables)}
- Key Terms from Negotiation: ${context.negotiationSummary}

**Instructions:**
Generate a comprehensive, structured JSON output for the contract.
1.  **summary**: A high-level summary of the agreement.
2.  **risks**: A list of potential risks or ambiguities in the generated contract.
3.  **redlines**: For each risk, suggest a redline to improve the clause.
4.  **terms**: An array of structured key terms (e.g., { term: "Payment", value: "£5,000 net-30" }).
5.  **fullContractText**: The complete, formal legal text of the creator agreement.

**JSON Output Schema:**
{
  "summary": "string",
  "risks": [{ "risk": "string", "recommendation": "string" }],
  "redlines": [{ "originalClause": "string", "suggestedRedline": "string" }],
  "terms": [{ "term": "string", "value": "string" }],
  "fullContractText": "string"
}
`;

/**
 * Generates a full contract from negotiation state using AI.
 * @param context - The assembled context from the negotiation.
 */
export async function generateContract(context: any) {
  try {
    const prompt = contractGenerationPrompt(context);
    return await aiClient.json(prompt);
  } catch (error) {
    console.error('[AI CONTRACT GENERATOR ERROR]', error);
    return {
      summary: 'AI generation failed.',
      risks: [{ risk: 'AI Offline', recommendation: 'Manual contract creation required.' }],
      redlines: [],
      terms: [],
      fullContractText: '// AI FAILED TO GENERATE CONTRACT TEXT //',
    };
  }
}