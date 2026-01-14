export default {
  name: "negotiateDeal",
  description: "Drafts negotiation guidance and reply",
  async run({ deal, llm }) {
    const prompt = `
You are an AI negotiation assistant.
Return JSON: { "counter": null, "rationale": "", "reply": "" }

Deal:
${JSON.stringify(deal || {}, null, 2)}
`;

    if (llm?.promptJSON) {
      return await llm.promptJSON(prompt);
    }

    return { counter: null, rationale: "No LLM configured", reply: "Draft unavailable." };
  }
};
