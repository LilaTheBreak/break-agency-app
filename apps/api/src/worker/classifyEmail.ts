import { aiClient } from '../ai/aiClient.js';

export type EmailClassification = {
  category: "deal" | "invite" | "gifting" | "spam" | "other";
  brand: string | null;
  confidence: number;
  urgency: "low" | "medium" | "high";
  deadline: string | null;
  offerType: string | null;
  suggestedAction: string;
  extracted: {
    deliverables: string[];
    budget: number | null;
    currency: string | null;
    eventDate: string | null;
    location: string | null;
  };
};

const classificationPrompt = (subject: string, body: string) => `
Analyze the following email and classify it.

Subject: ${subject}
Body:
${body.slice(0, 3000)}

Respond with JSON matching this structure:
{
  "category": "deal" | "invite" | "gifting" | "spam" | "other",
  "brand": "Brand Name" | null,
  "confidence": 0.0-1.0,
  "urgency": "low" | "medium" | "high",
  "deadline": "YYYY-MM-DD" | null,
  "offerType": "e.g., 'paid partnership', 'event attendance'" | null,
  "suggestedAction": "e.g., 'Reply to negotiate terms', 'Ignore spam'",
  "extracted": {
    "deliverables": ["1x TikTok", "2x Instagram Stories"],
    "budget": 5000 | null,
    "currency": "USD" | null,
    "eventDate": "YYYY-MM-DD" | null,
    "location": "City, Country" | null
  }
}
`;

export async function classifyEmail(
  subject: string,
  body: string
): Promise<EmailClassification> {
  const prompt = classificationPrompt(subject, body);
  try {
    const result = await aiClient.json(prompt);
    // Basic validation to ensure the AI response is in the expected format
    if (result && typeof result === "object" && "category" in result) {
      return result as EmailClassification;
    }
    throw new Error("AI response did not match expected structure.");
  } catch (error) {
    console.error("[AI CLASSIFICATION ERROR]", error);
    // Fallback to a default "other" classification on error
    const fallback = await aiClient.json("fallback");
    return fallback as EmailClassification;
  }
}