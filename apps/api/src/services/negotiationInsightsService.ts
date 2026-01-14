import OpenAI from "openai";
import prisma from '../lib/prisma.js';
import { sendSlackAlert } from '../integrations/slack/slackClient.js';
import { safeEnv } from '../utils/safeEnv.js';

const OPENAI_API_KEY = safeEnv("OPENAI_API_KEY", "");
const OPENAI_MODEL = safeEnv("NEGOTIATION_MODEL", safeEnv("OPENAI_MODEL", "gpt-4o-mini"));
const client = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

export async function generateNegotiationInsight(dealId: string) {
  // TODO: Implement negotiation insights once DealDraft is properly integrated
  return prisma.negotiationInsight.create({
    data: {
      dealId,
      insight: JSON.stringify({
        recommendedRate: 5000,
        rateCurrency: "USD",
        justification: "Negotiation insights not yet implemented",
        redFlags: [],
        softSignals: [],
        negotiationScript: "",
        confidence: 0.1
      })
    }
  });
}
