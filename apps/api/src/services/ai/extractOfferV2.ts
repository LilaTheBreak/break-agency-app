import { InboundEmail } from "@prisma/client";
import { aiClient } from './aiClient.js';

type LaunchWindow = { start?: string | null; end?: string | null };

export type OfferDeliverable = {
  type: string;
  quantity?: number | null;
  notes?: string | null;
};

export type OfferOption = {
  title?: string | null;
  deliverables?: OfferDeliverable[] | null;
  currency?: string | null;
  amount?: number | null;
  usageRights?: string | null;
  exclusivity?: string | null;
  deadline?: string | null;
  launchWindow?: LaunchWindow | null;
  roundsIncluded?: number | null;
  meta?: Record<string, unknown> | null;
};

export type OfferExtractionResult = {
  hasMultipleOffers: boolean;
  options: OfferOption[];
  brandName?: string | null;
  confidence?: number | null;
  raw?: Record<string, unknown> | null;
};

const CURRENCY_MAP: Record<string, string> = {
  "£": "GBP",
  gbp: "GBP",
  pound: "GBP",
  pounds: "GBP",
  $: "USD",
  usd: "USD",
  dollars: "USD",
  "€": "EUR",
  eur: "EUR",
  euro: "EUR",
  euros: "EUR",
  aed: "AED",
  sar: "SAR",
  sek: "SEK",
  nok: "NOK"
};

const DELIVERABLE_MAP: Record<string, string> = {
  instagram_reel: "instagram_reel",
  reel: "instagram_reel",
  ig_reel: "instagram_reel",
  instagram_story: "instagram_story",
  story: "instagram_story",
  tiktok_video: "tiktok_video",
  tiktok: "tiktok_video",
  ugc_video: "ugc_video",
  ugc: "ugc_video",
  youtube_short: "youtube_short",
  short: "youtube_short",
  static_post: "static_post",
  post: "static_post",
  event_appearance: "event_appearance",
  appearance: "event_appearance"
};

export function normaliseCurrency(input?: string | null): string | null {
  if (!input) return null;
  const lower = input.trim().toLowerCase();
  if (CURRENCY_MAP[lower]) return CURRENCY_MAP[lower];
  if (CURRENCY_MAP[input.trim()]) return CURRENCY_MAP[input.trim()];
  const symbolMatch = Object.keys(CURRENCY_MAP).find((key) => lower.includes(key));
  if (symbolMatch) return CURRENCY_MAP[symbolMatch];
  const maybeCode = lower.replace(/[^a-z]/g, "").toUpperCase();
  if (maybeCode.length === 3) return maybeCode;
  return null;
}

function parseAmountFromText(text: string): { amount?: number; currency?: string | null } {
  const priceRegex =
    /(?<symbol>[$€£])?\s*(?<amount>\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?)(?:\s*(?<code>usd|eur|gbp|aed|sar|sek|nok|dollars|pounds|euro|euros))?/i;
  const match = text.match(priceRegex);
  if (!match?.groups) return {};
  const rawAmount = match.groups.amount?.replace(/,/g, "");
  const amount = rawAmount ? Number(rawAmount) : undefined;
  const currency = normaliseCurrency(match.groups.symbol || match.groups.code || null);
  return { amount, currency };
}

function toISODate(input?: string | null): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  // Range handling: Jan 12-20 or Jan 12–20
  const rangeMatch = trimmed.match(
    /(?<startMonth>[A-Za-z]{3,9})\s*(?<startDay>\d{1,2})\s*[-–]\s*(?<endDay>\d{1,2})/i
  );
  if (rangeMatch?.groups) {
    const year = new Date().getFullYear();
    const start = new Date(`${rangeMatch.groups.startMonth} ${rangeMatch.groups.startDay} ${year}`);
    const end = new Date(`${rangeMatch.groups.startMonth} ${rangeMatch.groups.endDay} ${year}`);
    return `${start.toISOString().slice(0, 10)}|${end.toISOString().slice(0, 10)}`;
  }

  const relativeMatch = trimmed.match(/in\s+(\d+)\s+(day|days|week|weeks)/i);
  if (relativeMatch) {
    const count = Number(relativeMatch[1]);
    const multiplier = /week/i.test(relativeMatch[2]) ? 7 : 1;
    const target = new Date();
    target.setDate(target.getDate() + count * multiplier);
    return target.toISOString().slice(0, 10);
  }

  const turnaroundMatch = trimmed.match(/(\d+)\s*(h|hours|hour|hrs)/i);
  if (turnaroundMatch) {
    const hours = Number(turnaroundMatch[1]);
    const target = new Date();
    target.setHours(target.getHours() + hours);
    return target.toISOString();
  }

  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return null;
}

