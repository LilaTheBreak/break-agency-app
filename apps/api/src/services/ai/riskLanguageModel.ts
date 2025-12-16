import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const AI_MODEL = "gpt-4o";

interface TextRiskAnalysis {
  riskScore: number; // 0-100
  flags: string[]; // "scam_detected", "high_urgency", "impersonation_risk", "suspicious_intent"
  summary: string;
  confidence: number;
}

/**
 * Analyzes text content for various linguistic risks.
 * @param text - The email body or message content.
 * @returns A structured risk analysis object.
 */
export async function analyzeTextForRisk(text: string): Promise<TextRiskAnalysis> {
  const prompt = `
    Analyze the following text for signs of risk, including scams, phishing, impersonation, social engineering, and unusual urgency.

    Text: "${text.substring(0, 4000)}"

    Return a JSON object with this exact structure:
    {
      "riskScore": "number (0-100, where 100 is highest risk)",
      "flags": "string[] (e.g., ['scam_detected', 'high_urgency', 'impersonation_risk'])",
      "summary": "string (A brief explanation of the detected risks)",
      "confidence": "number (0.0-1.0, your confidence in the assessment)"
    }
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: "system", content: "You are a security expert specializing in linguistic risk detection." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    return JSON.parse(completion.choices[0].message.content || "{}") as TextRiskAnalysis;
  } catch (error) {
    console.error("Error analyzing text for risk:", error);
    return {
      riskScore: 10,
      flags: ["analysis_failed"],
      summary: "AI risk analysis could not be completed.",
      confidence: 0.1,
    };
  }
}
