import OpenAI from "openai";
import { cleanEmailBody } from '../gmail/gmailParser';

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error("[CRITICAL] OPENAI_API_KEY is not set in environment variables. AI services will fail.");
}
const openai = apiKey ? new OpenAI({ apiKey }) : null;
const AI_MODEL = "gpt-4o";

export interface OfferTerms {
  price: number | null;
  currency: string | null;
  deliverables: string[];
  deadlines: string[];
  usageRights: string | null;
  paymentTerms: string | null;
  brandName: string | null;
}

/**
 * Extracts structured offer terms from the text of an email.
 * @param emailBody - The raw HTML or text body of the email.
 * @returns A promise that resolves to the extracted offer terms.
 */
export async function extractOfferFromEmail(emailBody: string): Promise<OfferTerms> {
  const cleanText = cleanEmailBody(emailBody);

  const prompt = `
    Analyze the following email content to extract deal offer terms.
    Email: "${cleanText.substring(0, 8000)}"

    Return a JSON object with this exact structure. If a value is not found, use null or an empty array.
    {
      "price": "number (e.g., 1500, not '$1,500')",
      "currency": "string (e.g., 'USD', 'GBP', 'EUR')",
      "deliverables": "string[] (e.g., ['1x Instagram Reel', '3x Stories'])",
      "deadlines": "string[] (e.g., ['Draft due by Oct 26th', 'Live by Nov 5th'])",
      "usageRights": "string (e.g., '6 months, paid social channels')",
      "paymentTerms": "string (e.g., 'Net 30')",
      "brandName": "string (the name of the brand making the offer)"
    }
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [{ role: "system", content: "You are an expert at extracting structured data from emails." },{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(completion.choices[0].message.content || "{}");
    return result as OfferTerms;
  } catch (error) {
    console.error("Error extracting offer from email:", error);
    // Return a default empty object on failure
    return {
      price: null, currency: null, deliverables: [], deadlines: [],
      usageRights: null, paymentTerms: null, brandName: null
    };
  }
}