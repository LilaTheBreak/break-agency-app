// apps/api/src/prompts/negotiationPrompt.ts

export interface NegotiationPromptInput {
  dealSummary: string;
  talentProfile?: any;
}

export function buildNegotiationPrompt(input: NegotiationPromptInput) {
  const { dealSummary, talentProfile } = input;
  return `As a negotiation strategist, analyze this deal: ${dealSummary}.
Talent profile: ${JSON.stringify(talentProfile || {})}
Describe the negotiation strategy, highlight risks, propose upsell opportunities, and suggest alternatives. Return a plain structured response.`
    .replace(/\n/g, " ");
}
