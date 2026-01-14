import OpenAI from "openai";

const client = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

export async function analyzeDeal(deal) {
  const prompt = `
Analyze the following deal thread and provide a summary, identify risks, and suggest negotiation levers.

Deal History:
${deal.messages.map(m => `${m.sender}: ${m.body}`).join("\n")}

Return JSON with:
- "summary": A one-sentence summary of the current deal status.
- "riskFactors": An array of potential risks (e.g., "unclear deliverables", "tight deadline", "low budget").
- "negotiationLevers": An array of potential negotiation points (e.g., "usage rights", "exclusivity", "payment terms").
`;

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const data = JSON.parse(completion.choices[0].message.content);

    return {
      summary: data.summary || "No summary available.",
      riskFactors: data.riskFactors || [],
      negotiationLevers: data.negotiationLevers || [],
    };
  } catch (error) {
    console.error("Deal Analysis Failed:", error);
    return { summary: "AI analysis failed.", riskFactors: [], negotiationLevers: [] };
  }
}