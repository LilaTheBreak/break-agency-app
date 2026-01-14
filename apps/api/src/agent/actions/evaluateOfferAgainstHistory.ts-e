export default {
  name: "evaluateOfferAgainstHistory",
  async run({ threadState, deal, llm }) {
    const prompt = `
You are evaluating a negotiation with history.

History:
${JSON.stringify(threadState?.summary, null, 2)}

New Email Deal:
${JSON.stringify(deal)}

Return JSON:
{
  "isContinuation": true|false,
  "shouldCounter": true|false,
  "reasoning": string
}
`;

    return llm?.promptJSON ? llm.promptJSON(prompt) : { isContinuation: true, shouldCounter: true, reasoning: "LLM not configured" };
  }
};
