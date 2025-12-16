import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const AI_MODEL = "gpt-4o";

interface SuitabilityExplanation {
  humanReadableSummary: string;
  recommendedNextActions: string[];
  riskInterpretation: string;
  confidence: number;
}

/**
 * Generates human-readable explanations and recommendations from suitability results.
 * @param suitabilityResult - The raw suitability score and breakdown.
 * @param rawData - Additional context used for the scoring.
 * @returns A structured explanation.
 */
export async function generateSuitabilityExplanation(
  suitabilityResult: any,
  rawData: any
): Promise<SuitabilityExplanation> {
  const prompt = `
    Based on the following suitability analysis and raw data, generate a human-readable explanation, recommended next actions, and an interpretation of the risks.

    **Suitability Result:**
    ${JSON.stringify(suitabilityResult, null, 2)}

    **Raw Data Context:**
    ${JSON.stringify(rawData, null, 2)}

    Return a JSON object with this exact structure:
    {
      "humanReadableSummary": "string (A concise, easy-to-understand summary of the fit)",
      "recommendedNextActions": "string[] (e.g., ['Review creator's past brand collaborations', 'Discuss brand safety guidelines with creator'])",
      "riskInterpretation": "string (Explanation of any identified risks and their potential impact)",
      "confidence": "number (0.0-1.0)"
    }
  `;

  const completion = await openai.chat.completions.create({ model: AI_MODEL, messages: [{ role: "user", content: prompt }], response_format: { type: "json_object" } });
  return JSON.parse(completion.choices[0].message.content || "{}") as SuitabilityExplanation;
}