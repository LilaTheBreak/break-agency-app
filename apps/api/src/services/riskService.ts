const PATTERNS = [
  {
    id: "no-contact-info",
    label: "Missing Contact Details",
    test: (text: string) => !/(@|\.com|\.co\.uk|http|www)/i.test(text),
    severity: "medium",
    message: "This message does not appear to contain any email, website, or identifiable contact information."
  },
  {
    id: "crypto-payment",
    label: "Crypto / Gift Card Payment",
    test: (text: string) => /(bitcoin|crypto|ethereum|gift card|steam card|apple card)/i.test(text),
    severity: "high",
    message: "This deal mentions payments through crypto or gift cards, which is a common scam pattern."
  },
  {
    id: "too-good-to-be-true",
    label: "Unrealistic Claims",
    test: (text: string) => /(guaranteed|instant|risk-free|earn.*per day|make \$?\d{4,})/i.test(text),
    severity: "high",
    message: "This message contains unrealistic guaranteed income or similar claims."
  },
  {
    id: "urgent-pressure",
    label: "Pressure / Urgency",
    test: (text: string) => /(urgent|act now|final chance|limited availability|only today)/i.test(text),
    severity: "low",
    message: "This message contains pressuring language which can be a red flag."
  },
  {
    id: "id-request",
    label: "Identity Document Request",
    test: (text: string) => /(passport|id card|driving licence|identity verification|bank statement)/i.test(text),
    severity: "medium",
    message: "The sender is requesting sensitive identity documents. Ensure you trust the source."
  }
];

export function detectRisks(text: string) {
  const findings = PATTERNS.filter((p) => p.test(text)).map((p) => ({
    id: p.id,
    severity: p.severity,
    message: p.message
  }));

  const summary = findings.length === 0 ? "No obvious risk patterns detected." : `${findings.length} potential risk indicators found.`;

  return { summary, findings };
}
