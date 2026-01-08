/**
 * Gmail email parsing utilities
 */

export function cleanEmailBody(body: string): string {
  if (!body) return "";
  // Remove forwarded messages and quoted text
  return body
    .split(/^On.*?wrote:|^>.*?$/gm)[0]
    .trim()
    .substring(0, 5000); // Limit to 5000 chars
}

export function parseEmailBody(body: string): {
  text: string;
  hasQuotedText: boolean;
} {
  const text = cleanEmailBody(body);
  const hasQuotedText = /^>|^On.*?wrote:/m.test(body);
  return { text, hasQuotedText };
}

export function extractSenders(headers: any[]): string[] {
  const fromHeaders = headers?.filter((h: any) => h.name === "From") ?? [];
  return fromHeaders.map((h: any) => h.value);
}

export function extractSubject(headers: any[]): string | null {
  const subjectHeader = headers?.find((h: any) => h.name === "Subject");
  return subjectHeader?.value ?? null;
}
