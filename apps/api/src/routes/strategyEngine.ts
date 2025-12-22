import OpenAI from "openai";

const client = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

export async function generateStrategy(deal) {
  const prompt = `
Based on this deal thread, recommend a negotiation strategy.

Deal History:
${deal.messages.map(m => `${m.sender}: ${m.body}`).join("\n")}

Return JSON with:
- "negotiationStrategy": A short strategy name (e.g., "Hold Firm on Rate", "Offer Tiered Packages", "Push for Exclusivity").
- "recommendedRate": An integer representing the suggested next offer rate.
- "nextAction": A concise, actionable next step for the agent (e.g., "Draft counter-offer email", "Request clarity on deliverables").
`;

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const data = JSON.parse(completion.choices[0].message.content);
    return {
      negotiationStrategy: data.negotiationStrategy || "N/A",
      recommendedRate: data.recommendedRate || null,
      nextAction: data.nextAction || "Review manually.",
    };
  } catch (error) {
    console.error("Strategy Generation Failed:", error);
    return { negotiationStrategy: "N/A", recommendedRate: null, nextAction: "Review manually." };
  }
}