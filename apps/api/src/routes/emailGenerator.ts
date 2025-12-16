import OpenAI from "openai";

const client = new OpenAI();

export async function generateEmail(deal, context) {
  const prompt = `
You are an expert talent agent. Draft a negotiation email based on the following deal thread and context.

Deal History:
${deal.messages.map(m => `${m.sender}: ${m.body}`).join("\n")}

Negotiation Goal: ${context.goal || "Move the deal forward."}
Desired Tone: ${context.tone || "Professional and collaborative."}

Return JSON with a single key "emailBody" containing the full, ready-to-send email text.
`;

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const data = JSON.parse(completion.choices[0].message.content);
    return {
      emailBody: data.emailBody || "Could not generate email draft.",
    };
  } catch (error) {
    console.error("Email Generation Failed:", error);
    return { emailBody: "Could not generate email draft." };
  }
}