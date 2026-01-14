import { trackAITokens } from './tokenTracker';
import { buildDealExtractionPrompt } from '../../prompts/dealExtractionPrompt';

interface DealExtractionResult {
  dealValue: number | null;
  currency: string | null;
  brandName: string | null;
  contactEmail: string | null;
  deliverables: string[];
}

export async function extractDealFromEmail(emailBody: string) {
  console.log("extractDealFromEmail called");
  const start = Date.now();
  let tokensUsed = 0;

  try {
    console.log("Parsing email body:", emailBody.substring(0, 100));

    const prompt = buildDealExtractionPrompt({ emailBody });
    console.log("Parsing email body:", emailBody.substring(0, 100));
    const result: DealExtractionResult = {
      dealValue: 5000,
      currency: "USD",
      brandName: "Mock Brand",
      contactEmail: "contact@mockbrand.com",
      deliverables: ["1x Instagram Post", "2x Instagram Stories"],
    };

    await trackAITokens({ service: "extractDealFromEmail", tokens: tokensUsed });
    const latency = Date.now() - start;
    return {
      ok: true,
      data: result,
      meta: {
        tokens: tokensUsed,
        latency,
      },
    };
  } catch (err) {
    console.error("Error in extractDealFromEmail", err);
    const latency = Date.now() - start;
    await trackAITokens({ service: "extractDealFromEmail", tokens: tokensUsed });
    return {
      ok: false,
      data: {
        dealValue: null,
        currency: null,
        brandName: null,
        contactEmail: null,
        deliverables: [],
      },
      meta: {
        tokens: tokensUsed,
        latency,
      },
    };
  }
}
