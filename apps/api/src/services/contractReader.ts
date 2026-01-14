import OpenAI from "openai";
import prisma from '../lib/prisma';
import { sendSlackAlert } from '../integrations/slack/slackClient';
import { detectFileType, extractText, cleanText } from '../lib/fileExtract';
import { safeEnv } from '../utils/safeEnv';

const OPENAI_API_KEY = safeEnv("OPENAI_API_KEY", "dev-openai-key");
const OPENAI_MODEL = safeEnv("OPENAI_MODEL", "gpt-4o-mini");

const client = new OpenAI({
  apiKey: OPENAI_API_KEY
});

type ContractExtraction = {
  deliverables?: string[];
  deadlines?: string[];
  fees?: string[];
  usage_rights?: string;
  exclusivity?: string;
  payment_terms?: string;
  revision_policy?: string;
  termination?: string;
  usage_risk_score?: number;
  notes?: string[];
  summary?: string;
};

export async function processContract(fileUrl: string, dealId: string, userId: string) {
  try {
    const text = await extractTextFromFile(fileUrl);
    const payload = await callOpenAI(text);

    // persist to contract if it exists
    await prisma.contract
      .update({
        where: { id: dealId },
        data: {
          status: "review",
          metadata: payload as any
        }
      })
      .catch(() => null);

    await prisma.dealTimeline.create({
      data: {
        id: `timeline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        dealId,
        createdById: userId,
        type: "CONTRACT_ANALYZED",
        message: "AUTO: Contract processed and legal summary generated",
        metadata: payload as any
      }
    });

    if ((payload.usage_risk_score ?? 0) >= 7) {
      await sendSlackAlert("⚠️ Contract Risk Detected", {
        dealId,
        risk: payload.usage_rights ?? "Usage risk high"
      });
    }

    return payload;
  } catch (error) {
    await sendSlackAlert("Contract processing failed", { dealId, error: `${error}` });
    throw error;
  }
}

async function extractTextFromFile(fileUrl: string): Promise<string> {
  const res = await fetch(fileUrl);
  if (!res.ok) {
    throw new Error("Unable to download contract");
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  const type = await detectFileType(buffer, fileUrl);
  const raw = await extractText(buffer, type);
  return cleanText(raw).slice(0, 32000);
}

async function callOpenAI(text: string): Promise<ContractExtraction> {
  if (!OPENAI_API_KEY) {
    return {
      deliverables: [],
      deadlines: [],
      fees: [],
      usage_rights: "",
      exclusivity: "",
      payment_terms: "",
      revision_policy: "",
      termination: "",
      usage_risk_score: 5,
      notes: ["OpenAI key missing; heuristic output only."],
      summary: text.slice(0, 400)
    };
  }

  const prompt = `You are a senior legal analyst. Extract structured data from the following contract text. Return JSON ONLY with keys: deliverables (array), deadlines (array), fees (array), usage_rights (string), exclusivity (string), payment_terms (string), revision_policy (string), termination (string), usage_risk_score (0-10 number), notes (array), summary (string, 6-8 sentences). Avoid legal advice; summarise what is written.\n\nTEXT:\n${text}`;

  const response = await client.chat.completions.create({
    model: OPENAI_MODEL || "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: "You are an expert contract analyst. Be concise and factual." },
      { role: "user", content: prompt }
    ],
    temperature: 0.2
  });

  const content = response.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Empty AI response");
  }

  return JSON.parse(content) as ContractExtraction;
}
