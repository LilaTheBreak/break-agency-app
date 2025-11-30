import type { ParsedEmail } from "./emailParser.js";

const KEYWORDS: Array<{ terms: string[]; score: number; label: string }> = [
  { terms: ["gift", "gifting", "seed"], score: 20, label: "gifting" },
  { terms: ["invite", "invitation", "event", "rsvp"], score: 30, label: "invitation" },
  { terms: ["campaign", "collaboration", "brief", "partnership"], score: 40, label: "campaign" },
  { terms: ["budget", "paid", "rate", "fee"], score: 50, label: "budget" }
];

const CORPORATE_DOMAIN = /@.+\.(co\.uk|com)$/i;
const FREE_DOMAINS = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com"];

export function scoreEmail(parsed: ParsedEmail) {
  let score = 0;
  const labels: string[] = [];
  const haystack = `${parsed.subject || ""} ${parsed.body || ""}`.toLowerCase();

  for (const entry of KEYWORDS) {
    if (entry.terms.some((term) => haystack.includes(term))) {
      score += entry.score;
      labels.push(entry.label);
    }
  }

  const from = parsed.from || "";
  const domainMatch = from.match(/@([^>]+)$/);
  const domain = domainMatch ? domainMatch[1].toLowerCase() : "";
  const isFree = FREE_DOMAINS.some((d) => domain.endsWith(d));
  if (domain && !isFree && CORPORATE_DOMAIN.test(from)) {
    score += 10;
    labels.push("brand-domain");
  }

  const isOpportunity = score >= 40;
  return { score, labels, isOpportunity };
}
