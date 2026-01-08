import OpenAI from "openai";
import { buildBundlePrompt } from "../../prompts/bundlePromptBuilder.js";
import { trackAITokens } from "./tokenTracker.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const AI_MODEL = "gpt-4o";

export async function runBundleLLM(input: any) {
  const prompt = buildBundlePrompt(input);
  const start = Date.now();
  let tokens = 0;

  try {
    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: "system", content: "You are an expert deal strategist for influencer marketing." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    tokens = completion.usage?.total_tokens ?? 0;
    const result = JSON.parse(completion.choices[0].message.content || "{}");
    const latency = Date.now() - start;
    // Track tokens: use estimated split between prompt and completion
    await trackAITokens({ 
      model: "gpt-4.1", 
      promptTokens: Math.floor(tokens * 0.3),
      completionTokens: Math.floor(tokens * 0.7)
    });
    return {
      ok: true,
      data: result,
      meta: {
        tokens,
        latency,
      },
    };
  } catch (error) {
    console.error("Error running Bundle LLM:", error);
    const latency = Date.now() - start;
    await trackAITokens({ 
      model: "gpt-4.1",
      promptTokens: Math.floor(tokens * 0.3),
      completionTokens: Math.floor(tokens * 0.7)
    });
    return {
      ok: false,
      data: null,
      meta: {
        tokens,
        latency,
      },
    };
  }
}
