import OpenAI from "openai";

const client = new OpenAI();

export async function generateForecast(deal) {
  const prompt = `
Analyze this deal thread and forecast the outcome.

Deal History:
${deal.messages.map(m => `${m.sender}: ${m.body}`).join("\n")}

Return JSON with:
- "closeProbability": A float between 0.0 and 1.0 representing the probability of closing this deal.
- "projectedValue": An integer representing the estimated final deal value.
- "projectedCloseDate": An ISO 8601 date string for the estimated close date.
`;

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const data = JSON.parse(completion.choices[0].message.content);
    return {
      closeProbability: data.closeProbability ?? 0.5,
      projectedValue: data.projectedValue ?? null,
      projectedCloseDate: data.projectedCloseDate ?? null,
    };
  } catch (error) {
    console.error("Forecast Generation Failed:", error);
    return { closeProbability: 0.5, projectedValue: null, projectedCloseDate: null };
  }
}