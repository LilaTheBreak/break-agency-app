import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const AI_MODEL = "gpt-4o";

/**
 * Scores a lead's potential quality based on their company and role.
 * @param leadData - Information about the lead.
 * @returns A score from 0-100 and a classification.
 */
export async function scoreLead(leadData: { companyName: string; contactName?: string; notes?: string }) {
  const prompt = `
    You are a business development expert. Score the following lead on a scale of 0-100 based on their potential value.
    - High scores for decision-makers at well-known brands.
    - Medium scores for managers or related roles at interesting companies.
    - Low scores for generic or non-decision-maker roles.

    Lead Data:
    ${JSON.stringify(leadData, null, 2)}

    Return a JSON object with this exact structure:
    {
      "score": "number (0-100)",
      "category": "string ('hot', 'warm', or 'cold')",
      "reasoning": "string (a brief explanation for the score)"
    }
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [{ role: "system", content: "You are a sales development expert." }, { role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });
    return JSON.parse(completion.choices[0].message.content || "{}");
  } catch (error) {
    console.error("Error scoring lead:", error);
    return { score: 30, category: 'cold', reasoning: 'AI scoring failed.' };
  }
}