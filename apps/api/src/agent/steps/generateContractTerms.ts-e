export default {
  name: "generateContractTerms",
  async run({ email, threadState, llm }) {
    const prompt = `
Create structured contract terms for this deal based on:

- Email content
- Brand counters
- Negotiation history

Return JSON exactly as:
{
  "talentName": string,
  "brand": string,
  "usageRights": string,
  "territory": string,
  "deliverables": [string],
  "timeline": string,
  "exclusivity": string,
  "payment": {
    "total": number,
    "schedule": [string]
  },
  "termination": string,
  "additionalNotes": string
}
    `;

    return llm?.promptJSON ? llm.promptJSON(prompt) : null;
  }
};