function normalizeDeliverables(items?: OfferDeliverable[] | null): OfferDeliverable[] {
  if (!items?.length) return [];
  return items.map((d) => {
    const key = (d.type || "").toLowerCase().replace(/\s+/g, "_");
    const mapped = DELIVERABLE_MAP[key] || key || "other";
    return {
      type: mapped,
      quantity: d.quantity ?? null,
      notes: d.notes ?? null
    };
  });
}

function normalizeDeadline(deadline?: string | null): { deadline: string | null; launchWindow: LaunchWindow | null } {
  if (!deadline) return { deadline: null, launchWindow: null };
  const rangeEncoded = toISODate(deadline);
  if (rangeEncoded && rangeEncoded.includes("|")) {
    const [start, end] = rangeEncoded.split("|");
    return { deadline: end || null, launchWindow: { start: start || null, end: end || null } };
  }
  return { deadline: rangeEncoded, launchWindow: null };
}

export async function extractOfferV2(email: InboundEmail): Promise<OfferExtractionResult> {
  const text = `${email.subject || ""}\n${email.snippet || ""}\n${email.body || ""}`.trim();

  const prompt = `
You extract deal options from influencer inbound emails. Understand multi-option offers, tiered pricing, rate card requests, and bundles.
Email text:
"""
${text}
"""
Return strict JSON with this shape:
{
  "brandName": "string|null",
  "hasMultipleOffers": boolean,
  "options": [
    {
      "title": "Option A",
      "deliverables": [
        {
          "type": "instagram_reel|instagram_story|tiktok_video|ugc_video|youtube_short|static_post|event_appearance|other",
          "quantity": 1,
          "notes": "details"
        }
      ],
      "currency": "GBP|USD|EUR|AED|SAR|SEK|NOK|OTHER",
      "amount": 1500,
      "usageRights": "3 months paid usage",
      "exclusivity": "protein category, 30 days",
      "deadline": "ISO date if single deadline",
      "launchWindow": { "start": "ISO date", "end": "ISO date" },
      "roundsIncluded": 2,
      "meta": {}
    }
  ],
  "confidence": 0-1,
  "raw": {}
}
If multiple options are present (tiers, bundles, rate-card), split them into separate option entries. If only one option, still return an options array of length 1.
`;

  const ai = await aiClient.json(prompt);
  const options = Array.isArray((ai as any)?.options) ? (ai as any).options : [];
  const brandName = (ai as any)?.brandName || (email as any).from || (email as any).fromEmail || null;
  const confidence = typeof (ai as any)?.confidence === "number" ? (ai as any).confidence : null;

  const sanitized = options.map((option: any) => {
    const deliverables = normalizeDeliverables(option?.deliverables);
    const amount =
      typeof option?.amount === "number"
        ? option.amount
        : parseAmountFromText(option?.amount || "").amount ?? parseAmountFromText(text).amount;
    const currency =
      normaliseCurrency(option?.currency) ?? parseAmountFromText(option?.amount || text).currency ?? null;
    const { deadline, launchWindow } = normalizeDeadline(option?.deadline);

    return {
      title: option?.title || null,
      deliverables,
      currency,
      amount: amount ?? null,
      usageRights: option?.usageRights || null,
      exclusivity: option?.exclusivity || null,
      deadline,
      launchWindow: option?.launchWindow || launchWindow,
      roundsIncluded:
        typeof option?.roundsIncluded === "number" ? option.roundsIncluded : parseInt(option?.roundsIncluded || "", 10) || null,
      meta: option?.meta || option || {}
    } as OfferOption;
  });

  const hasMultipleOffers = (ai as any)?.hasMultipleOffers === true || sanitized.length > 1;

  return {
    hasMultipleOffers,
    options: sanitized,
    brandName,
    confidence,
    raw: (ai as any)?.raw || (ai as any) || {}
  };
}
