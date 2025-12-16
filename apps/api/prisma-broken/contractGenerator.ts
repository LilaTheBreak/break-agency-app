import { aiClient } from '../ai/aiClient.js';
import { analyzeContractRisks } from './riskAnalyzer.js';

const contractPrompt = (context: any) => `
You are a legal tech AI that drafts creator contracts. Based on the campaign plan and budget allocation, generate a full legal agreement.

**Campaign Plan:**
${JSON.stringify(context.plan, null, 2)}

**Talent Allocation:**
${JSON.stringify(context.allocation, null, 2)}

**Instructions:**
1.  Generate the full contract text as a single string.
2.  Extract the key terms into a structured JSON object.

**JSON Output Schema:**
{
  "contractText": "The full legal text of the contract...",
  "termsJson": {
    "Parties": { "Creator": "${context.allocation.talentName}", "Client": "${context.plan.brandName}" },
    "Scope": { "Deliverables": ${JSON.stringify(context.allocation.deliverables)} },
    "Compensation": { "Fee": ${context.allocation.allocation}, "PaymentSchedule": "Net-30" },
    "Term": "30 days from signing",
    "UsageRights": "12-month license on owned social channels"
  },
  "aiSummary": "A brief summary of the key terms."
}
`;

/**
 * Generates a full contract draft for a single talent within a campaign.
 */
export async function generateContractForTalent(plan: any, allocation: any) {
  const context = { plan, allocation };

  // 1. Generate base contract and terms with AI
  const { contractText, termsJson, aiSummary } = await aiClient.json(contractPrompt(context)) as any;

  // 2. Run risk analysis on the generated text
  const { risksJson } = await analyzeContractRisks(contractText);

  return {
    contractJson: { text: contractText },
    termsJson,
    risksJson,
    aiSummary,
  };
}