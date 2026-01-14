export default {
  name: "triageEmail",
  description: "Classifies and prioritises inbound email",
  async run({ email, llm }) {
    const prompt = `
Classify this email.
Return JSON: { "category": "", "urgency": "low|medium|high", "summary": "" }

Email:
${email?.snippet || ""}
`;

    if (llm?.promptJSON) {
      return await llm.promptJSON(prompt);
    }

    return { category: "other", urgency: "medium", summary: email?.snippet || "" };
  }
};
