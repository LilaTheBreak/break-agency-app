import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error("[CRITICAL] OPENAI_API_KEY is not set in environment variables. AI services will fail.");
}
const openai = apiKey ? new OpenAI({ apiKey }) : null;
const AI_MODEL = "gpt-4o";

interface CampaignLLMInput {
  brief: any;
  brandProfile: any;
  talentProfile: any;
}

/**
 * The core AI engine for generating campaign concepts and plans.
 * @param input - The combined brief, brand, and talent data.
 * @param task - The specific task for the LLM (e.g., "generate_concepts", "generate_deliverables").
 * @returns A structured JSON response from the AI model.
 */
export async function runCampaignLLM(input: CampaignLLMInput, task: string) {
  // Modular prompt builder
  const buildPrompt = () => {
    let prompt = `You are a world-class influencer campaign strategist. Your task is to ${task}.\n\n`;
    prompt += `**Brand Profile:**\n${JSON.stringify(input.brandProfile, null, 2)}\n\n`;
    prompt += `**Talent Profile:**\n${JSON.stringify(input.talentProfile, null, 2)}\n\n`;
    prompt += `**Campaign Brief:**\n${JSON.stringify(input.brief, null, 2)}\n\n`;

    switch (task) {
      case "generate_concepts":
        prompt += `Generate 3 distinct creative concepts. For each, provide a title, a short narrative, and key messaging points. Return as a JSON object with a "concepts" key.`;
        break;
      case "generate_deliverables":
        prompt += `Based on the brief and a budget of ${input.brief.budgetMax}, propose a list of deliverables. Include type, platform, quantity, and a brief description. Return as a JSON object with a "deliverables" key.`;
        break;
      case "generate_timeline":
        prompt += `Based on the brief and proposed deliverables, generate a detailed campaign timeline with key milestones and deadlines. Return as a JSON object with a "timeline" key.`;
        break;
      case "generate_forecast":
        prompt += `Based on the brief, proposed deliverables, and talent profile, predict the campaign's performance metrics (impressions, ER, engagement counts) and confidence bands. Return as a JSON object with a "forecast" key.`;
        break;
      case "generate_creative_direction":
        prompt += `Based on the brief and brand profile, generate creative direction including tone, visual style, sample copy, and visual examples. Return as a JSON object with a "creativeDirection" key.`;
        break;
      case "generate_storyboard":
        prompt += `Based on the creative concepts and deliverables, generate a shot guide and script beats for a primary video deliverable. Return as a JSON object with a "storyboard" key.`;
        break;
      case "generate_hashtags":
        prompt += `Based on the campaign brief and creative concepts, generate 3 sets of hashtags: Hero, Performance, and Niche. Return as a JSON object with a "hashtags" key.`;
        break;
      case "generate_posting_schedule":
        prompt += `Based on the campaign timeline and deliverables, create a full publishing calendar with recommended posting windows and frequency suggestions. Return as a JSON object with a "postingSchedule" key.`;
        break;
      // Add other tasks like "generate_timeline", "generate_forecast", etc.
      default:
        throw new Error(`Unknown campaign LLM task: ${task}`);
    }
    return prompt;
  };

  if (!openai) {
    console.error("[AI] OpenAI client not initialized");
    return {
      ok: false,
      error: "AI_CLIENT_UNAVAILABLE",
      confidence: 0,
    };
  }

  const prompt = buildPrompt();

  try {
    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: "system", content: "You are an expert campaign strategist." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(completion.choices[0].message.content || "{}");
    return {
      ok: true,
      data: result,
      confidence: 0.9, // Placeholder confidence
    };
  } catch (error) {
    console.error(`Error running campaign LLM for task "${task}":`, error);
    // Error fallback
    return {
      ok: false,
      error: "AI_GENERATION_FAILED",
      confidence: 0.2,
    };
  }
}