export async function analyzeContractAI(rawText: string) {
  const summary = {
    overview: "AI-generated summary for drafting purposes only.",
    keyPoints: extractKeyPoints(rawText)
  };

  const risks = detectRisks(rawText);
  const redlines = buildRedlines(risks);
  const terms = extractTerms(rawText);
  const dealMapping = mapDealFromContract(terms);

  return {
    summary,
    risks,
    redlines,
    terms,
    dealMapping
  };
}

function extractKeyPoints(text: string) {
  return text
    .split(".")
    .slice(0, 5)
    .map((s) => s.trim())
    .filter(Boolean);
}

function detectRisks(text: string) {
  const risks = [];
  if (/perpetual|unlimited|in perpetuity/i.test(text)) {
    risks.push({ type: "usage", message: "Contract contains perpetual or unlimited usage rights." });
  }
  if (/exclusive/i.test(text)) {
    risks.push({ type: "exclusivity", message: "Exclusivity clause detected." });
  }
  if (/no compensation|unpaid|gift/i.test(text)) {
    risks.push({ type: "compensation", message: "Possible missing or low compensation." });
  }
  return risks;
}

function buildRedlines(risks: any[]) {
  return risks.map((r) => ({
    clause: r.type,
    suggestion: `AI suggests revising the ${r.type} clause to ensure fair creator protection.`
  }));
}

function extractTerms(text: string) {
  const terms: Array<{ label: string; value: string; category: string }> = [];
  const fee = text.match(/£\\d{2,}/);
  if (fee) {
    terms.push({ label: "Fee", value: fee[0], category: "compensation" });
  }
  if (/story|post|video/i.test(text)) {
    terms.push({
      label: "Deliverables",
      value: text.match(/story|post|video/gi)?.join(", ") || "",
      category: "deliverables"
    });
  }
  if (/perpetual|in perpetuity|unlimited/i.test(text)) {
    terms.push({ label: "Usage Rights", value: "Perpetual / Unlimited", category: "usage" });
  }
  return terms;
}

function mapDealFromContract(terms: any[]) {
  const deliverables = terms.filter((t) => t.category === "deliverables");
  const fee = terms.find((t) => t.category === "compensation");

  return {
    deliverables: deliverables.map((d) => d.value),
    fee: fee?.value || null,
    usage: terms.find((t) => t.category === "usage")?.value || null
  };
}
