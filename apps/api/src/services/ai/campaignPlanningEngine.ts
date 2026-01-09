import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error("[CRITICAL] OPENAI_API_KEY is not set in environment variables. AI services will fail.");
}
const openai = apiKey ? new OpenAI({ apiKey }) : null;
const AI_MODEL = "gpt-4o";

interface CampaignBrief {
  brandName: string;
  goals: string;
  targetAudience: string;
  budget: number;
}

/**
 * Generates a full campaign plan based on a brief.
 * @param brief - The campaign brief from the brand.
 * @returns A promise that resolves to a structured campaign plan.
 */
export async function generateCampaignPlan(brief: CampaignBrief) {
  const prompt = `
    You are a world-class campaign strategist. Based on the following brief, generate a comprehensive campaign plan.

    **Campaign Brief:**
    ${JSON.stringify(brief, null, 2)}

    **Instructions:**
    Create a list of recommended deliverables, a proposed timeline, and predict the potential ROI.

    **Return JSON with this exact structure:**
    {
      "summary": "string (A high-level summary of the proposed campaign strategy)",
      "deliverables": [{ "type": "e.g., 'Instagram Reel'", "quantity": "number", "description": "string" }],
      "timeline": [{ "week": "number", "activity": "string" }],
      "kpis": ["e.g., 'Reach'", "e.g., 'Engagement Rate'", "e.g., 'Website Clicks'"],
      "forecast": {
        "projectedReach": "number",
        "projectedEngagement": "number",
        "predictedROI": "string (e.g., '2.5x')"
      },
      "confidence": "number (0.0-1.0)"
    }
  `;

  const completion = await openai.chat.completions.create({
    model: AI_MODEL,
    messages: [{ role: "system", content: "You are a top-tier campaign planner." }, { role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  const result = JSON.parse(completion.choices[0].message.content || "{}");
  return { ok: true, plan: result };
}