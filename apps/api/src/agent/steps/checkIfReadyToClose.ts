export default {
  name: "checkIfReadyToClose",
  async run({ threadState, llm }) {
    const prompt = `
Based on this negotiation history:

${JSON.stringify(threadState?.summary, null, 2)}

Is this negotiation ready for closing?

Return JSON:
{
  "ready": true|false,
  "reason": string
}
    `;
    return llm?.promptJSON ? llm.promptJSON(prompt) : { ready: false, reason: "LLM not configured" };
  }
};
