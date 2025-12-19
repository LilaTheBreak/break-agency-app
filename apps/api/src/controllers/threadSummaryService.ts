import OpenAI from "openai";
import prisma from "../../lib/prisma.js";
import { getMessagesForThread } from "./threadService.js";
import { cleanEmailBody } from "../gmail/gmailParser.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const AI_MODEL = "gpt-4o";

interface ThreadSummary {
  summary: string;
  recommendedAction: string;
  brand: string | null;
}

/**
 * Generates an AI-powered summary for a given thread.
 * @param threadId - The ID of the thread to summarize.
 * @param userId - The ID of the user who owns the thread.
 * @returns The generated summary and metadata.
 */
export async function summarizeThread(
  threadId: string,
  userId: string
): Promise<ThreadSummary | null> {
  const messages = await getMessagesForThread(threadId, userId);

  if (!messages || messages.length === 0) {
    return null;
  }

  const threadContent = messages
    .map((msg) => {
      const body = "bodyHtml" in msg ? msg.bodyHtml : "body" in msg ? msg.body : "";
      return `From: ${msg.from}\nSubject: ${msg.subject}\n\n${cleanEmailBody(body || "")}`;
    })
    .join("\n\n--- Next Message ---\n\n");

  const prompt = `
    Summarize the following email thread. Identify the primary brand being discussed,
    provide a bullet-point summary, and suggest the next recommended action.

    Thread Content: "${threadContent.substring(0, 12000)}"

    Return a JSON object with this structure:
    {
      "summary": "string (bullet-point summary, use markdown)",
      "recommendedAction": "string (a single, clear next step)",
      "brand": "string (the primary brand name, or null)"
    }
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(completion.choices[0].message.content || "{}") as ThreadSummary;

    // Persist the summary to the metadata table
    await prisma.inboxThreadMeta.upsert({
      where: { threadId },
      update: {
        aiThreadSummary: result.summary,
        // You could also store the other fields here
      },
      create: {
        threadId,
        userId,
        aiThreadSummary: result.summary,
        lastMessageAt: new Date() // Or get from last message
      }
    });

    return result;
  } catch (error) {
    console.error(`AI summarization failed for thread ${threadId}:`, error);
    return {
      summary: "Failed to generate AI summary.",
      recommendedAction: "Review thread manually.",
      brand: null
    };
  }
}