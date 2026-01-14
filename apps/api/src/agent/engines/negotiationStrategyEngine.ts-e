export async function generateNegotiationStrategy({ deal, policy, llm }) {
  const prompt = `
You are The Break Agency's Negotiation AI.

Policy:
${JSON.stringify(policy, null, 2)}

Deal:
${JSON.stringify(deal, null, 2)}

Produce:
{
  "riskLevel": "low|medium|high",
  "shouldNegotiate": true|false,
  "targetIncreasePct": number,
  "reasoning": string,
  "recommendedCounter": {
    "amount": number,
    "message": string
  }
}

Ensure JSON-only.
`;

  return llm?.promptJSON ? llm.promptJSON(prompt) : null;
}
