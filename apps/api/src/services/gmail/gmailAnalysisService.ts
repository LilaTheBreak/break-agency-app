import { InboundEmail, Prisma } from "@prisma/client";
import OpenAI from "openai";
import prisma from '../../lib/prisma';
import { cleanEmailBody } from './gmailParser';
import { classifyWithRules } from './gmailCategoryEngine';

// Mock queue for deal extraction pipeline
const dealExtractorQueue = {
  add: (data: { emailId: string }) => {
    console.log(`[Queue] Deal extraction job added for email: ${data.emailId}`);
  }
};

const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const AI_MODEL = "gpt-4o"; // Use a powerful and cost-effective model

interface AIResponse {
  category: string;
  brand: string | null;
  urgency: "low" | "medium" | "high";
  summary: string;
  recommendedAction: string;
  confidence: number;
  isDeal: boolean;
}

/**
 * Analyzes the content of an email using an AI model.
 * @param cleanText - The cleaned text content of the email.
 * @returns A promise that resolves to the structured AI analysis.
 */
async function getAIAnalysis(cleanText: string): Promise<AIResponse> {
  const prompt = `
    Analyze the following email content and provide a structured JSON response.
    Email content: "${cleanText.substring(0, 8000)}"

    JSON structure should be:
    {
      "category": "string (one of: deal, invite, event, pr, gifting, negotiation, payment, spam, other)",
      "brand": "string (the primary brand name mentioned, or null)",
      "urgency": "string (one of: low, medium, high)",
      "summary": "string (a one-sentence summary of the email)",
      "recommendedAction": "string (a brief, actionable next step)",
      "confidence": "number (0.0 to 1.0, your confidence in the classification)",
      "isDeal": "boolean (true if the category is 'deal', 'paid collaboration', or 'offer')"
    }
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(completion.choices[0].message.content || "{}");
    return result as AIResponse;
  } catch (error) {
    console.error("Error getting AI analysis:", error);
    // Fallback to a default error state
    return {
      category: "other",
      brand: null,
      urgency: "low",
      summary: "AI analysis failed.",
      recommendedAction: "Review manually.",
      confidence: 0.0,
      isDeal: false
    };
  }
}

/**
 * Analyzes a single email, updates the database, and triggers downstream processes.
 * @param emailId - The ID of the InboundEmail to analyze.
 * @param userId - The ID of the user who owns the email.
 * @returns The updated InboundEmail record.
 */
export async function analyzeEmailById(
  emailId: string,
  userId: string
): Promise<InboundEmail | null> {
  const email = await prisma.inboundEmail.findFirst({
    where: { id: emailId, userId }
  });

  if (!email) {
    return null;
  }

  const cleanText = email.body || "";
  const ruleBasedResult = classifyWithRules(cleanText, email.subject || "", email.fromEmail);

  // Use AI analysis
  const aiResult = await getAIAnalysis(cleanText);

  // Combine results (AI takes precedence, but rules can inform)
  const finalCategory = aiResult.confidence > 0.5 ? aiResult.category : ruleBasedResult.category;

  const dataToUpdate: Prisma.InboundEmailUpdateInput = {
    aiCategory: finalCategory,
    aiUrgency: aiResult.urgency,
    aiSummary: aiResult.summary,
    aiRecommendedAction: aiResult.recommendedAction,
    aiConfidence: aiResult.confidence,
    aiJson: aiResult as any // Store the full raw AI response
  };

  const updatedEmail = await prisma.inboundEmail.update({
    where: { id: emailId },
    data: dataToUpdate
  });

  // Trigger deal extraction if classified as a deal
  if (aiResult.isDeal || ["deal", "offer", "paid collaboration"].includes(finalCategory)) {
    dealExtractorQueue.add({ emailId });
  }

  return updatedEmail;
}

/**
 * Analyzes all emails in a thread and updates the parent InboxMessage.
 * @param threadId - The ID of the thread to analyze.
 * @param userId - The ID of the user who owns the thread.
 */
export async function analyzeThreadById(threadId: string, userId: string) {
  const thread = await prisma.inboxMessage.findFirst({
    where: { threadId, userId },
    include: { InboundEmail: { orderBy: { receivedAt: "asc" } } }
  });

  if (!thread || thread.InboundEmail.length === 0) {
    return { error: "Thread not found or is empty." };
  }

  // Concatenate content from all emails in the thread
  const fullThreadText = thread.InboundEmail
    .map((email) => `From: ${email.fromEmail}\nSubject: ${email.subject}\n\n${email.body || ""}`)
    .join("\n\n--- Next Email in Thread ---\n\n");

  // A different prompt for thread-level summarization
  const analysis = await getAIAnalysis(fullThreadText); // Re-using for simplicity

  // Update the thread metadata with the summary
  await prisma.inboxThreadMeta.update({
    where: { threadId: thread.threadId },
    data: {
      aiThreadSummary: analysis.summary
    }
  }).catch(() => null);

  return { success: true, summary: analysis.summary };
}

/**
 * Analyzes the latest 200 un-analyzed emails for a user.
 * @param userId - The ID of the user.
 */
export async function analyzeBulkForUser(userId: string) {
  const emailsToAnalyze = await prisma.inboundEmail.findMany({
    where: { userId, aiCategory: null },
    orderBy: { receivedAt: "desc" },
    take: 200,
    select: { id: true }
  });

  // In a real app, this should be offloaded to a background job queue.
  // For this implementation, we run them sequentially.
  for (const email of emailsToAnalyze) {
    await analyzeEmailById(email.id, userId);
  }

  return { processed: emailsToAnalyze.length };
}