export default {
  name: "extractDeal",
  description: "Extracts deal offer from an email",
  async run({ email, llm }) {
    const prompt = `
You are an AI deal extraction engine.

Extract:
- brand
- deliverables
- price
- deadlines
- social platforms
- notes

Return valid JSON only.

Email:
${email?.snippet || ""}
`;

    if (llm?.promptJSON) {
      return { deal: await llm.promptJSON(prompt) };
    }

    return {
      deal: {
        brand: null,
        deliverables: [],
        price: null,
        deadlines: [],
        socialPlatforms: [],
        notes: []
      }
    };
  }
};
